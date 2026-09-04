import { formatMoney, formatPct, formatRatio } from "../utils";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import type { AiAdvice, FinancialRatios, MinimalFinanceData, Recommendation, RedFlag } from "./types";

export function buildRuleAdvice(
  data: MinimalFinanceData,
  ratios: FinancialRatios,
  dict: Dictionary,
  locale: Locale,
): AiAdvice {
  const t = dict.adviceTemplates;
  const red_flags: RedFlag[] = [];
  const strengths: string[] = [];
  const recommendations: Recommendation[] = [];

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
    recommendations: recommendations.sort((a, b) => a.priority - b.priority),
    financing_advice,
    source: "rules",
  };
}
