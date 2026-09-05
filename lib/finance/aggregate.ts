import type { FinanceData, MinimalFinanceData } from "./types";

export type FinanceSubtotals = {
  longTermAssetsTotal: number;
  currentAssetsTotal: number;
  totalAssets: number;
  equityTotal: number;
  longTermLiabilitiesTotal: number;
  currentLiabilitiesTotal: number;
  totalLiabilitiesAndEquity: number;
  balanceDiff: number;
  grossProfit: number;
  operatingProfit: number;
  profitBeforeTax: number;
  netProfit: number;
};

// Считает подытоги статей (для отображения в форме и в экспортах) —
// без изменения самих исходных данных FinanceData.
export function computeSubtotals(d: FinanceData): FinanceSubtotals {
  const longTermAssetsTotal =
    d.intangibleAssets +
    d.fixedAssets +
    d.longTermInvestments +
    d.equipmentForInstallation +
    d.capitalInvestments +
    d.longTermReceivables +
    d.otherLongTermAssets;

  const currentAssetsTotal =
    d.inventory + d.prepaidExpenses + d.receivables + d.cash + d.shortTermInvestments + d.otherCurrentAssets;

  const totalAssets = longTermAssetsTotal + currentAssetsTotal;

  const equityTotal =
    d.charterCapital +
    d.additionalCapital +
    d.reserveCapital +
    d.retainedEarnings +
    d.targetFundsAndReserves -
    d.treasuryShares;

  const longTermLiabilitiesTotal = d.longTermLoans + d.otherLongTermLiabilities;

  const currentLiabilitiesTotal =
    d.payables + d.wagesPayable + d.taxesPayable + d.shortTermLoans + d.advancesReceived + d.otherCurrentLiabilities;

  const totalLiabilitiesAndEquity = equityTotal + longTermLiabilitiesTotal + currentLiabilitiesTotal;

  const grossProfit = d.revenue - d.costOfSales;
  const operatingProfit =
    grossProfit + d.otherOperatingIncome - d.otherOperatingExpenses - d.distributionCosts - d.adminExpenses;
  const profitBeforeTax = operatingProfit + d.financialIncome - d.interestExpense;
  const netProfit = profitBeforeTax - d.incomeTax;

  return {
    longTermAssetsTotal,
    currentAssetsTotal,
    totalAssets,
    equityTotal,
    longTermLiabilitiesTotal,
    currentLiabilitiesTotal,
    totalLiabilitiesAndEquity,
    balanceDiff: totalAssets - totalLiabilitiesAndEquity,
    grossProfit,
    operatingProfit,
    profitBeforeTax,
    netProfit,
  };
}

// Сворачивает расширённые статьи FinanceData в агрегаты MinimalFinanceData,
// на которых работают существующие calculateRatios()/buildRuleAdvice() —
// их логика и формулы коэффициентов не меняются.
export function deriveAggregates(d: FinanceData): MinimalFinanceData {
  const s = computeSubtotals(d);
  return {
    currentAssets: s.currentAssetsTotal,
    inventory: d.inventory,
    cash: d.cash,
    shortTermReceivables: d.receivables,
    totalAssets: s.totalAssets,
    equity: s.equityTotal,
    longTermLiabilities: s.longTermLiabilitiesTotal,
    currentLiabilities: s.currentLiabilitiesTotal,
    shortTermLoans: d.shortTermLoans,
    revenue: d.revenue,
    costOfSales: d.costOfSales,
    grossProfit: s.grossProfit,
    operatingProfit: s.operatingProfit,
    netProfit: s.netProfit,
    interestExpense: d.interestExpense,
  };
}
