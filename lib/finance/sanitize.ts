import { EMPTY_FINANCE_DATA, type FinanceData } from "./types";

// Приводит произвольный объект (из JSON-тела запроса или распарсенного Excel)
// к валидному FinanceData: неизвестные ключи отбрасываются, отсутствующие или
// нечисловые значения становятся 0. Используется и на экспорте, и на импорте —
// так наружу никогда не уходит NaN/undefined, а импорт "прощает" неполный файл.
export function sanitizeFinanceData(input: unknown): FinanceData {
  const source = (input && typeof input === "object" ? (input as Record<string, unknown>) : {}) as Record<
    string,
    unknown
  >;
  const result = { ...EMPTY_FINANCE_DATA };
  for (const key of Object.keys(EMPTY_FINANCE_DATA) as (keyof FinanceData)[]) {
    const raw = source[key];
    const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw.replace(/\s/g, "").replace(",", ".")) : NaN;
    result[key] = Number.isFinite(n) ? n : 0;
  }
  return result;
}
