import { sameForAllLocales, type LocalizedText } from "@/lib/i18n-text";

export type ProjectStage = "IDEA" | "MVP" | "GROWTH" | "SCALE";

// Используется только во внутренней (нелокализованной) admin-панели.
export const STAGE_LABEL: Record<ProjectStage, string> = {
  IDEA: "Идея",
  MVP: "MVP",
  GROWTH: "Рост",
  SCALE: "Масштаб",
};

export type Project = {
  id: string;
  title: LocalizedText;
  // Отрасль/подотрасль — ссылка на справочник lib/data/industries.ts, а не
  // свободный текст: так фильтр на «Бирже проектов» работает по единому
  // списку отраслей для всех проектов, включая добавленные посетителями.
  industryId: string;
  subIndustryId?: string;
  // Свободный текст, введённый пользователем, когда subIndustryId ===
  // OTHER_SUB_INDUSTRY_ID ("Прочие") — справочник industries.ts не может
  // покрыть все виды деятельности, это ручное уточнение вместо него.
  subIndustryOther?: string;
  stage: ProjectStage;
  amount: number;
  region: LocalizedText;
  description: LocalizedText;
  owner: LocalizedText;
  raisedHint?: LocalizedText;
  // Проект пришёл из Supabase (опубликован через /projects/new авторизованным
  // пользователем) — а не из статичного SEED_PROJECTS и не из локального
  // zustand-стора браузера. Только у таких проектов есть реальный владелец
  // (аккаунт в личном кабинете), поэтому только для них:
  //  - заявка инвестора пишется в Supabase (project_applications), а не в
  //    локальный localStorage браузера отправителя;
  //  - список заявок не показывается публично на странице проекта — его
  //    видит только владелец в личном кабинете (RLS ограничивает выборку).
  source?: "supabase";
};

// Строка таблицы Supabase projects, как её возвращает select() на страницах
// /projects и /projects/[id] (только публичные, is_public = true).
export type DbProjectRow = {
  id: string;
  name: string;
  owner_name: string | null;
  industry_id: string | null;
  sub_industry_id: string | null;
  sub_industry_other: string | null;
  stage: string | null;
  amount: number | null;
  region: string | null;
  description: string | null;
};

const STAGES: readonly string[] = ["IDEA", "MVP", "GROWTH", "SCALE"];

// Превращает строку из Supabase в тот же Project, которым уже пользуется вся
// вёрстка "Биржи проектов" — так каталог/страница проекта не различают,
// откуда пришёл проект (SEED_PROJECTS, локальный zustand или Supabase).
export function mapDbProjectRow(row: DbProjectRow): Project {
  return {
    id: row.id,
    title: sameForAllLocales(row.name),
    industryId: row.industry_id || INDUSTRIES_FALLBACK,
    subIndustryId: row.sub_industry_id || undefined,
    subIndustryOther: row.sub_industry_other || undefined,
    stage: (STAGES.includes(row.stage || "") ? row.stage : "IDEA") as ProjectStage,
    amount: row.amount ?? 0,
    region: sameForAllLocales(row.region || ""),
    description: sameForAllLocales(row.description || ""),
    owner: sameForAllLocales(row.owner_name || ""),
    source: "supabase",
  };
}

// Захардкожен, а не импортирован из industries.ts, чтобы не тянуть весь
// справочник сюда ради одного id первой отрасли — используется только как
// fallback для повреждённых/пустых строк.
const INDUSTRIES_FALLBACK = "industry";

export const SEED_PROJECTS: Project[] = [
  {
    id: "navoi-textile",
    title: {
      ru: "Модернизация ткацкого производства",
      uz: "Toʻqimachilik ishlab chiqarishini modernizatsiya qilish",
      en: "Modernizing textile weaving production",
    },
    industryId: "industry",
    subIndustryId: "textiles",
    stage: "GROWTH",
    amount: 2_500_000_000,
    region: { ru: "Навоийская область", uz: "Navoiy viloyati", en: "Navoiy region" },
    owner: {
      ru: "ООО «Навоий Текстиль»",
      uz: "«Navoiy Tekstil» MChJ",
      en: "Navoiy Tekstil LLC",
    },
    description: {
      ru: "Закупка нового оборудования, рост мощности на 40% и выход на экспорт в Казахстан и Турцию. Есть действующие контракты и цех.",
      uz: "Yangi uskunalar sotib olish, quvvatni 40% ga oshirish va Qozogʻiston hamda Turkiyaga eksportga chiqish. Amaldagi shartnomalar va sex mavjud.",
      en: "Purchasing new equipment, boosting capacity by 40%, and expanding exports to Kazakhstan and Turkey. Existing contracts and a working shop floor are already in place.",
    },
    raisedHint: {
      ru: "Ищут стратегического партнёра, не только долг",
      uz: "Nafaqat qarz, balki strategik hamkor ham izlashmoqda",
      en: "Looking for a strategic partner, not just debt financing",
    },
  },
  {
    id: "tashkent-cold",
    title: {
      ru: "Холодильная логистика для фермеров",
      uz: "Fermerlar uchun sovutgich logistikasi",
      en: "Cold-chain logistics for farmers",
    },
    industryId: "logistics",
    subIndustryId: "warehousing-cold-chain",
    stage: "MVP",
    amount: 1_200_000_000,
    region: { ru: "Ташкентская область", uz: "Toshkent viloyati", en: "Tashkent region" },
    owner: { ru: "ColdChain Uz", uz: "ColdChain Uz", en: "ColdChain Uz" },
    description: {
      ru: "Сеть мини-складов у полей: меньше потерь урожая, подписка для фермерских хозяйств. Пилот на 3 точках уже работает.",
      uz: "Dala yaqinida mini-omborlar tarmogʻi: hosil yoʻqotilishi kamayadi, fermer xoʻjaliklari uchun obuna xizmati. 3 nuqtada pilot loyiha allaqachon ishlamoqda.",
      en: "A network of mini cold-storage units next to the fields: less crop loss and a subscription service for farms. A pilot is already running at 3 sites.",
    },
  },
  {
    id: "samarkand-craft",
    title: {
      ru: "Экспорт керамики и сувениров",
      uz: "Sopol buyumlar va suvenirlar eksporti",
      en: "Ceramics and souvenir exports",
    },
    industryId: "creative",
    subIndustryId: "handicrafts",
    stage: "SCALE",
    amount: 800_000_000,
    region: { ru: "Самарканд", uz: "Samarqand", en: "Samarkand" },
    owner: { ru: "Silk Clay", uz: "Silk Clay", en: "Silk Clay" },
    description: {
      ru: "Маркетплейс мастеров + своя фасовка и логистика в ЕС. Нужны оборотные средства на сезон и сертификация.",
      uz: "Hunarmandlar uchun marketpleys + oʻz qadoqlash va YEga logistika. Mavsum uchun aylanma mablagʻ va sertifikatsiya kerak.",
      en: "A marketplace for artisans plus in-house packaging and logistics into the EU. Needs seasonal working capital and certification.",
    },
  },
  {
    id: "fergana-solar",
    title: {
      ru: "Солнечные станции для теплиц",
      uz: "Issiqxonalar uchun quyosh stansiyalari",
      en: "Solar power stations for greenhouses",
    },
    industryId: "industry",
    subIndustryId: "power-generation",
    stage: "GROWTH",
    amount: 4_000_000_000,
    region: { ru: "Ферганская долина", uz: "Fargʻona vodiysi", en: "Fergana Valley" },
    owner: { ru: "GreenGlass", uz: "GreenGlass", en: "GreenGlass" },
    description: {
      ru: "Установка крышных станций с договором на выкуп электроэнергии. Снижает себестоимость овощей зимой.",
      uz: "Elektr energiyasini sotib olish shartnomasi asosida tom usti stansiyalarini oʻrnatish. Qishda sabzavot tannarxini kamaytiradi.",
      en: "Installing rooftop solar stations under a power purchase agreement. Lowers vegetable production costs in winter.",
    },
  },
  {
    id: "it-edtech",
    title: {
      ru: "EdTech для бухгалтеров МСБ",
      uz: "KOʻB buxgalterlari uchun EdTech",
      en: "EdTech for SME accountants",
    },
    industryId: "education",
    subIndustryId: "online-education",
    stage: "MVP",
    amount: 450_000_000,
    region: { ru: "Ташкент", uz: "Toshkent", en: "Tashkent" },
    owner: { ru: "HisobLab", uz: "HisobLab", en: "HisobLab" },
    description: {
      ru: "Онлайн-курсы и шаблоны отчётности на узбекском и русском. 1 200 платящих учеников, ищем рост в регионы.",
      uz: "Oʻzbek va rus tillarida onlayn kurslar va hisobot shablonlari. 1 200 ta toʻlovchi oʻquvchi, hududlarga kengayishni rejalashtirmoqdamiz.",
      en: "Online courses and reporting templates in Uzbek and Russian. 1,200 paying students, now looking to grow into the regions.",
    },
  },
];
