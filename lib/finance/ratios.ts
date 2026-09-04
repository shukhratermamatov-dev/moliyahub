import type { FinancialRatios, MinimalFinanceData } from "./types";

function safeDiv(numerator: number, denominator: number): number | null {
  if (denominator === 0 || !Number.isFinite(denominator) || !Number.isFinite(numerator)) {
    return null;
  }
  return numerator / denominator;
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

function scoreLiquidity(
  current: number | null,
  quick: number | null,
  absolute: number | null,
): number {
  let score = 50;
  if (current !== null) {
    if (current >= 2) score += 20;
    else if (current >= 1.5) score += 15;
    else if (current >= 1.2) score += 8;
    else if (current >= 1) score += 0;
    else score -= 20;
  }
  if (quick !== null) {
    if (quick >= 1) score += 15;
    else if (quick >= 0.7) score += 8;
    else score -= 10;
  }
  if (absolute !== null) {
    if (absolute >= 0.2) score += 15;
    else if (absolute >= 0.1) score += 5;
    else score -= 10;
  }
  return clamp(score);
}

function scoreProfitability(
  roa: number | null,
  roe: number | null,
  ros: number | null,
): number {
  let score = 40;
  if (roa !== null) {
    if (roa >= 0.15) score += 20;
    else if (roa >= 0.08) score += 12;
    else if (roa >= 0.03) score += 5;
    else if (roa < 0) score -= 25;
  }
  if (roe !== null) {
    if (roe >= 0.2) score += 20;
    else if (roe >= 0.12) score += 12;
    else if (roe >= 0.05) score += 5;
    else if (roe < 0) score -= 20;
  }
  if (ros !== null) {
    if (ros >= 0.1) score += 10;
    else if (ros >= 0.05) score += 5;
    else if (ros < 0) score -= 15;
  }
  return clamp(score);
}

function scoreStability(
  autonomy: number | null,
  debt: number | null,
  wc: number,
): number {
  let score = 50;
  if (autonomy !== null) {
    if (autonomy >= 0.5) score += 25;
    else if (autonomy >= 0.4) score += 15;
    else if (autonomy >= 0.3) score += 5;
    else score -= 20;
  }
  if (debt !== null) {
    if (debt <= 0.4) score += 15;
    else if (debt <= 0.6) score += 5;
    else score -= 15;
  }
  if (wc > 0) score += 10;
  else score -= 15;
  return clamp(score);
}

function scoreEfficiency(assetTurnover: number | null, invTurnover: number | null): number {
  let score = 50;
  if (assetTurnover !== null) {
    if (assetTurnover >= 1.5) score += 25;
    else if (assetTurnover >= 1) score += 15;
    else if (assetTurnover >= 0.6) score += 5;
    else score -= 10;
  }
  if (invTurnover !== null) {
    if (invTurnover >= 6) score += 25;
    else if (invTurnover >= 4) score += 15;
    else if (invTurnover >= 2) score += 5;
    else score -= 10;
  }
  return clamp(score);
}

export function calculateRatios(data: MinimalFinanceData): FinancialRatios {
  const {
    currentAssets,
    inventory,
    cash,
    totalAssets,
    equity,
    longTermLiabilities,
    currentLiabilities,
    revenue,
    costOfSales,
    grossProfit,
    operatingProfit,
    netProfit,
    interestExpense,
  } = data;

  const currentRatio = safeDiv(currentAssets, currentLiabilities);
  const quickRatio = safeDiv(currentAssets - inventory, currentLiabilities);
  const absoluteLiquidity = safeDiv(cash, currentLiabilities);
  const roa = safeDiv(netProfit, totalAssets);
  const roe = safeDiv(netProfit, equity);
  const ros = safeDiv(netProfit, revenue);
  const grossMargin = safeDiv(grossProfit, revenue);
  const operatingMargin = safeDiv(operatingProfit, revenue);
  const autonomyRatio = safeDiv(equity, totalAssets);
  const totalLiabilities = longTermLiabilities + currentLiabilities;
  const debtRatio = safeDiv(totalLiabilities, totalAssets);
  const equityToDebt = safeDiv(equity, totalLiabilities);
  const workingCapital = currentAssets - currentLiabilities;
  const assetTurnover = safeDiv(revenue, totalAssets);
  const inventoryTurnover = safeDiv(costOfSales, inventory);
  const interestCoverage = safeDiv(operatingProfit, interestExpense);

  const scoreDetails = {
    liquidity: scoreLiquidity(currentRatio, quickRatio, absoluteLiquidity),
    profitability: scoreProfitability(roa, roe, ros),
    stability: scoreStability(autonomyRatio, debtRatio, workingCapital),
    efficiency: scoreEfficiency(assetTurnover, inventoryTurnover),
  };

  const score = Math.round(
    scoreDetails.liquidity * 0.25 +
      scoreDetails.profitability * 0.3 +
      scoreDetails.stability * 0.25 +
      scoreDetails.efficiency * 0.2,
  );

  return {
    currentRatio,
    quickRatio,
    absoluteLiquidity,
    roa,
    roe,
    ros,
    grossMargin,
    operatingMargin,
    autonomyRatio,
    debtRatio,
    equityToDebt,
    workingCapital,
    assetTurnover,
    inventoryTurnover,
    interestCoverage,
    score: clamp(score),
    scoreDetails,
  };
}

export function monthlyPayment(principal: number, annualRatePct: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / months;
  const pow = (1 + r) ** months;
  return (principal * r * pow) / (pow - 1);
}
