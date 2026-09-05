import type { FinancingOffer } from "@/lib/data/banks";

export type RateOverride = { rateMin: number; rateMax: number };
export type RateOverrideMap = Record<string, RateOverride>;

// Накладывает загруженные админом через Excel ставки поверх встроенного
// каталога OFFERS — только rateMin/rateMax, остальные поля продукта не
// трогаются. Продукт, для которого нет override, остаётся со значением
// по умолчанию из lib/data/banks.ts.
export function applyRateOverrides(
  offers: FinancingOffer[],
  overrides: RateOverrideMap,
): FinancingOffer[] {
  if (Object.keys(overrides).length === 0) return offers;
  return offers.map((o) => {
    const override = overrides[o.id];
    if (!override) return o;
    return { ...o, rateMin: override.rateMin, rateMax: override.rateMax };
  });
}
