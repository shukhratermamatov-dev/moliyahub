// База знаний ИИ-помощника MoliyaHub.
//
// Ничего не выдумываем и не дублируем вручную: всё собирается из тех же
// источников, что показывает сам сайт, — словарей i18n (Исламский гид, FAQ,
// советы, консалтинг, «О компании»), каталога продуктов lib/data/banks.ts,
// справочника банков ЦБ, отраслей, образцов ТЭО и партнёров. Поменяли текст
// на сайте — помощник автоматически знает новую версию.
//
// Дополнительные сведения, которых нет на страницах сайта (налоги, льготы,
// госпрограммы и т.п.), добавляются в lib/assistant/custom-knowledge.ts.
//
// Поиск — простой лексический (по основам слов), без векторной БД: корпус
// небольшой (десятки документов), и такой поиск прозрачен и бесплатен.
// Если база вырастет до сотен документов — заменить searchKnowledge() на
// pgvector в Supabase, интерфейс инструмента для модели останется прежним.

import type { Locale } from "@/i18n/config";
import ru from "@/i18n/dictionaries/ru";
import uz from "@/i18n/dictionaries/uz";
import en from "@/i18n/dictionaries/en";
import type { Dictionary } from "@/i18n/get-dictionary";
import { BANK_DIRECTORY, OFFERS } from "@/lib/data/banks";
import { BUSINESS_PLAN_SAMPLES } from "@/lib/data/business-plan-samples";
import { INDUSTRIES } from "@/lib/data/industries";
import { PARTNERS } from "@/lib/data/partners";
import { pickList, pickText } from "@/lib/i18n-text";
import { CUSTOM_KNOWLEDGE } from "./custom-knowledge";

const DICTS: Record<Locale, Dictionary> = { ru, uz, en };

export type KnowledgeDoc = {
  id: string;
  title: string;
  text: string;
  /** Путь на сайте без локали, например "/islamic-finance". */
  path?: string;
};

function bankCategoryLabel(locale: Locale, category: string): string {
  const labels: Record<Locale, Record<string, string>> = {
    ru: { STATE: "государственный", JOINT_STOCK: "акционерный", PRIVATE: "частный", FOREIGN_CAPITAL: "с иностранным капиталом" },
    uz: { STATE: "davlat", JOINT_STOCK: "aksiyadorlik", PRIVATE: "xususiy", FOREIGN_CAPITAL: "xorijiy kapitalli" },
    en: { STATE: "state-owned", JOINT_STOCK: "joint-stock", PRIVATE: "private", FOREIGN_CAPITAL: "foreign capital" },
  };
  return labels[locale][category] ?? category;
}

function buildDocs(locale: Locale): KnowledgeDoc[] {
  const d = DICTS[locale];
  const docs: KnowledgeDoc[] = [];

  // FAQ главной страницы
  d.home.faq.items.forEach((item, i) => {
    docs.push({ id: `faq-${i}`, title: item.q, text: item.a, path: "" });
  });

  // Исламский гид — вступление, четыре инструмента, дисклеймер
  docs.push({
    id: "islamic-intro",
    title: d.islamicGuide.title,
    text: `${d.islamicGuide.subtitle}. ${d.islamicGuide.intro} ${d.islamicGuide.disclaimer}`,
    path: "/islamic-finance",
  });
  for (const c of d.islamicGuide.concepts) {
    const noOffer = "noOfferNote" in c && c.noOfferNote ? ` ${c.noOfferNote}` : "";
    docs.push({
      id: `islamic-${c.id}`,
      title: `${c.name} — ${c.teaser}`,
      text: `${c.explanation} ${d.islamicGuide.differenceLabel}: ${c.difference} ${c.bestFor}${noOffer}`,
      path: "/islamic-finance",
    });
  }

  // Советы предпринимателям
  for (const tip of d.advicePage.tips) {
    docs.push({ id: `advice-${tip.id}`, title: tip.title, text: `${tip.teaser}. ${tip.text}`, path: "/advice" });
  }

  // Консалтинг (услуги команды MoliyaHub)
  docs.push({
    id: "consulting",
    title: d.consulting.title,
    text:
      `${d.consulting.subtitle} ` +
      d.consulting.services.map((s) => (s.description ? `${s.title}: ${s.description}` : s.title)).join("; ") +
      ". Контакты: +998 90 930 03 30, info@moliyahub.uz.",
    path: "/consulting",
  });

  // О компании и команда
  docs.push({
    id: "about",
    title: d.about.title,
    text: `${d.about.intro} ${d.about.team.map((m) => `${m.name} — ${m.role}. ${m.bio}`).join(" ")}`,
    path: "/about",
  });

  // Партнёры
  if (PARTNERS.length > 0) {
    docs.push({
      id: "partners",
      title: d.partners.title,
      text: PARTNERS.map((p) => `${p.name}: ${pickText(p.description, locale)} (${p.url})`).join(" "),
      path: "/partners",
    });
  }

  // Разделы сайта (что где находится)
  docs.push({
    id: "section-analyze",
    title: d.analyze.title,
    text: `${d.analyze.subtitle} ${d.analyze.aiHint}`,
    path: "/analyze",
  });
  docs.push({
    id: "section-financing",
    title: d.financing.title,
    text: d.financing.subtitle,
    path: "/financing",
  });
  docs.push({
    id: "section-projects",
    title: d.projectsIndex.title,
    text: d.projectsIndex.subtitle,
    path: "/projects",
  });
  docs.push({
    id: "section-business-plans",
    title: d.businessPlans.title,
    text: `${d.businessPlans.subtitle} ${d.businessPlans.aiBanner.text}`,
    path: "/business-plans",
  });
  docs.push({
    id: "section-business-plan-ai",
    title: d.businessPlanAi.title,
    text: d.businessPlanAi.subtitle,
    path: "/business-plan-ai",
  });

  // Каталог продуктов финансирования — краткая текстовая версия (для поиска
  // по смыслу; точный подбор с фильтрами делает инструмент search_financing)
  for (const o of OFFERS) {
    docs.push({
      id: `offer-${o.id}`,
      title: `${pickText(o.bank, locale)} — ${pickText(o.title, locale)}`,
      text:
        `${pickText(o.note, locale)} Цели: ${pickList(o.purpose, locale).join(", ")}. ` +
        `Тип: ${o.type}${o.islamic ? " (исламское финансирование)" : ""}.`,
      path: "/financing",
    });
  }

  // Справочник банков (реестр ЦБ РУз) — один документ
  docs.push({
    id: "bank-directory",
    title: d.bankDirectory.heading,
    text: `${d.bankDirectory.subtitle} ` + BANK_DIRECTORY.map((b) => `${pickText(b.name, locale)} (${bankCategoryLabel(locale, b.category)})`).join("; "),
    path: "/financing",
  });

  // Отрасли и образцы ТЭО
  for (const ind of INDUSTRIES) {
    const sample = BUSINESS_PLAN_SAMPLES[ind.id];
    const subs = ind.subIndustries.map((s) => pickText(s.name, locale)).join(", ");
    const sampleText = sample
      ? ` Образец ТЭО: ${cleanTable(sample.summary)} Точка безубыточности: ${cleanTable(sample.breakeven)} Окупаемость: ${cleanTable(sample.payback)}`
      : "";
    docs.push({
      id: `industry-${ind.id}`,
      title: `${pickText(ind.name, locale)} — ${d.businessPlans.title}`,
      text: `Подотрасли: ${subs}.${sampleText} Шаблоны: /business-plans/${ind.id}.docx и /business-plans/${ind.id}.xlsx`,
      path: "/business-plans",
    });
  }

  // Дополнительные сведения, добавленные владельцем сайта вручную
  for (const k of CUSTOM_KNOWLEDGE) {
    docs.push({
      id: `custom-${k.id}`,
      title: pickText(k.title, locale),
      text: pickText(k.text, locale),
      path: k.path,
    });
  }

  return docs;
}

// Образцы ТЭО извлекались из .docx через pandoc — убираем рамки таблиц.
function cleanTable(s: string): string {
  return s
    .replace(/[|]+/g, " ")
    .replace(/-{3,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const CACHE = new Map<Locale, KnowledgeDoc[]>();

export function getKnowledgeDocs(locale: Locale): KnowledgeDoc[] {
  let docs = CACHE.get(locale);
  if (!docs) {
    docs = buildDocs(locale);
    CACHE.set(locale, docs);
  }
  return docs;
}

// --- Поиск -----------------------------------------------------------------

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ʻʼ‘’`']/g, "'")
    .replace(/ё/g, "е");
}

// Грубое «стеммирование»: первые 5 символов слова — достаточно, чтобы
// «кредит/кредиты/кредитов» или «lizing/lizingga» совпадали, и не требует
// морфологических словарей для трёх языков.
function stems(s: string): string[] {
  return normalize(s)
    .split(/[^\p{L}\p{N}']+/u)
    .filter((w) => w.length >= 3)
    .map((w) => w.slice(0, 5));
}

export function searchKnowledge(query: string, locale: Locale, limit = 5): KnowledgeDoc[] {
  const q = Array.from(new Set(stems(query)));
  if (q.length === 0) return [];

  // Ищем по документам всех языков, но возвращаем в языке пользователя:
  // вопрос может прийти на узбекском, хотя интерфейс открыт на русском.
  const scores = new Map<string, number>();
  for (const lang of ["ru", "uz", "en"] as Locale[]) {
    for (const doc of getKnowledgeDocs(lang)) {
      const titleStems = new Set(stems(doc.title));
      const textStems = new Set(stems(doc.text));
      let score = 0;
      for (const w of q) {
        if (titleStems.has(w)) score += 3;
        else if (textStems.has(w)) score += 1;
      }
      if (score > (scores.get(doc.id) ?? 0)) scores.set(doc.id, score);
    }
  }

  const byId = new Map(getKnowledgeDocs(locale).map((doc) => [doc.id, doc]));
  return Array.from(scores.entries())
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => byId.get(id))
    .filter((doc): doc is KnowledgeDoc => Boolean(doc));
}
