import type { Locale } from "@/i18n/config";

// Текстовое поле, переведённое на все локали сайта. Используется для
// демо-данных (каталог банковских продуктов, справочник банков, демо-проекты),
// которые раньше были жёстко зашиты на русском и не переключались вместе
// с остальным интерфейсом.
export type LocalizedText = Record<Locale, string>;

export function pickText(text: LocalizedText, locale: Locale): string {
  return text[locale] ?? text.ru;
}

// Контент, который вводит сам пользователь (форма без выбора языка —
// например, админ добавляет продукт или посетитель публикует проект):
// показываем введённую строку на всех локалях как есть, а не переводим
// её машинно.
export function sameForAllLocales(value: string): LocalizedText {
  return { ru: value, uz: value, en: value };
}

export type LocalizedList = Record<Locale, string[]>;

export function pickList(list: LocalizedList, locale: Locale): string[] {
  return list[locale] ?? list.ru;
}

export function sameListForAllLocales(value: string[]): LocalizedList {
  return { ru: value, uz: value, en: value };
}
