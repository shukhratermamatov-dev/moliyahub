export type MinimalFinanceData = {
  currentAssets: number;
  inventory: number;
  cash: number;
  shortTermReceivables: number;
  totalAssets: number;
  equity: number;
  longTermLiabilities: number;
  currentLiabilities: number;
  shortTermLoans: number;
  revenue: number;
  costOfSales: number;
  grossProfit: number;
  operatingProfit: number;
  netProfit: number;
  interestExpense: number;
};

export type ScoreDetails = {
  liquidity: number;
  profitability: number;
  stability: number;
  efficiency: number;
};

export type FinancialRatios = {
  currentRatio: number | null;
  quickRatio: number | null;
  absoluteLiquidity: number | null;
  roa: number | null;
  roe: number | null;
  ros: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  autonomyRatio: number | null;
  debtRatio: number | null;
  equityToDebt: number | null;
  workingCapital: number;
  assetTurnover: number | null;
  inventoryTurnover: number | null;
  interestCoverage: number | null;
  score: number;
  scoreDetails: ScoreDetails;
};

export type RedFlag = {
  indicator: string;
  value: string;
  why_critical: string;
  priority: number;
};

export type Recommendation = {
  title: string;
  description: string;
  expected_effect: string;
  priority: number;
  difficulty: "low" | "medium" | "high";
  timeframe: string;
};

export type AiAdvice = {
  summary: string;
  score_comment: string;
  red_flags: RedFlag[];
  strengths: string[];
  recommendations: Recommendation[];
  financing_advice: string;
  source: "ai" | "rules";
};

export const EMPTY_FINANCE: MinimalFinanceData = {
  currentAssets: 0,
  inventory: 0,
  cash: 0,
  shortTermReceivables: 0,
  totalAssets: 0,
  equity: 0,
  longTermLiabilities: 0,
  currentLiabilities: 0,
  shortTermLoans: 0,
  revenue: 0,
  costOfSales: 0,
  grossProfit: 0,
  operatingProfit: 0,
  netProfit: 0,
  interestExpense: 0,
};

export const DEMO_FINANCE: MinimalFinanceData = {
  currentAssets: 1_200_000_000,
  inventory: 400_000_000,
  cash: 250_000_000,
  shortTermReceivables: 350_000_000,
  totalAssets: 3_500_000_000,
  equity: 2_100_000_000,
  longTermLiabilities: 800_000_000,
  currentLiabilities: 600_000_000,
  shortTermLoans: 200_000_000,
  revenue: 5_000_000_000,
  costOfSales: 3_200_000_000,
  grossProfit: 1_800_000_000,
  operatingProfit: 750_000_000,
  netProfit: 520_000_000,
  interestExpense: 80_000_000,
};

export const WEAK_FINANCE: MinimalFinanceData = {
  currentAssets: 300_000_000,
  inventory: 180_000_000,
  cash: 20_000_000,
  shortTermReceivables: 90_000_000,
  totalAssets: 1_200_000_000,
  equity: 250_000_000,
  longTermLiabilities: 400_000_000,
  currentLiabilities: 550_000_000,
  shortTermLoans: 300_000_000,
  revenue: 1_800_000_000,
  costOfSales: 1_500_000_000,
  grossProfit: 300_000_000,
  operatingProfit: -50_000_000,
  netProfit: -120_000_000,
  interestExpense: 90_000_000,
};

export const FINANCE_FIELDS: {
  key: keyof MinimalFinanceData;
  label: string;
  group: "Баланс" | "ОПУ";
}[] = [
  { key: "currentAssets", label: "Текущие активы", group: "Баланс" },
  { key: "inventory", label: "Запасы", group: "Баланс" },
  { key: "cash", label: "Денежные средства", group: "Баланс" },
  { key: "shortTermReceivables", label: "Краткосрочная дебиторка", group: "Баланс" },
  { key: "totalAssets", label: "Всего активов", group: "Баланс" },
  { key: "equity", label: "Собственный капитал", group: "Баланс" },
  { key: "longTermLiabilities", label: "Долгосрочные обязательства", group: "Баланс" },
  { key: "currentLiabilities", label: "Текущие обязательства", group: "Баланс" },
  { key: "shortTermLoans", label: "Краткосрочные кредиты", group: "Баланс" },
  { key: "revenue", label: "Выручка", group: "ОПУ" },
  { key: "costOfSales", label: "Себестоимость", group: "ОПУ" },
  { key: "grossProfit", label: "Валовая прибыль", group: "ОПУ" },
  { key: "operatingProfit", label: "Операционная прибыль", group: "ОПУ" },
  { key: "netProfit", label: "Чистая прибыль", group: "ОПУ" },
  { key: "interestExpense", label: "Процентные расходы", group: "ОПУ" },
];

// ---------------------------------------------------------------------------
// Расширенная, практичная форма баланса и ОПУ (близкая к официальным формам
// №1 «Бухгалтерский баланс» и №2 «Отчёт о финансовых результатах» НСБУ РУз,
// укрупнённые статьи — без разбивки до отдельных счетов). Пользователь вводит
// именно эти статьи; агрегаты для коэффициентов (MinimalFinanceData выше)
// считаются из них в lib/finance/aggregate.ts.
// ---------------------------------------------------------------------------

export type FinanceData = {
  // Баланс — I. Долгосрочные активы
  intangibleAssets: number;
  fixedAssets: number;
  longTermInvestments: number;
  equipmentForInstallation: number;
  capitalInvestments: number;
  longTermReceivables: number;
  otherLongTermAssets: number;
  // Баланс — II. Текущие активы
  inventory: number;
  prepaidExpenses: number;
  receivables: number;
  cash: number;
  shortTermInvestments: number;
  otherCurrentAssets: number;
  // Баланс — Собственный капитал
  charterCapital: number;
  additionalCapital: number;
  reserveCapital: number;
  retainedEarnings: number;
  targetFundsAndReserves: number;
  treasuryShares: number;
  // Баланс — Долгосрочные обязательства
  longTermLoans: number;
  otherLongTermLiabilities: number;
  // Баланс — Текущие обязательства
  payables: number;
  wagesPayable: number;
  taxesPayable: number;
  shortTermLoans: number;
  advancesReceived: number;
  otherCurrentLiabilities: number;
  // ОПУ (Отчёт о финансовых результатах)
  revenue: number;
  costOfSales: number;
  distributionCosts: number;
  adminExpenses: number;
  otherOperatingIncome: number;
  otherOperatingExpenses: number;
  financialIncome: number;
  interestExpense: number;
  incomeTax: number;
};

export type FinanceFieldKey = keyof FinanceData;

export type FinanceGroupKey =
  | "longTermAssets"
  | "currentAssets"
  | "equity"
  | "longTermLiabilities"
  | "currentLiabilities"
  | "pnl";

export const FINANCE_GROUPS: { key: FinanceGroupKey; fields: FinanceFieldKey[] }[] = [
  {
    key: "longTermAssets",
    fields: [
      "intangibleAssets",
      "fixedAssets",
      "longTermInvestments",
      "equipmentForInstallation",
      "capitalInvestments",
      "longTermReceivables",
      "otherLongTermAssets",
    ],
  },
  {
    key: "currentAssets",
    fields: ["inventory", "prepaidExpenses", "receivables", "cash", "shortTermInvestments", "otherCurrentAssets"],
  },
  {
    key: "equity",
    fields: [
      "charterCapital",
      "additionalCapital",
      "reserveCapital",
      "retainedEarnings",
      "targetFundsAndReserves",
      "treasuryShares",
    ],
  },
  { key: "longTermLiabilities", fields: ["longTermLoans", "otherLongTermLiabilities"] },
  {
    key: "currentLiabilities",
    fields: ["payables", "wagesPayable", "taxesPayable", "shortTermLoans", "advancesReceived", "otherCurrentLiabilities"],
  },
  {
    key: "pnl",
    fields: [
      "revenue",
      "costOfSales",
      "distributionCosts",
      "adminExpenses",
      "otherOperatingIncome",
      "otherOperatingExpenses",
      "financialIncome",
      "interestExpense",
      "incomeTax",
    ],
  },
];

export const EMPTY_FINANCE_DATA: FinanceData = {
  intangibleAssets: 0,
  fixedAssets: 0,
  longTermInvestments: 0,
  equipmentForInstallation: 0,
  capitalInvestments: 0,
  longTermReceivables: 0,
  otherLongTermAssets: 0,
  inventory: 0,
  prepaidExpenses: 0,
  receivables: 0,
  cash: 0,
  shortTermInvestments: 0,
  otherCurrentAssets: 0,
  charterCapital: 0,
  additionalCapital: 0,
  reserveCapital: 0,
  retainedEarnings: 0,
  targetFundsAndReserves: 0,
  treasuryShares: 0,
  longTermLoans: 0,
  otherLongTermLiabilities: 0,
  payables: 0,
  wagesPayable: 0,
  taxesPayable: 0,
  shortTermLoans: 0,
  advancesReceived: 0,
  otherCurrentLiabilities: 0,
  revenue: 0,
  costOfSales: 0,
  distributionCosts: 0,
  adminExpenses: 0,
  otherOperatingIncome: 0,
  otherOperatingExpenses: 0,
  financialIncome: 0,
  interestExpense: 0,
  incomeTax: 0,
};

// Согласовано с прежними DEMO_FINANCE/WEAK_FINANCE: агрегаты (см.
// lib/finance/aggregate.ts) получаются теми же, что и раньше, поэтому
// баллы/рекомендации для этих двух примеров не меняются.
export const DEMO_FINANCE_DATA: FinanceData = {
  intangibleAssets: 60_000_000,
  fixedAssets: 1_800_000_000,
  longTermInvestments: 150_000_000,
  equipmentForInstallation: 50_000_000,
  capitalInvestments: 180_000_000,
  longTermReceivables: 40_000_000,
  otherLongTermAssets: 20_000_000,
  inventory: 400_000_000,
  prepaidExpenses: 60_000_000,
  receivables: 350_000_000,
  cash: 250_000_000,
  shortTermInvestments: 90_000_000,
  otherCurrentAssets: 50_000_000,
  charterCapital: 1_000_000_000,
  additionalCapital: 300_000_000,
  reserveCapital: 100_000_000,
  retainedEarnings: 750_000_000,
  targetFundsAndReserves: 20_000_000,
  treasuryShares: 70_000_000,
  longTermLoans: 700_000_000,
  otherLongTermLiabilities: 100_000_000,
  payables: 220_000_000,
  wagesPayable: 60_000_000,
  taxesPayable: 50_000_000,
  shortTermLoans: 200_000_000,
  advancesReceived: 40_000_000,
  otherCurrentLiabilities: 30_000_000,
  revenue: 5_000_000_000,
  costOfSales: 3_200_000_000,
  distributionCosts: 500_000_000,
  adminExpenses: 450_000_000,
  otherOperatingIncome: 50_000_000,
  otherOperatingExpenses: 150_000_000,
  financialIncome: 10_000_000,
  interestExpense: 80_000_000,
  incomeTax: 160_000_000,
};

export const WEAK_FINANCE_DATA: FinanceData = {
  intangibleAssets: 20_000_000,
  fixedAssets: 750_000_000,
  longTermInvestments: 50_000_000,
  equipmentForInstallation: 30_000_000,
  capitalInvestments: 40_000_000,
  longTermReceivables: 5_000_000,
  otherLongTermAssets: 5_000_000,
  inventory: 180_000_000,
  prepaidExpenses: 5_000_000,
  receivables: 90_000_000,
  cash: 20_000_000,
  shortTermInvestments: 0,
  otherCurrentAssets: 5_000_000,
  charterCapital: 230_000_000,
  additionalCapital: 30_000_000,
  reserveCapital: 10_000_000,
  retainedEarnings: -10_000_000,
  targetFundsAndReserves: 0,
  treasuryShares: 10_000_000,
  longTermLoans: 350_000_000,
  otherLongTermLiabilities: 50_000_000,
  payables: 120_000_000,
  wagesPayable: 40_000_000,
  taxesPayable: 30_000_000,
  shortTermLoans: 300_000_000,
  advancesReceived: 30_000_000,
  otherCurrentLiabilities: 30_000_000,
  revenue: 1_800_000_000,
  costOfSales: 1_500_000_000,
  distributionCosts: 150_000_000,
  adminExpenses: 180_000_000,
  otherOperatingIncome: 10_000_000,
  otherOperatingExpenses: 30_000_000,
  financialIncome: 20_000_000,
  interestExpense: 90_000_000,
  incomeTax: 0,
};
