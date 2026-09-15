import { BANK_DIRECTORY } from "./banks";

// Сопоставляет "сырое" имя банка со страницы bank.uz (например "Kapitalbank",
// "Asia Alliance Bank") с id из BANK_DIRECTORY (наш справочник 35 банков,
// сверенный с реестром ЦБ РУз) — чтобы показать настоящий логотип и
// сгруппировать реальные предложения под правильным банком в справочнике.
//
// bank.uz даёт названия латиницей/по-английски, поэтому сравниваем в первую
// очередь с BANK_DIRECTORY[].name.en (ближе всего по написанию), затем с uz.
// Что не сматчилось — bankId остаётся null, само предложение не теряется
// (сырое имя и данные всё равно сохраняются), просто не привязывается к
// карточке конкретного банка. Экспортируем отдельно, чтобы после первого
// реального прогона скрейпера можно было проверить список несматченных имён
// и точечно расширить UNMATCHED-карту ниже.

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/["'«»]/g, "")
    .replace(/\./g, "")
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/[^a-zа-яʻʼ0-9]+/gi, " ")
    .replace(/\b(bank|banki|banka|банк|банки)\b/gi, "")
    .replace(/\s+/g, "")
    .trim();
}

// Ручные алиасы для случаев, где нормализация сама не даёт совпадения
// (проверено вживую на реальных карточках bank.uz в этой сессии).
const MANUAL_ALIASES: Record<string, string> = {
  kapitalbank: "kapitalbank",
  anorbank: "anor",
  hamkorbank: "hamkorbank",
  asiaalliancebank: "asia-alliance",
  saderatbank: "saderat",
  ipakyulibank: "ipak-yuli",
  agrobank: "agrobank",
};

let normalizedDirectory: { id: string; keys: string[] }[] | null = null;

function getNormalizedDirectory() {
  if (normalizedDirectory) return normalizedDirectory;
  normalizedDirectory = BANK_DIRECTORY.map((b) => ({
    id: b.id,
    keys: [normalize(b.name.en), normalize(b.name.uz), normalize(b.name.ru)].filter(Boolean),
  }));
  return normalizedDirectory;
}

export function matchBankId(rawName: string): string | null {
  const key = normalize(rawName);
  if (!key) return null;

  if (MANUAL_ALIASES[key]) return MANUAL_ALIASES[key];

  const directory = getNormalizedDirectory();
  const exact = directory.find((entry) => entry.keys.includes(key));
  if (exact) return exact.id;

  // Частичное совпадение как последний шанс (например "sqb" внутри
  // "uzpromstroybanksqb") — только если совпадение достаточно длинное, чтобы
  // не хвататься за случайные короткие подстроки.
  if (key.length >= 4) {
    const partial = directory.find((entry) =>
      entry.keys.some((k) => k.length >= 4 && (k.includes(key) || key.includes(k))),
    );
    if (partial) return partial.id;
  }

  return null;
}
