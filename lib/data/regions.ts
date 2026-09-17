import type { LocalizedText } from "@/lib/i18n-text";

export type Region = {
  id: string;
  name: LocalizedText;
};

// Справочник регионов Узбекистана для выпадающего списка в «Финансовом
// анализе»: 12 областей + Республика Каракалпакстан + город Ташкент (14 штук).
export const REGIONS: Region[] = [
  { id: "tashkent-city", name: { ru: "город Ташкент", uz: "Toshkent shahri", en: "Tashkent City" } },
  { id: "tashkent-region", name: { ru: "Ташкентская область", uz: "Toshkent viloyati", en: "Tashkent Region" } },
  { id: "andijan", name: { ru: "Андижанская область", uz: "Andijon viloyati", en: "Andijan Region" } },
  { id: "bukhara", name: { ru: "Бухарская область", uz: "Buxoro viloyati", en: "Bukhara Region" } },
  { id: "fergana", name: { ru: "Ферганская область", uz: "Farg'ona viloyati", en: "Fergana Region" } },
  { id: "jizzakh", name: { ru: "Джизакская область", uz: "Jizzax viloyati", en: "Jizzakh Region" } },
  { id: "kashkadarya", name: { ru: "Кашкадарьинская область", uz: "Qashqadaryo viloyati", en: "Kashkadarya Region" } },
  { id: "khorezm", name: { ru: "Хорезмская область", uz: "Xorazm viloyati", en: "Khorezm Region" } },
  { id: "namangan", name: { ru: "Наманганская область", uz: "Namangan viloyati", en: "Namangan Region" } },
  { id: "navoi", name: { ru: "Навоийская область", uz: "Navoiy viloyati", en: "Navoiy Region" } },
  { id: "samarkand", name: { ru: "Самаркандская область", uz: "Samarqand viloyati", en: "Samarkand Region" } },
  { id: "surkhandarya", name: { ru: "Сурхандарьинская область", uz: "Surxondaryo viloyati", en: "Surkhandarya Region" } },
  { id: "syrdarya", name: { ru: "Сырдарьинская область", uz: "Sirdaryo viloyati", en: "Sirdaryo Region" } },
  { id: "karakalpakstan", name: { ru: "Республика Каракалпакстан", uz: "Qoraqalpog'iston Respublikasi", en: "Republic of Karakalpakstan" } },
];

export function findRegion(id: string): Region | undefined {
  return REGIONS.find((r) => r.id === id);
}
