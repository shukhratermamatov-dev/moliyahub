import type { LocalizedList, LocalizedText } from "@/lib/i18n-text";

export type FinancingType =
  | "BANK_LOAN"
  | "ISLAMIC"
  | "LEASING"
  | "VENTURE"
  | "CROWDFUNDING"
  | "GRANT";

export type FinancingOffer = {
  id: string;
  bank: LocalizedText;
  type: FinancingType;
  title: LocalizedText;
  rateMin: number;
  rateMax: number;
  termMin: number;
  termMax: number;
  minAmount: number;
  maxAmount: number;
  purpose: LocalizedList;
  islamic: boolean;
  note: LocalizedText;
};

// Используется только во внутренней (нелокализованной) admin-панели.
export const TYPE_LABEL: Record<FinancingType, string> = {
  BANK_LOAN: "Банковский кредит",
  ISLAMIC: "Исламское финансирование",
  LEASING: "Лизинг",
  VENTURE: "Венчур / ангелы",
  CROWDFUNDING: "Краудфандинг",
  GRANT: "Грант / льготы",
};

export const OFFERS: FinancingOffer[] = [
  {
    id: "nbu-invest",
    bank: {
      ru: "Национальный банк ВЭД",
      uz: "Oʻzbekiston Milliy banki",
      en: "National Bank for Foreign Economic Activity (NBU)",
    },
    type: "BANK_LOAN",
    title: {
      ru: "Инвестиционный кредит",
      uz: "Investitsiya krediti",
      en: "Investment loan",
    },
    rateMin: 16,
    rateMax: 22,
    termMin: 12,
    termMax: 60,
    minAmount: 100_000_000,
    maxAmount: 20_000_000_000,
    purpose: {
      ru: ["оборудование", "строительство", "модернизация"],
      uz: ["uskunalar", "qurilish", "modernizatsiya"],
      en: ["equipment", "construction", "modernization"],
    },
    islamic: false,
    note: {
      ru: "Нужны залог и устойчивые обороты за 12 месяцев.",
      uz: "Garov va soʻnggi 12 oydagi barqaror aylanma mablagʻ talab qilinadi.",
      en: "Collateral and stable turnover over the past 12 months are required.",
    },
  },
  {
    id: "asaka-oborot",
    bank: { ru: "Асакабанк", uz: "Asakabank", en: "Asakabank" },
    type: "BANK_LOAN",
    title: {
      ru: "Пополнение оборотных средств",
      uz: "Aylanma mablagʻni toʻldirish",
      en: "Working capital top-up",
    },
    rateMin: 18,
    rateMax: 24,
    termMin: 6,
    termMax: 24,
    minAmount: 50_000_000,
    maxAmount: 5_000_000_000,
    purpose: {
      ru: ["сырьё", "зарплата", "закупки"],
      uz: ["xomashyo", "ish haqi", "xaridlar"],
      en: ["raw materials", "payroll", "procurement"],
    },
    islamic: false,
    note: {
      ru: "Быстрое рассмотрение при оборотах в этом же банке.",
      uz: "Shu bankda aylanma boʻlsa, tez koʻrib chiqiladi.",
      en: "Fast approval if your turnover already runs through this bank.",
    },
  },
  {
    id: "ipak-sme",
    bank: { ru: "Ипак Йули", uz: "Ipak Yoʻli", en: "Ipak Yuli" },
    type: "BANK_LOAN",
    title: {
      ru: "Кредит для МСБ",
      uz: "KOʻB uchun kredit",
      en: "SME loan",
    },
    rateMin: 17.5,
    rateMax: 23,
    termMin: 12,
    termMax: 36,
    minAmount: 80_000_000,
    maxAmount: 8_000_000_000,
    purpose: {
      ru: ["оборот", "оборудование"],
      uz: ["aylanma mablagʻ", "uskunalar"],
      en: ["working capital", "equipment"],
    },
    islamic: false,
    note: {
      ru: "Подходит торговле и производству.",
      uz: "Savdo va ishlab chiqarish uchun mos.",
      en: "Suitable for trade and manufacturing.",
    },
  },
  {
    id: "hamkor-agro",
    bank: { ru: "Hamkorbank", uz: "Hamkorbank", en: "Hamkorbank" },
    type: "BANK_LOAN",
    title: {
      ru: "Агро- и переработка",
      uz: "Agrosanoat va qayta ishlash",
      en: "Agriculture & processing",
    },
    rateMin: 15,
    rateMax: 20,
    termMin: 12,
    termMax: 48,
    minAmount: 100_000_000,
    maxAmount: 10_000_000_000,
    purpose: {
      ru: ["сельхоз", "переработка", "логистика"],
      uz: ["qishloq xoʻjaligi", "qayta ishlash", "logistika"],
      en: ["agriculture", "processing", "logistics"],
    },
    islamic: false,
    note: {
      ru: "Сезонность учитывается в графике платежей.",
      uz: "Toʻlov jadvalida mavsumiylik hisobga olinadi.",
      en: "Seasonality is factored into the repayment schedule.",
    },
  },
  {
    id: "kapital-express",
    bank: { ru: "Kapitalbank", uz: "Kapitalbank", en: "Kapitalbank" },
    type: "BANK_LOAN",
    title: {
      ru: "Экспресс для торговли",
      uz: "Savdo uchun ekspress kredit",
      en: "Express loan for trade",
    },
    rateMin: 20,
    rateMax: 26,
    termMin: 3,
    termMax: 18,
    minAmount: 30_000_000,
    maxAmount: 1_500_000_000,
    purpose: {
      ru: ["товар", "оборот"],
      uz: ["tovar", "aylanma mablagʻ"],
      en: ["goods", "working capital"],
    },
    islamic: false,
    note: {
      ru: "Короткий срок, выше ставка, меньше документов.",
      uz: "Qisqa muddat, stavka yuqoriroq, hujjat kamroq.",
      en: "Short term, higher rate, less paperwork.",
    },
  },
  {
    id: "murabaha",
    bank: {
      ru: "Узпромстройбанк · исламское окно",
      uz: "Uzpromstroybank · islomiy oyna",
      en: "Uzpromstroybank · Islamic window",
    },
    type: "ISLAMIC",
    title: {
      ru: "Мурабаха на товар и оборудование",
      uz: "Tovar va uskunalar uchun murobaha",
      en: "Murabaha for goods and equipment",
    },
    rateMin: 14,
    rateMax: 19,
    termMin: 12,
    termMax: 36,
    minAmount: 100_000_000,
    maxAmount: 10_000_000_000,
    purpose: {
      ru: ["товар", "основные средства"],
      uz: ["tovar", "asosiy vositalar"],
      en: ["goods", "fixed assets"],
    },
    islamic: true,
    note: {
      ru: "Наценка вместо процента. Актив покупается банком и продаётся вам в рассрочку.",
      uz: "Foiz oʻrniga ustama narx. Aktivni bank sotib olib, sizga boʻlib toʻlashga sotadi.",
      en: "A markup instead of interest. The bank buys the asset and resells it to you in installments.",
    },
  },
  {
    id: "ijara",
    bank: {
      ru: "Trustbank · исламское окно",
      uz: "Trustbank · islomiy oyna",
      en: "Trustbank · Islamic window",
    },
    type: "ISLAMIC",
    title: {
      ru: "Иджара (лизинг по шариату)",
      uz: "Ijara (shariat boʻyicha lizing)",
      en: "Ijara (Sharia-compliant leasing)",
    },
    rateMin: 13,
    rateMax: 18,
    termMin: 24,
    termMax: 60,
    minAmount: 200_000_000,
    maxAmount: 15_000_000_000,
    purpose: {
      ru: ["техника", "недвижимость"],
      uz: ["texnika", "koʻchmas mulk"],
      en: ["equipment", "real estate"],
    },
    islamic: true,
    note: {
      ru: "Актив остаётся в собственности финансирующей стороны до выкупа.",
      uz: "Aktiv sotib olinguncha moliyalashtiruvchi tomonning mulki boʻlib qoladi.",
      en: "The asset remains the financier's property until it is bought out.",
    },
  },
  {
    id: "uzbekleasing",
    bank: { ru: "Uzbek Leasing", uz: "Uzbek Leasing", en: "Uzbek Leasing" },
    type: "LEASING",
    title: {
      ru: "Лизинг производственной техники",
      uz: "Ishlab chiqarish texnikasi lizingi",
      en: "Leasing of production equipment",
    },
    rateMin: 15,
    rateMax: 21,
    termMin: 24,
    termMax: 60,
    minAmount: 150_000_000,
    maxAmount: 12_000_000_000,
    purpose: {
      ru: ["станки", "транспорт", "линии"],
      uz: ["stanoklar", "transport", "liniyalar"],
      en: ["machinery", "vehicles", "production lines"],
    },
    islamic: false,
    note: {
      ru: "Первый взнос обычно 15–30%.",
      uz: "Boshlangʻich toʻlov odatda 15–30%.",
      en: "Down payment is typically 15–30%.",
    },
  },
  {
    id: "angel-uz",
    bank: {
      ru: "IT Park Angels / частные инвесторы",
      uz: "IT Park Angels / xususiy investorlar",
      en: "IT Park Angels / private investors",
    },
    type: "VENTURE",
    title: {
      ru: "Посевные инвестиции",
      uz: "Urugʻlik (seed) investitsiyalar",
      en: "Seed investment",
    },
    rateMin: 0,
    rateMax: 0,
    termMin: 24,
    termMax: 60,
    minAmount: 200_000_000,
    maxAmount: 8_000_000_000,
    purpose: {
      ru: ["стартап", "масштаб"],
      uz: ["startap", "masshtablash"],
      en: ["startup", "scaling"],
    },
    islamic: false,
    note: {
      ru: "Доля в компании вместо процентов. Нужны pitch, юнит-экономика и команда.",
      uz: "Foiz oʻrniga kompaniyadan ulush. Pitch, unit-iqtisodiyot va jamoa kerak.",
      en: "Equity instead of interest. You'll need a pitch, unit economics, and a team.",
    },
  },
  {
    id: "crowd-uz",
    bank: {
      ru: "Крауд-площадки",
      uz: "Kraud-platformalar",
      en: "Crowdfunding platforms",
    },
    type: "CROWDFUNDING",
    title: {
      ru: "Сбор от сообщества",
      uz: "Jamoadan mablagʻ yigʻish",
      en: "Community fundraising",
    },
    rateMin: 0,
    rateMax: 8,
    termMin: 1,
    termMax: 12,
    minAmount: 20_000_000,
    maxAmount: 2_000_000_000,
    purpose: {
      ru: ["продукт", "сообщество", "предзаказ"],
      uz: ["mahsulot", "jamoa", "oldindan buyurtma"],
      en: ["product", "community", "pre-order"],
    },
    islamic: false,
    note: {
      ru: "Работает, если есть аудитория и понятный продукт.",
      uz: "Auditoriya va tushunarli mahsulot boʻlsa, ishlaydi.",
      en: "Works if you already have an audience and a clear product.",
    },
  },
  {
    id: "grant-itpark",
    bank: {
      ru: "IT Park / госпрограммы",
      uz: "IT Park / davlat dasturlari",
      en: "IT Park / government programs",
    },
    type: "GRANT",
    title: {
      ru: "Льготы и гранты для экспорта и IT",
      uz: "Eksport va IT uchun imtiyoz va grantlar",
      en: "Incentives and grants for export and IT",
    },
    rateMin: 0,
    rateMax: 0,
    termMin: 6,
    termMax: 24,
    minAmount: 10_000_000,
    maxAmount: 1_000_000_000,
    purpose: {
      ru: ["IT", "экспорт", "обучение"],
      uz: ["IT", "eksport", "oʻqitish"],
      en: ["IT", "export", "training"],
    },
    islamic: false,
    note: {
      ru: "Конкурсный отбор. Деньги не возвращаются при выполнении условий.",
      uz: "Tanlov asosida. Shartlar bajarilsa, mablagʻ qaytarilmaydi.",
      en: "Competitive selection. Funds are non-repayable if conditions are met.",
    },
  },
];

export type BankCategory = "STATE" | "JOINT_STOCK" | "PRIVATE" | "FOREIGN_CAPITAL";

export type BankDirectoryEntry = {
  id: string;
  name: LocalizedText;
  category: BankCategory;
};

// Полный список действующих коммерческих банков Узбекистана.
// Источник: официальный реестр ЦБ РУз (cbu.uz/ru/credit-organizations/banks/head-offices/).
// Ставки и условия намеренно не указаны — они не публикуются ЦБ и меняются у каждого
// банка индивидуально. На странице "Финансирование" эти банки показываются с пометкой
// "уточняйте условия в банке", без выдуманных цифр.
export const BANK_DIRECTORY: BankDirectoryEntry[] = [
  // Государственные банки (9)
  {
    id: "nbu",
    name: {
      ru: "Национальный банк внешнеэкономической деятельности Республики Узбекистан",
      uz: "Oʻzbekiston Respublikasi Tashqi iqtisodiy faoliyat milliy banki",
      en: "National Bank for Foreign Economic Activity of the Republic of Uzbekistan",
    },
    category: "STATE",
  },
  {
    id: "narodny",
    name: {
      ru: "Народный банк Республики Узбекистан",
      uz: "Oʻzbekiston Respublikasi Xalq banki",
      en: "People's Bank of the Republic of Uzbekistan",
    },
    category: "STATE",
  },
  { id: "asaka", name: { ru: "Асакабанк", uz: "Asakabank", en: "Asakabank" }, category: "STATE" },
  {
    id: "uzpsb",
    name: {
      ru: "Узбекский промышленно-строительный банк",
      uz: "Sanoat-qurilish banki (SQB)",
      en: "Uzpromstroybank (SQB)",
    },
    category: "STATE",
  },
  { id: "agrobank", name: { ru: "Агробанк", uz: "Agrobank", en: "Agrobank" }, category: "STATE" },
  {
    id: "bbb",
    name: {
      ru: "Банк развития бизнеса",
      uz: "Biznesni rivojlantirish banki",
      en: "Business Development Bank",
    },
    category: "STATE",
  },
  { id: "turon", name: { ru: "Турон банк", uz: "Turon bank", en: "Turon Bank" }, category: "STATE" },
  {
    id: "mikrokreditbank",
    name: { ru: "Микрокредитбанк", uz: "Mikrokreditbank", en: "Mikrokreditbank" },
    category: "STATE",
  },
  { id: "aloqabank", name: { ru: "Алокабанк", uz: "Aloqabank", en: "Aloqabank" }, category: "STATE" },
  // Акционерно-коммерческие банки (7)
  {
    id: "poytaxt",
    name: { ru: "Пойтахт банк", uz: "Poytaxt bank", en: "Poytaxt Bank" },
    category: "JOINT_STOCK",
  },
  {
    id: "ifb",
    name: { ru: "Invest Finance Bank", uz: "Invest Finance Bank", en: "Invest Finance Bank" },
    category: "JOINT_STOCK",
  },
  {
    id: "madad",
    name: { ru: "Мадад Инвест Банк", uz: "Madad Invest Bank", en: "Madad Invest Bank" },
    category: "JOINT_STOCK",
  },
  { id: "avo", name: { ru: "AVO BANK", uz: "AVO BANK", en: "AVO BANK" }, category: "JOINT_STOCK" },
  { id: "tbc", name: { ru: "TBC Bank", uz: "TBC Bank", en: "TBC Bank" }, category: "JOINT_STOCK" },
  { id: "anor", name: { ru: "ANOR BANK", uz: "ANOR BANK", en: "ANOR BANK" }, category: "JOINT_STOCK" },
  {
    id: "tayanch",
    name: {
      ru: "Tayanch mikromoliya banki",
      uz: "Tayanch mikromoliya banki",
      en: "Tayanch Microfinance Bank",
    },
    category: "JOINT_STOCK",
  },
  // Частные банки (14)
  {
    id: "asia-alliance",
    name: { ru: "Asia Alliance Bank", uz: "Asia Alliance Bank", en: "Asia Alliance Bank" },
    category: "PRIVATE",
  },
  { id: "ipak-yuli", name: { ru: "Ипак Йули", uz: "Ipak Yoʻli", en: "Ipak Yuli Bank" }, category: "PRIVATE" },
  {
    id: "kapitalbank",
    name: { ru: "Капиталбанк", uz: "Kapitalbank", en: "Kapitalbank" },
    category: "PRIVATE",
  },
  {
    id: "universal",
    name: { ru: "Универсал банк", uz: "Universal bank", en: "Universal Bank" },
    category: "PRIVATE",
  },
  { id: "trustbank", name: { ru: "Трастбанк", uz: "Trustbank", en: "Trustbank" }, category: "PRIVATE" },
  { id: "davr", name: { ru: "Давр-банк", uz: "Davr-bank", en: "Davr Bank" }, category: "PRIVATE" },
  { id: "octobank", name: { ru: "Octobank", uz: "Octobank", en: "Octobank" }, category: "PRIVATE" },
  {
    id: "orient",
    name: { ru: "Ориент Финанс", uz: "Orient Finans", en: "Orient Finans Bank" },
    category: "PRIVATE",
  },
  { id: "garant", name: { ru: "Гарант банк", uz: "Garant bank", en: "Garant Bank" }, category: "PRIVATE" },
  { id: "hamkorbank", name: { ru: "Hamkorbank", uz: "Hamkorbank", en: "Hamkorbank" }, category: "PRIVATE" },
  { id: "uzum", name: { ru: "Uzum Bank", uz: "Uzum Bank", en: "Uzum Bank" }, category: "PRIVATE" },
  { id: "openbank", name: { ru: "Open Bank", uz: "Open Bank", en: "Open Bank" }, category: "PRIVATE" },
  { id: "apex", name: { ru: "Apex Bank", uz: "Apex Bank", en: "Apex Bank" }, category: "PRIVATE" },
  { id: "hayot", name: { ru: "Hayot Bank", uz: "Hayot Bank", en: "Hayot Bank" }, category: "PRIVATE" },
  // Банки с участием иностранного капитала (5)
  { id: "tenge", name: { ru: "Tenge Bank", uz: "Tenge Bank", en: "Tenge Bank" }, category: "FOREIGN_CAPITAL" },
  {
    id: "kdb",
    name: { ru: "КДБ Банк Узбекистан", uz: "KDB Bank Oʻzbekiston", en: "KDB Bank Uzbekistan" },
    category: "FOREIGN_CAPITAL",
  },
  {
    id: "ziraat",
    name: { ru: "Ziraat Bank Uzbekistan", uz: "Ziraat Bank Uzbekistan", en: "Ziraat Bank Uzbekistan" },
    category: "FOREIGN_CAPITAL",
  },
  {
    id: "saderat",
    name: { ru: "«Содерот» Банк", uz: "«Saderat» banki", en: "Saderat Bank" },
    category: "FOREIGN_CAPITAL",
  },
  {
    id: "ipoteka",
    name: { ru: "Ипотека-банк", uz: "Ipoteka-bank", en: "Ipoteka Bank" },
    category: "FOREIGN_CAPITAL",
  },
];

// Используется только во внутренней (нелокализованной) admin-панели.
export const BANK_CATEGORY_LABEL: Record<BankCategory, string> = {
  STATE: "Государственный банк",
  JOINT_STOCK: "Акционерно-коммерческий банк",
  PRIVATE: "Частный банк",
  FOREIGN_CAPITAL: "Банк с участием иностранного капитала",
};
