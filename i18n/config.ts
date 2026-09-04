export const locales = ["ru", "uz", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ru";

export const LOCALE_LABEL: Record<Locale, string> = {
  ru: "Рус",
  uz: "Oʻzb",
  en: "Eng",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
