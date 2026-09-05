import type { LocalizedText } from "@/lib/i18n-text";

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
  industry: LocalizedText;
  stage: ProjectStage;
  amount: number;
  region: LocalizedText;
  description: LocalizedText;
  owner: LocalizedText;
  raisedHint?: LocalizedText;
};

export const SEED_PROJECTS: Project[] = [
  {
    id: "navoi-textile",
    title: {
      ru: "Модернизация ткацкого производства",
      uz: "Toʻqimachilik ishlab chiqarishini modernizatsiya qilish",
      en: "Modernizing textile weaving production",
    },
    industry: { ru: "Текстиль", uz: "Toʻqimachilik", en: "Textiles" },
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
    industry: { ru: "Агро / логистика", uz: "Agro / logistika", en: "Agriculture / logistics" },
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
    industry: { ru: "Ремесло / e-com", uz: "Hunarmandchilik / e-tijorat", en: "Craft / e-commerce" },
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
    industry: { ru: "Энергетика", uz: "Energetika", en: "Energy" },
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
    industry: { ru: "IT / образование", uz: "IT / taʼlim", en: "IT / education" },
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
