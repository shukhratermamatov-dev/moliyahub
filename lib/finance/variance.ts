import type { FinancialRatios } from "./types";

// Ключевые коэффициенты, по которым считаем и показываем отклонение между
// двумя отчётными периодами — те же, что уже используются для сравнения
// сохранённых анализов в личном кабинете (components/finance/analysis-panel.tsx
// показывает их все, здесь берём подмножество, наиболее показательное для
// динамики).
export const VARIANCE_RATIO_KEYS: (keyof FinancialRatios)[] = [
  "currentRatio",
  "roa",
  "roe",
  "autonomyRatio",
  "debtRatio",
];

export type RatioVariance = {
  scoreDelta: number;
  ratioDeltas: Partial<Record<keyof FinancialRatios, number>>;
};

// Чистая функция: абсолютная дельта (период 2 − период 1) по общему баллу и
// по ключевым коэффициентам. Не зависит от ИИ — работает всегда, как только
// посчитаны оба набора FinancialRatios (локально или после ответа ИИ).
export function computeVariance(first: FinancialRatios, second: FinancialRatios): RatioVariance {
  const ratioDeltas: Partial<Record<keyof FinancialRatios, number>> = {};
  for (const key of VARIANCE_RATIO_KEYS) {
    const a = first[key];
    const b = second[key];
    if (typeof a === "number" && typeof b === "number") {
      ratioDeltas[key] = b - a;
    }
  }
  return {
    scoreDelta: second.score - first.score,
    ratioDeltas,
  };
}
