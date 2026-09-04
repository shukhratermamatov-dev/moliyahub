export type ProjectStage = "IDEA" | "MVP" | "GROWTH" | "SCALE";

export const STAGE_LABEL: Record<ProjectStage, string> = {
  IDEA: "Идея",
  MVP: "MVP",
  GROWTH: "Рост",
  SCALE: "Масштаб",
};

export type Project = {
  id: string;
  title: string;
  industry: string;
  stage: ProjectStage;
  amount: number;
  region: string;
  description: string;
  owner: string;
  raisedHint?: string;
};

export const SEED_PROJECTS: Project[] = [
  {
    id: "navoi-textile",
    title: "Модернизация ткацкого производства",
    industry: "Текстиль",
    stage: "GROWTH",
    amount: 2_500_000_000,
    region: "Навоийская область",
    owner: "ООО «Навоий Текстиль»",
    description:
      "Закупка нового оборудования, рост мощности на 40% и выход на экспорт в Казахстан и Турцию. Есть действующие контракты и цех.",
    raisedHint: "Ищут стратегического партнёра, не только долг",
  },
  {
    id: "tashkent-cold",
    title: "Холодильная логистика для фермеров",
    industry: "Агро / логистика",
    stage: "MVP",
    amount: 1_200_000_000,
    region: "Ташкентская область",
    owner: "ColdChain Uz",
    description:
      "Сеть мини-складов у полей: меньше потерь урожая, подписка для фермерских хозяйств. Пилот на 3 точках уже работает.",
  },
  {
    id: "samarkand-craft",
    title: "Экспорт керамики и сувениров",
    industry: "Ремесло / e-com",
    stage: "SCALE",
    amount: 800_000_000,
    region: "Самарканд",
    owner: "Silk Clay",
    description:
      "Маркетплейс мастеров + своя фасовка и логистика в ЕС. Нужны оборотные средства на сезон и сертификация.",
  },
  {
    id: "fergana-solar",
    title: "Солнечные станции для теплиц",
    industry: "Энергетика",
    stage: "GROWTH",
    amount: 4_000_000_000,
    region: "Ферганская долина",
    owner: "GreenGlass",
    description:
      "Установка крышных станций с договором на выкуп электроэнергии. Снижает себестоимость овощей зимой.",
  },
  {
    id: "it-edtech",
    title: "EdTech для бухгалтеров МСБ",
    industry: "IT / образование",
    stage: "MVP",
    amount: 450_000_000,
    region: "Ташкент",
    owner: "HisobLab",
    description:
      "Онлайн-курсы и шаблоны отчётности на узбекском и русском. 1 200 платящих учеников, ищем рост в регионы.",
  },
];
