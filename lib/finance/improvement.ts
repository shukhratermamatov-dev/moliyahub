import { formatMoney } from "../utils";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import type { FinancialRatios, MinimalFinanceData } from "./types";

export type ImprovementItemKey =
  | "currentRatio"
  | "absoluteLiquidity"
  | "autonomyRatio"
  | "debtRatio"
  | "interestCoverage"
  | "inventoryTurnover"
  | "roa";

export type ImprovementItem = {
  key: ImprovementItemKey;
  text: string;
};

// Детерминированный план улучшения показателей — считается в обычном
// TypeScript, а не ИИ, поэтому цифры всегда точные и работают независимо от
// того, доступен ли внешний ИИ-сервис (см. lib/ai/analyze.ts). Для каждого
// показателя, который сейчас вне нормы, вычисляем, на какую сумму нужно
// изменить конкретную статью баланса/ОПУ (при прочих равных), чтобы
// показатель вошёл в норму. Пороги нормы согласованы с уже существующими в
// коде порогами: lib/finance/ratios.ts (веса скоринга) и
// lib/finance/advice.ts (сильные/слабые стороны, красные флаги) — чтобы
// "норма" здесь означала то же самое, что и на остальной странице.
export function computeImprovementPlan(
  data: MinimalFinanceData,
  ratios: FinancialRatios,
  dict: Dictionary,
  locale: Locale,
): ImprovementItem[] {
  const t = dict.panel.improvementPlan;
  const items: ImprovementItem[] = [];
  const money = (n: number) => formatMoney(Math.round(n), locale);

  if (ratios.currentRatio !== null && ratios.currentRatio < 1.5 && data.currentLiabilities > 0) {
    const delta = 1.5 * data.currentLiabilities - data.currentAssets;
    if (delta > 0) items.push({ key: "currentRatio", text: t.currentRatio(money(delta)) });
  }

  if (ratios.absoluteLiquidity !== null && ratios.absoluteLiquidity < 0.2 && data.currentLiabilities > 0) {
    const delta = 0.2 * data.currentLiabilities - data.cash;
    if (delta > 0) items.push({ key: "absoluteLiquidity", text: t.absoluteLiquidity(money(delta)) });
  }

  if (ratios.autonomyRatio !== null && ratios.autonomyRatio < 0.5 && data.totalAssets > 0) {
    const delta = 0.5 * data.totalAssets - data.equity;
    if (delta > 0) items.push({ key: "autonomyRatio", text: t.autonomyRatio(money(delta)) });
  }

  if (ratios.debtRatio !== null && ratios.debtRatio > 0.4 && data.totalAssets > 0) {
    const totalLiabilities = data.longTermLiabilities + data.currentLiabilities;
    const delta = totalLiabilities - 0.4 * data.totalAssets;
    if (delta > 0) items.push({ key: "debtRatio", text: t.debtRatio(money(delta)) });
  }

  if (ratios.interestCoverage !== null && ratios.interestCoverage < 1.5 && data.interestExpense > 0) {
    const delta = 1.5 * data.interestExpense - data.operatingProfit;
    if (delta > 0) items.push({ key: "interestCoverage", text: t.interestCoverage(money(delta)) });
  }

  if (
    ratios.inventoryTurnover !== null &&
    ratios.inventoryTurnover < 2 &&
    data.inventory > 0 &&
    data.costOfSales > 0
  ) {
    const delta = data.inventory - data.costOfSales / 2;
    if (delta > 0) items.push({ key: "inventoryTurnover", text: t.inventoryTurnover(money(delta)) });
  }

  if (ratios.roa !== null && ratios.roa < 0.03 && data.totalAssets > 0) {
    const delta = 0.03 * data.totalAssets - data.netProfit;
    if (delta > 0) items.push({ key: "roa", text: t.roa(money(delta)) });
  }

  return items;
}
