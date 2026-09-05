export type FinancingType =
  | "BANK_LOAN"
  | "ISLAMIC"
  | "LEASING"
  | "VENTURE"
  | "CROWDFUNDING"
  | "GRANT";

export type FinancingOffer = {
  id: string;
  bank: string;
  type: FinancingType;
  title: string;
  rateMin: number;
  rateMax: number;
  termMin: number;
  termMax: number;
  minAmount: number;
  maxAmount: number;
  purpose: string[];
  islamic: boolean;
  note: string;
};

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
    bank: "Национальный банк ВЭД",
    type: "BANK_LOAN",
    title: "Инвестиционный кредит",
    rateMin: 16,
    rateMax: 22,
    termMin: 12,
    termMax: 60,
    minAmount: 100_000_000,
    maxAmount: 20_000_000_000,
    purpose: ["оборудование", "строительство", "модернизация"],
    islamic: false,
    note: "Нужны залог и устойчивые обороты за 12 месяцев.",
  },
  {
    id: "asaka-oborot",
    bank: "Асакабанк",
    type: "BANK_LOAN",
    title: "Пополнение оборотных средств",
    rateMin: 18,
    rateMax: 24,
    termMin: 6,
    termMax: 24,
    minAmount: 50_000_000,
    maxAmount: 5_000_000_000,
    purpose: ["сырьё", "зарплата", "закупки"],
    islamic: false,
    note: "Быстрое рассмотрение при оборотах в этом же банке.",
  },
  {
    id: "ipak-sme",
    bank: "Ипак Йули",
    type: "BANK_LOAN",
    title: "Кредит для МСБ",
    rateMin: 17.5,
    rateMax: 23,
    termMin: 12,
    termMax: 36,
    minAmount: 80_000_000,
    maxAmount: 8_000_000_000,
    purpose: ["оборот", "оборудование"],
    islamic: false,
    note: "Подходит торговле и производству.",
  },
  {
    id: "hamkor-agro",
    bank: "Hamkorbank",
    type: "BANK_LOAN",
    title: "Агро- и переработка",
    rateMin: 15,
    rateMax: 20,
    termMin: 12,
    termMax: 48,
    minAmount: 100_000_000,
    maxAmount: 10_000_000_000,
    purpose: ["сельхоз", "переработка", "логистика"],
    islamic: false,
    note: "Сезонность учитывается в графике платежей.",
  },
  {
    id: "kapital-express",
    bank: "Kapitalbank",
    type: "BANK_LOAN",
    title: "Экспресс для торговли",
    rateMin: 20,
    rateMax: 26,
    termMin: 3,
    termMax: 18,
    minAmount: 30_000_000,
    maxAmount: 1_500_000_000,
    purpose: ["товар", "оборот"],
    islamic: false,
    note: "Короткий срок, выше ставка, меньше документов.",
  },
  {
    id: "murabaha",
    bank: "Узпромстройбанк · исламское окно",
    type: "ISLAMIC",
    title: "Мурабаха на товар и оборудование",
    rateMin: 14,
    rateMax: 19,
    termMin: 12,
    termMax: 36,
    minAmount: 100_000_000,
    maxAmount: 10_000_000_000,
    purpose: ["товар", "основные средства"],
    islamic: true,
    note: "Наценка вместо процента. Актив покупается банком и продаётся вам в рассрочку.",
  },
  {
    id: "ijara",
    bank: "Trustbank · исламское окно",
    type: "ISLAMIC",
    title: "Иджара (лизинг по шариату)",
    rateMin: 13,
    rateMax: 18,
    termMin: 24,
    termMax: 60,
    minAmount: 200_000_000,
    maxAmount: 15_000_000_000,
    purpose: ["техника", "недвижимость"],
    islamic: true,
    note: "Актив остаётся в собственности финансирующей стороны до выкупа.",
  },
  {
    id: "uzbekleasing",
    bank: "Uzbek Leasing",
    type: "LEASING",
    title: "Лизинг производственной техники",
    rateMin: 15,
    rateMax: 21,
    termMin: 24,
    termMax: 60,
    minAmount: 150_000_000,
    maxAmount: 12_000_000_000,
    purpose: ["станки", "транспорт", "линии"],
    islamic: false,
    note: "Первый взнос обычно 15–30%.",
  },
  {
    id: "angel-uz",
    bank: "IT Park Angels / частные инвесторы",
    type: "VENTURE",
    title: "Посевные инвестиции",
    rateMin: 0,
    rateMax: 0,
    termMin: 24,
    termMax: 60,
    minAmount: 200_000_000,
    maxAmount: 8_000_000_000,
    purpose: ["стартап", "масштаб"],
    islamic: false,
    note: "Доля в компании вместо процентов. Нужны pitch, юнит-экономика и команда.",
  },
  {
    id: "crowd-uz",
    bank: "Крауд-площадки",
    type: "CROWDFUNDING",
    title: "Сбор от сообщества",
    rateMin: 0,
    rateMax: 8,
    termMin: 1,
    termMax: 12,
    minAmount: 20_000_000,
    maxAmount: 2_000_000_000,
    purpose: ["продукт", "сообщество", "предзаказ"],
    islamic: false,
    note: "Работает, если есть аудитория и понятный продукт.",
  },
  {
    id: "grant-itpark",
    bank: "IT Park / госпрограммы",
    type: "GRANT",
    title: "Льготы и гранты для экспорта и IT",
    rateMin: 0,
    rateMax: 0,
    termMin: 6,
    termMax: 24,
    minAmount: 10_000_000,
    maxAmount: 1_000_000_000,
    purpose: ["IT", "экспорт", "обучение"],
    islamic: false,
    note: "Конкурсный отбор. Деньги не возвращаются при выполнении условий.",
  },
];

export type BankCategory = "STATE" | "JOINT_STOCK" | "PRIVATE" | "FOREIGN_CAPITAL";

export type BankDirectoryEntry = {
  id: string;
  name: string;
  category: BankCategory;
};

// Полный список действующих коммерческих банков Узбекистана.
// Источник: официальный реестр ЦБ РУз (cbu.uz/ru/credit-organizations/banks/head-offices/).
// Ставки и условия намеренно не указаны — они не публикуются ЦБ и меняются у каждого
// банка индивидуально. На странице "Финансирование" эти банки показываются с пометкой
// "уточняйте условия в банке", без выдуманных цифр.
export const BANK_DIRECTORY: BankDirectoryEntry[] = [
  // Государственные банки (9)
  { id: "nbu", name: "Национальный банк внешнеэкономической деятельности Республики Узбекистан", category: "STATE" },
  { id: "narodny", name: "Народный банк Республики Узбекистан", category: "STATE" },
  { id: "asaka", name: "Асакабанк", category: "STATE" },
  { id: "uzpsb", name: "Узбекский промышленно-строительный банк", category: "STATE" },
  { id: "agrobank", name: "Агробанк", category: "STATE" },
  { id: "bbb", name: "Банк развития бизнеса", category: "STATE" },
  { id: "turon", name: "Турон банк", category: "STATE" },
  { id: "mikrokreditbank", name: "Микрокредитбанк", category: "STATE" },
  { id: "aloqabank", name: "Алокабанк", category: "STATE" },
  // Акционерно-коммерческие банки (7)
  { id: "poytaxt", name: "Пойтахт банк", category: "JOINT_STOCK" },
  { id: "ifb", name: "Invest Finance Bank", category: "JOINT_STOCK" },
  { id: "madad", name: "Мадад Инвест Банк", category: "JOINT_STOCK" },
  { id: "avo", name: "AVO BANK", category: "JOINT_STOCK" },
  { id: "tbc", name: "TBC Bank", category: "JOINT_STOCK" },
  { id: "anor", name: "ANOR BANK", category: "JOINT_STOCK" },
  { id: "tayanch", name: "Tayanch mikromoliya banki", category: "JOINT_STOCK" },
  // Частные банки (14)
  { id: "asia-alliance", name: "Asia Alliance Bank", category: "PRIVATE" },
  { id: "ipak-yuli", name: "Ипак Йули", category: "PRIVATE" },
  { id: "kapitalbank", name: "Капиталбанк", category: "PRIVATE" },
  { id: "universal", name: "Универсал банк", category: "PRIVATE" },
  { id: "trustbank", name: "Трастбанк", category: "PRIVATE" },
  { id: "davr", name: "Давр-банк", category: "PRIVATE" },
  { id: "octobank", name: "Octobank", category: "PRIVATE" },
  { id: "orient", name: "Ориент Финанс", category: "PRIVATE" },
  { id: "garant", name: "Гарант банк", category: "PRIVATE" },
  { id: "hamkorbank", name: "Hamkorbank", category: "PRIVATE" },
  { id: "uzum", name: "Uzum Bank", category: "PRIVATE" },
  { id: "openbank", name: "Open Bank", category: "PRIVATE" },
  { id: "apex", name: "Apex Bank", category: "PRIVATE" },
  { id: "hayot", name: "Hayot Bank", category: "PRIVATE" },
  // Банки с участием иностранного капитала (5)
  { id: "tenge", name: "Tenge Bank", category: "FOREIGN_CAPITAL" },
  { id: "kdb", name: "КДБ Банк Узбекистан", category: "FOREIGN_CAPITAL" },
  { id: "ziraat", name: "Ziraat Bank Uzbekistan", category: "FOREIGN_CAPITAL" },
  { id: "saderat", name: "\u00abСодерот\u00bb Банк", category: "FOREIGN_CAPITAL" },
  { id: "ipoteka", name: "Ипотека-банк", category: "FOREIGN_CAPITAL" },
];

export const BANK_CATEGORY_LABEL: Record<BankCategory, string> = {
  STATE: "Государственный банк",
  JOINT_STOCK: "Акционерно-коммерческий банк",
  PRIVATE: "Частный банк",
  FOREIGN_CAPITAL: "Банк с участием иностранного капитала",
};
