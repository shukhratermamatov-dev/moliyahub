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

const BANK_WORD_TOKENS = new Set(["bank", "banki", "banka", "банк", "банки"]);

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/["'«»]/g, "")
    .replace(/\./g, "")
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/[^a-zа-яʻʼ0-9]+/gi, " ")
    .split(" ")
    // Разбиваем на слова и фильтруем токен "bank"/"банк" и т.п. по точному
    // совпадению — regex \b тут не годится: JS не считает кириллицу
    // "словесным" символом, поэтому \b между кириллическими буквами никогда
    // не сработает (проверено на реальном прогоне: "Национальный банк
    // Узбекистана" не разбирался словом-границей).
    .filter((token) => token && !BANK_WORD_TOKENS.has(token))
    .join("");
}

// Ручные алиасы для случаев, где нормализация сама не даёт совпадения
// (проверено на реальном прогоне скрейпера — 462 из 595 предложений
// сматчились автоматически, эти добавлены точечно по списку unmatchedBankNames).
const MANUAL_ALIASES: Record<string, string> = {
  kapitalbank: "kapitalbank",
  anorbank: "anor",
  hamkorbank: "hamkorbank",
  asiaalliancebank: "asia-alliance",
  saderatbank: "saderat",
  ipakyulibank: "ipak-yuli",
  agrobank: "agrobank",
  // bank.uz пишет "Uzbekiston", в справочнике — "Uzbekistan".
  kdbuzbekiston: "kdb",
  узпромстройбанк: "uzpsb",
  // Инфинбанк — торговая марка Invest Finance Bank (logoDomain infinbank.uz).
  infinbank: "ifb",
  // МКБанк — короткое название Микрокредитбанка (logoDomain mkbank.uz).
  mkbank: "mikrokreditbank",
  // bank.uz пишет "Trastbank", в справочнике — "Trustbank".
  trastbank: "trustbank",
  национальныйузбекистана: "nbu",
  brb: "bbb",
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
