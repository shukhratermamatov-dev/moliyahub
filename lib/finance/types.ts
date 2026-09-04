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
