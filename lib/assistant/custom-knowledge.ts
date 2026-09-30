import type { LocalizedText } from "@/lib/i18n-text";

// Дополнительные знания ИИ-помощника, которых нет на страницах сайта.
//
// Сюда стоит добавлять то, о чём предприниматели будут спрашивать чаще
// всего, но что помощник не должен «вспоминать» сам, потому что это
// меняется: налоговые режимы и ставки, льготы для МСБ, госпрограммы
// поддержки, требования банков к пакету документов и т.п.
//
// Правила:
//  - только проверенные сведения, с указанием источника и даты в тексте
//    («по данным soliq.uz на 01.10.2026 …») — помощник передаст их
//    пользователю вместе с источником;
//  - текст на трёх языках (ru обязателен; если uz/en пока нет — можно
//    временно продублировать ru, модель ответит на языке пользователя);
//  - после изменения ставок — обновить запись, старые цифры хуже, чем
//    их отсутствие.
//
// Пример записи (раскомментируйте и заполните):
//
// {
//   id: "tax-regimes",
//   title: { ru: "Налоговые режимы для МСБ", uz: "...", en: "..." },
//   text: {
//     ru: "По данным soliq.uz на <дата>: ...",
//     uz: "...",
//     en: "...",
//   },
//   path: "/advice",
// },

export type CustomKnowledgeEntry = {
  id: string;
  title: LocalizedText;
  text: LocalizedText;
  /** Страница сайта, на которую уместно сослаться (без локали), если есть. */
  path?: string;
};

export const CUSTOM_KNOWLEDGE: CustomKnowledgeEntry[] = [
  {
    id: "official-sources",
    title: {
      ru: "Официальные источники: налоги, законы, госуслуги",
      uz: "Rasmiy manbalar: soliqlar, qonunlar, davlat xizmatlari",
      en: "Official sources: taxes, laws, public services",
    },
    text: {
      ru: "Актуальные налоговые ставки и отчётность — Налоговый комитет (soliq.uz). Тексты законов и постановлений — LexUz (lex.uz). Ставки и курсы ЦБ — cbu.uz. Регистрация бизнеса и госуслуги — my.gov.uz. Господдержка предпринимательства — АО «Компания по развитию предпринимательства» (trk.uz). Финансовая грамотность — finlit.uz.",
      uz: "Amaldagi soliq stavkalari va hisobotlar — Soliq qo'mitasi (soliq.uz). Qonun va qarorlar matni — LexUz (lex.uz). Markaziy bank stavkalari va kurslari — cbu.uz. Biznesni ro'yxatdan o'tkazish va davlat xizmatlari — my.gov.uz. Tadbirkorlikni davlat tomonidan qo'llab-quvvatlash — «Tadbirkorlikni rivojlantirish kompaniyasi» AJ (trk.uz). Moliyaviy savodxonlik — finlit.uz.",
      en: "Current tax rates and reporting — Tax Committee (soliq.uz). Texts of laws and resolutions — LexUz (lex.uz). Central Bank rates and exchange rates — cbu.uz. Business registration and public services — my.gov.uz. State support for entrepreneurs — Entrepreneurship Development Company JSC (trk.uz). Financial literacy — finlit.uz.",
    },
  },
];
