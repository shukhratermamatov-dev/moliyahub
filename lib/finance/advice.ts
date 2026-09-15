import { formatMoney, formatPct, formatRatio } from "../utils";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { computeFrozenAssets, computeMarginBridge, computeRevenueSafetyMargin } from "./insights";
import type { AiAdvice, FinanceData, FinancialRatios, MinimalFinanceData, Recommendation, RedFlag } from "./types";

export function buildRuleAdvice(
  data: MinimalFinanceData,
  ratios: FinancialRatios,
  dict: Dictionary,
  locale: Locale,
  fullData: FinanceData,
): AiAdvice {
  const t = dict.adviceTemplates;
  const red_flags: RedFlag[] = [];
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: Recommendation[] = [];

  const marginBridge = computeMarginBridge(fullData);
  const frozenAssets = computeFrozenAssets(fullData, data.totalAssets);
  const safetyMargin = computeRevenueSafetyMargin(fullData);

  if (ratios.currentRatio !== null && ratios.currentRatio < 1) {
    red_flags.push({
      indicator: t.lowCurrentRatio.indicator,
      value: formatRatio(ratios.currentRatio),
      why_critical: t.lowCurrentRatio.whyCritical,
      priority: 1,
    });
    recommendations.push({
      title: t.lowCurrentRatio.recTitle,
      description: t.lowCurrentRatio.recDescription,
      expected_effect: t.lowCurrentRatio.recEffect,
      priority: 1,
      difficulty: "medium",
      timeframe: t.lowCurrentRatio.recTimeframe,
    });
  } else if (ratios.currentRatio !== null && ratios.currentRatio >= 1.5) {
    strengths.push(t.goodCurrentRatio);
  }

  if (data.netProfit < 0) {
    red_flags.push({
      indicator: t.negativeProfit.indicator,
      value: formatMoney(data.netProfit, locale),
      why_critical: t.negativeProfit.whyCritical,
      priority: 1,
    });
    recommendations.push({
      title: t.negativeProfit.recTitle,
      description: t.negativeProfit.recDescription,
      expected_effect: t.negativeProfit.recEffect,
      priority: 1,
      difficulty: "high",
      timeframe: t.negativeProfit.recTimeframe,
    });
  }

  if (ratios.autonomyRatio !== null && ratios.autonomyRatio < 0.3) {
    red_flags.push({
      indicator: t.lowAutonomy.indicator,
      value: formatPct(ratios.autonomyRatio),
      why_critical: t.lowAutonomy.whyCritical,
      priority: 2,
    });
    recommendations.push({
      title: t.lowAutonomy.recTitle,
      description: t.lowAutonomy.recDescription,
      expected_effect: t.lowAutonomy.recEffect,
      priority: 2,
      difficulty: "high",
      timeframe: t.lowAutonomy.recTimeframe,
    });
  } else if (ratios.autonomyRatio !== null && ratios.autonomyRatio >= 0.5) {
    strengths.push(t.goodAutonomy);
  }

  if (ratios.absoluteLiquidity !== null && ratios.absoluteLiquidity < 0.1) {
    red_flags.push({
      indicator: t.lowAbsoluteLiquidity.indicator,
      value: formatRatio(ratios.absoluteLiquidity),
      why_critical: t.lowAbsoluteLiquidity.whyCritical,
      priority: 2,
    });
  }

  if (ratios.inventoryTurnover !== null && ratios.inventoryTurnover < 2 && data.inventory > 0) {
    red_flags.push({
      indicator: t.lowInventoryTurnover.indicator,
      value: formatRatio(ratios.inventoryTurnover, 1),
      why_critical: t.lowInventoryTurnover.whyCritical,
      priority: 3,
    });
    recommendations.push({
      title: t.lowInventoryTurnover.recTitle,
      description: t.lowInventoryTurnover.recDescription,
      expected_effect: t.lowInventoryTurnover.recEffect,
      priority: 3,
      difficulty: "medium",
      timeframe: t.lowInventoryTurnover.recTimeframe,
    });
  }

  // --- Новые проверки (расширение с 6 до ~12) ---

  if (ratios.interestCoverage !== null && ratios.interestCoverage < 1.5 && data.interestExpense > 0) {
    red_flags.push({
      indicator: t.lowInterestCoverage.indicator,
      value: formatRatio(ratios.interestCoverage),
      why_critical: t.lowInterestCoverage.whyCritical,
      priority: 2,
    });
    recommendations.push({
      title: t.lowInterestCoverage.recTitle,
      description: t.lowInterestCoverage.recDescription,
      expected_effect: t.lowInterestCoverage.recEffect,
      priority: 2,
      difficulty: "high",
      timeframe: t.lowInterestCoverage.recTimeframe,
    });
  } else if (ratios.interestCoverage !== null && ratios.interestCoverage >= 5) {
    strengths.push(t.goodInterestCoverage);
  }

  const shortTermDebtShare =
    data.longTermLiabilities + data.currentLiabilities > 0
      ? data.currentLiabilities / (data.longTermLiabilities + data.currentLiabilities)
      : null;
  if (shortTermDebtShare !== null && shortTermDebtShare > 0.7 && data.currentLiabilities > 0) {
    weaknesses.push(t.shortTermHeavyDebt(formatPct(shortTermDebtShare)));
  }

  if (ratios.roa !== null && ratios.roa >= 0 && ratios.roa < 0.03) {
    weaknesses.push(t.weakProfitability(formatPct(ratios.roa)));
  }

  if (ratios.assetTurnover !== null && ratios.assetTurnover < 0.6) {
    weaknesses.push(t.lowAssetTurnover(formatRatio(ratios.assetTurnover)));
  }

  if (frozenAssets.receivablesDays !== null && frozenAssets.receivablesDays > 60) {
    weaknesses.push(t.slowReceivables(Math.round(frozenAssets.receivablesDays)));
  }

  if (frozenAssets.shareOfTotalAssets !== null && frozenAssets.shareOfTotalAssets > 0.4) {
    weaknesses.push(t.highFrozenShare(formatPct(frozenAssets.shareOfTotalAssets)));
  }

  if (safetyMargin.status === "loses_on_every_sale" || safetyMargin.status === "already_at_or_below_breakeven") {
    red_flags.push({
      indicator: t.thinSafetyMargin.indicator,
      value: safetyMargin.status === "loses_on_every_sale" ? "0%" : formatPct(0),
      why_critical: t.thinSafetyMargin.whyCritical,
      priority: 1,
    });
  } else if (safetyMargin.safeDeclinePct !== null && safetyMargin.safeDeclinePct < 0.1) {
    red_flags.push({
      indicator: t.thinSafetyMargin.indicator,
      value: formatPct(safetyMargin.safeDeclinePct),
      why_critical: t.thinSafetyMargin.whyCritical,
      priority: 2,
    });
  } else if (safetyMargin.safeDeclinePct !== null && safetyMargin.safeDeclinePct >= 0.3) {
    strengths.push(t.goodSafetyMargin(formatPct(safetyMargin.safeDeclinePct)));
  }

  if (data.operatingProfit > 0 && ratios.ros !== null && ratios.ros >= 0.08) {
    strengths.push(t.goodRos);
  }

  if (ratios.workingCapital > 0) {
    strengths.push(t.goodWorkingCapital);
  }

  if (recommendations.length === 0) {
    recommendations.push({
      title: t.defaultRecommendation.recTitle,
      description: t.defaultRecommendation.recDescription,
      expected_effect: t.defaultRecommendation.recEffect,
      priority: 3,
      difficulty: "low",
      timeframe: t.defaultRecommendation.recTimeframe,
    });
  }

  let financing_advice = t.financingLow;
  if (ratios.score >= 70 && data.netProfit > 0) {
    financing_advice = t.financingHigh;
  } else if (ratios.score >= 45) {
    financing_advice = t.financingMid;
  }

  const tone = ratios.score >= 70 ? t.toneGood : ratios.score >= 45 ? t.toneMid : t.toneLow;

  const middle =
    data.netProfit >= 0
      ? t.summaryProfit(formatMoney(data.netProfit, locale), formatMoney(data.revenue, locale))
      : t.summaryLoss(formatMoney(data.netProfit, locale));

  // --- Текстовые комментарии к новым числовым срезам (margin/frozen/safety) ---

  const margin_commentary = marginBridge.biggestDrag
    ? t.marginCommentaryTemplate(
        dict.financeFields.labels[marginBridge.biggestDrag.key],
        formatPct(marginBridge.biggestDrag.ratio),
      )
    : t.marginCommentaryNone;

  const frozen_assets_commentary = t.frozenAssetsCommentaryTemplate(
    formatPct(frozenAssets.shareOfTotalAssets),
    frozenAssets.inventoryDays !== null ? String(Math.round(frozenAssets.inventoryDays)) : "—",
    frozenAssets.receivablesDays !== null ? String(Math.round(frozenAssets.receivablesDays)) : "—",
  );

  let safety_margin_commentary: string;
  if (safetyMargin.status === "insufficient_data") {
    safety_margin_commentary = t.safetyMarginInsufficient;
  } else if (safetyMargin.status === "loses_on_every_sale") {
    safety_margin_commentary = t.safetyMarginLoss;
  } else if (safetyMargin.status === "already_at_or_below_breakeven") {
    safety_margin_commentary = t.safetyMarginBreakEven;
  } else {
    safety_margin_commentary = t.safetyMarginOkTemplate(formatPct(safetyMargin.safeDeclinePct));
  }

  return {
    summary: t.summaryTemplate(
      tone,
      ratios.score,
      middle,
      formatPct(ratios.autonomyRatio),
      formatRatio(ratios.currentRatio),
    ),
    score_comment: t.scoreCommentTemplate(
      ratios.score,
      ratios.scoreDetails.liquidity,
      ratios.scoreDetails.profitability,
      ratios.scoreDetails.stability,
      ratios.scoreDetails.efficiency,
    ),
    red_flags: red_flags.sort((a, b) => a.priority - b.priority),
    strengths,
    weaknesses,
    recommendations: recommendations.sort((a, b) => a.priority - b.priority),
    financing_advice,
    margin_commentary,
    frozen_assets_commentary,
    safety_margin_commentary,
    // Без ИИ сравнить с отраслью честно нечем — веб-поиск делает только ИИ-режим.
    benchmark: { available: false, note: t.benchmarkRulesNote, comparisons: [] },
    source: "rules",
  };
}
