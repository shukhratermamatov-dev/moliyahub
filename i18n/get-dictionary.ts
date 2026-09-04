import type { Locale } from "./config";
import type ruDictionary from "./dictionaries/ru";

const dictionaries = {
  ru: () => import("./dictionaries/ru").then((m) => m.default),
  uz: () => import("./dictionaries/uz").then((m) => m.default),
  en: () => import("./dictionaries/en").then((m) => m.default),
};

export async function getDictionary(locale: Locale) {
  const load = dictionaries[locale] ?? dictionaries.ru;
  return load();
}

export type Dictionary = typeof ruDictionary;
