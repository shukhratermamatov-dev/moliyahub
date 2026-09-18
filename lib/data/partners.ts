import type { LocalizedText } from "@/lib/i18n-text";

export type PartnerCategory =
  | "DISTRIBUTION"
  | "BANK"
  | "GOVERNMENT"
  | "ASSOCIATION"
  | "MEDIA"
  | "CONSULTING";

export type Partner = {
  id: string;
  /** Название компании — вводится как есть, не переводится (юр. лица/бренды). */
  name: string;
  category: PartnerCategory;
  description: LocalizedText;
  url: string;
  /** Домен партнёра для логотипа (через прокси фавиконок, как у BankLogo). Нет — аватар с инициалом. */
  logoDomain?: string;
};

export const PARTNERS: Partner[] = [
  {
    id: "firstgroup",
    name: 'ООО "FIRSTGROUP"',
    category: "DISTRIBUTION",
    description: {
      ru: 'ООО «FIRSTGROUP» — крупнейший дистрибьютор FMCG.',
      uz: '«FIRSTGROUP» MChJ — FMCG bo\'yicha eng yirik distribyutor.',
      en: 'FIRSTGROUP LLC — the largest FMCG distributor.',
    },
    url: "https://ayvengroup.com/",
    logoDomain: "ayvengroup.com",
  },
];
