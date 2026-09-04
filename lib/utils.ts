import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Locale } from "@/i18n/config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INTL_LOCALE: Record<Locale, string> = {
  ru: "ru-RU",
  uz: "uz-UZ",
  en: "en-US",
};

const UNIT_LABEL: Record<Locale, { billion: string; million: string }> = {
  ru: { billion: "млрд", million: "млн" },
  uz: { billion: "mlrd", million: "mln" },
  en: { billion: "bn", million: "mn" },
};

export function formatMoney(value: number, locale: Locale = "ru", currency = "UZS"): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  const units = UNIT_LABEL[locale] ?? UNIT_LABEL.ru;
  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toFixed(1)} ${units.billion} ${currency}`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1)} ${units.million} ${currency}`;
  }
  return `${sign}${abs.toLocaleString(INTL_LOCALE[locale] ?? "ru-RU")} ${currency}`;
}

export function formatPct(value: number | null, digits = 1): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatRatio(value: number | null, digits = 2): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return value.toFixed(digits);
}

export function uid(): string {
  return crypto.randomUUID();
}
