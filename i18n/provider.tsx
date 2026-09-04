"use client";

import { createContext, useContext, useMemo } from "react";
import { type Locale } from "./config";
import type { Dictionary } from "./get-dictionary";
import ru from "./dictionaries/ru";
import uz from "./dictionaries/uz";
import en from "./dictionaries/en";

// Словари подключаются здесь статически (а не через getDictionary()), потому что
// I18nProvider — клиентский компонент: словарь с функциями (adviceTemplates.*)
// нельзя передать ему пропом из серверного layout — React не умеет сериализовать
// функции через границу сервер→клиент, из-за этого падали все страницы (500).
const DICTS: Record<Locale, Dictionary> = { ru, uz, en };

type I18nValue = {
  locale: Locale;
  dict: Dictionary;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const value = useMemo<I18nValue>(() => ({ locale, dict: DICTS[locale] }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n должен вызываться внутри I18nProvider");
  }
  return ctx;
}
