import type { FinanceData, FinanceFieldKey } from "./types";

// ---------------------------------------------------------------------------
// Дополнительные аналитические срезы поверх FinanceData — считаются в коде
// (не ИИ), чтобы цифры были точными и одинаковыми что в режиме "Посчитать
// сейчас", что в режиме ИИ-анализа (ИИ только комментирует уже посчитанные
// числа, а не пересчитывает их сам). Используются на /analyze, а также в
// промпте ИИ (lib/ai/analyze.ts) и в правилах-фолбэке (lib/finance/advice.ts).
// ---------------------------------------------------------------------------

function safeDiv(numerator: number, denominator: number): number | null {
  if (denominator === 0 || !Number.isFinite(denominator) || !Number.isFinite(numerator)) {
    return null;
  }
  return numerator / denominator;
}

// --- 1. Где теряется маржа: разложение выручки на себестоимость и статьи
// расходов ОПУ, чтобы видеть, какая статья "съедает" маржу сильнее всего. ---

export type MarginDragKey =
  | "costOfSales"
  | "distributionCosts"
  | "adminExpenses"
  | "otherOperatingExpenses"
  | "interestExpense"
  | "incomeTax";

export type MarginBridge = {
  revenue: number;
  costOfSalesRatio: number | null;
  grossMarginRatio: number | null;
  distributionCostsRatio: number | null;
  adminExpensesRatio: number | null;
  otherOperatingNetRatio: number | null;
  operatingMarginRatio: number | null;
  interestNetRatio: number | null;
  taxRatio: number | null;
  netMarginRatio: number | null;
  // Крупнейшая статья, "съедающая" маржу после себестоимости (по доле от выручки).
  biggestDrag: { key: MarginDragKey; ratio: number } | null;
};

export function computeMarginBridge(d: FinanceData): MarginBridge {
  const revenue = d.revenue;
  const grossProfit = d.revenue - d.costOfSales;
  const otherOperatingNet = d.otherOperatingExpenses - d.otherOperatingIncome;
  const operatingProfit = grossProfit - d.distributionCosts - d.adminExpenses - otherOperatingNet;
  const interestNet = d.interestExpense - d.financialIncome;
  const profitBeforeTax = operatingProfit - interestNet;
  const netProfit = profitBeforeTax - d.incomeTax;

  const drags: { key: MarginDragKey; amount: number }[] = [
    { key: "distributionCosts", amount: d.distributionCosts },
    { key: "adminExpenses", amount: d.adminExpenses },
    { key: "otherOperatingExpenses", amount: Math.max(otherOperatingNet, 0) },
    { key: "interestExpense", amount: Math.max(interestNet, 0) },
    { key: "incomeTax", amount: Math.max(d.incomeTax, 0) },
  ];
  let biggestDrag: MarginBridge["biggestDrag"] = null;
  if (revenue > 0) {
    const top = drags.reduce((a, b) => (b.amount > a.amount ? b : a));
    if (top.amount > 0) {
      biggestDrag = { key: top.key, ratio: top.amount / revenue };
    }
  }

  return {
    revenue,
    costOfSalesRatio: safeDiv(d.costOfSales, revenue),
    grossMarginRatio: safeDiv(grossProfit, revenue),
    distributionCostsRatio: safeDiv(d.distributionCosts, revenue),
    adminExpensesRatio: safeDiv(d.adminExpenses, revenue),
    otherOperatingNetRatio: safeDiv(otherOperatingNet, revenue),
    operatingMarginRatio: safeDiv(operatingProfit, revenue),
    interestNetRatio: safeDiv(interestNet, revenue),
    taxRatio: safeDiv(d.incomeTax, revenue),
    netMarginRatio: safeDiv(netProfit, revenue),
    biggestDrag,
  };
}

// --- 2. Какие активы замораживают свободные деньги: неликвидные/медленные
// статьи активов, ранжированные по сумме, плюс дни оборота запасов/дебиторки. ---

const FROZEN_ASSET_CANDIDATES: FinanceFieldKey[] = [
  "inventory",
  "receivables",
  "longTermReceivables",
  "prepaidExpenses",
  "capitalInvestments",
  "equipmentForInstallation",
  "longTermInvestments",
  "otherCurrentAssets",
  "otherLongTermAssets",
];

export type FrozenAssetItem = { key: FinanceFieldKey; amount: number; shareOfAssets: number | null };

export type FrozenAssetsAnalysis = {
  items: FrozenAssetItem[]; // top-5 по сумме, только > 0
  totalFrozen: number;
  shareOfTotalAssets: number | null;
  inventoryDays: number | null; // запасы / себестоимость * 365
  receivablesDays: number | null; // дебиторка / выручка * 365
};

export function computeFrozenAssets(d: FinanceData, totalAssets: number): FrozenAssetsAnalysis {
  const items: FrozenAssetItem[] = FROZEN_ASSET_CANDIDATES.map((key) => ({
    key,
    amount: d[key],
    shareOfAssets: safeDiv(d[key], totalAssets),
  }))
    .filter((i) => i.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const totalFrozen = FROZEN_ASSET_CANDIDATES.reduce((sum, key) => sum + Math.max(d[key], 0), 0);

  return {
    items,
    totalFrozen,
    shareOfTotalAssets: safeDiv(totalFrozen, totalAssets),
    inventoryDays: (() => {
      const r = safeDiv(d.inventory, d.costOfSales);
      return r === null ? null : r * 365;
    })(),
    receivablesDays: (() => {
      const r = safeDiv(d.receivables, d.revenue);
      return r === null ? null : r * 365;
    })(),
  };
}

// --- 3. Безопасный порог снижения выручки: запас прочности до выхода в
// операционный убыток (классический "margin of safety" из управленческого
// учёта). Себестоимость считается переменной частью, расходы по реализации +
// админ. + прочие операционные (за вычетом прочих операционных доходов) —
// условно постоянной частью. Проценты и налог на прибыль в саму формулу не
// включены (они не масштабируются с выручкой линейно) — это дополнительно
// поясняется в тексте комментария, а не в формуле. ---

export type RevenueSafetyMargin = {
  currentRevenue: number;
  contributionMarginRatio: number | null; // валовая маржа = условно-переменная часть
  fixedCosts: number; // расходы по реализации + админ. + прочие операционные net
  breakEvenRevenue: number | null;
  safeDeclineAmount: number | null;
  safeDeclinePct: number | null; // 0..1, доля от текущей выручки
  status: "ok" | "already_at_or_below_breakeven" | "loses_on_every_sale" | "insufficient_data";
};

export function computeRevenueSafetyMargin(d: FinanceData): RevenueSafetyMargin {
  const revenue = d.revenue;
  const fixedCosts = d.distributionCosts + d.adminExpenses + Math.max(d.otherOperatingExpenses - d.otherOperatingIncome, 0);
  const contributionMarginRatio = safeDiv(revenue - d.costOfSales, revenue);

  if (revenue <= 0) {
    return {
      currentRevenue: revenue,
      contributionMarginRatio,
      fixedCosts,
      breakEvenRevenue: null,
      safeDeclineAmount: null,
      safeDeclinePct: null,
      status: "insufficient_data",
    };
  }
  if (contributionMarginRatio === null || contributionMarginRatio <= 0) {
    return {
      currentRevenue: revenue,
      contributionMarginRatio,
      fixedCosts,
      breakEvenRevenue: null,
      safeDeclineAmount: null,
      safeDeclinePct: null,
      status: "loses_on_every_sale",
    };
  }

  const breakEvenRevenue = fixedCosts / contributionMarginRatio;
  const safeDeclineAmount = revenue - breakEvenRevenue;
  const safeDeclinePct = Math.max(safeDeclineAmount / revenue, 0);

  return {
    currentRevenue: revenue,
    contributionMarginRatio,
    fixedCosts,
    breakEvenRevenue,
    safeDeclineAmount,
    safeDeclinePct,
    status: safeDeclineAmount <= 0 ? "already_at_or_below_breakeven" : "ok",
  };
}
