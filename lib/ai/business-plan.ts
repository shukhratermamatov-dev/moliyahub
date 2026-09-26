"use server";

import type { Locale } from "@/i18n/config";
import { findIndustry, resolveSubIndustryLabel } from "@/lib/data/industries";
import { findBusinessPlanSample } from "@/lib/data/business-plan-samples";
import { pickText } from "@/lib/i18n-text";
import { callGeminiJson, extractJsonObject } from "@/lib/ai/gemini";
import type { BusinessPlan, BusinessPlanInput, BusinessPlanSource } from "@/lib/business-plan/types";

const LANGUAGE_NAME: Record<Locale, string> = {
  ru: "русском",
  uz: "узбекском (латиница)",
  en: "английском",
};

const STAGE_NAME_RU: Record<BusinessPlanInput["stage"], string> = {
  IDEA: "идея, ещё не запущено",
  MVP: "есть MVP / пилот",
  GROWTH: "растущий бизнес",
  SCALE: "масштабирование",
};

const RESPONSE_SCHEMA =
  '{"executiveSummary":"","companyDescription":"","marketAnalysisUzbekistan":"",' +
  '"marketAnalysisForeign":[{"country":"","body":""}],"marketing":"","operations":"",' +
  '"organization":"","risks":"","financials":{"currency":"UZS","initialInvestment":0,' +
  '"startupCosts":[{"label":"","amount":0,"note":""}],"monthlyRevenue":[{"label":"","amount":0,"note":""}],' +
  '"monthlyCosts":[{"label":"","amount":0,"note":""}],"breakEvenMonths":0,"paybackMonths":0,"assumptions":""}}';

type RawPlan = {
  executiveSummary?: string;
  companyDescription?: string;
  marketAnalysisUzbekistan?: string;
  marketAnalysisForeign?: { country?: string; body?: string }[];
  marketing?: string;
  operations?: string;
  organization?: string;
  risks?: string;
  financials?: {
    currency?: string;
    initialInvestment?: number;
    startupCosts?: { label?: string; amount?: number; note?: string }[];
    monthlyRevenue?: { label?: string; amount?: number; note?: string }[];
    monthlyCosts?: { label?: string; amount?: number; note?: string }[];
    breakEvenMonths?: number;
    paybackMonths?: number;
    assumptions?: string;
  };
};

function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizePlan(
  raw: RawPlan,
  input: BusinessPlanInput,
  industryLabel: string,
  subIndustryLabel: string | undefined,
  sources: BusinessPlanSource[],
): BusinessPlan | null {
  if (!raw.executiveSummary || !raw.financials) return null;

  return {
    projectName: input.projectName,
    industryLabel,
    subIndustryLabel,
    region: input.region,
    idea: input.idea,
    generatedAt: new Date().toISOString(),
    executiveSummary: raw.executiveSummary,
    companyDescription: raw.companyDescription ?? "",
    marketAnalysisUzbekistan: raw.marketAnalysisUzbekistan ?? "",
    marketAnalysisForeign: (raw.marketAnalysisForeign ?? [])
      .filter((m) => m?.country && m?.body)
      .map((m) => ({ country: m.country as string, body: m.body as string })),
    marketing: raw.marketing ?? "",
    operations: raw.operations ?? "",
    organization: raw.organization ?? "",
    risks: raw.risks ?? "",
    financials: {
      currency: "UZS",
      initialInvestment: num(raw.financials.initialInvestment, input.investmentAmount),
      startupCosts: (raw.financials.startupCosts ?? [])
        .filter((l) => l?.label)
        .map((l) => ({ label: l.label as string, amount: num(l.amount), note: l.note })),
      monthlyRevenue: (raw.financials.monthlyRevenue ?? [])
        .filter((l) => l?.label)
        .map((l) => ({ label: l.label as string, amount: num(l.amount), note: l.note })),
      monthlyCosts: (raw.financials.monthlyCosts ?? [])
        .filter((l) => l?.label)
        .map((l) => ({ label: l.label as string, amount: num(l.amount), note: l.note })),
      breakEvenMonths: num(raw.financials.breakEvenMonths),
      paybackMonths: num(raw.financials.paybackMonths),
      assumptions: raw.financials.assumptions ?? "",
    },
    sources,
  };
}

export type GenerateBusinessPlanResult =
  | { ok: true; plan: BusinessPlan }
  | { ok: false; error: "not_configured" | "generation_failed" };

// Генерация бизнес-плана через Google Gemini (gemini-3.8-flash, бесплатный
// тариф — выбрано пользователем взамен платного Anthropic, см.
// claude/analiz-kabinet-bp-bagi-status.md). Ключ GEMINI_API_KEY добавляется
// в Vercel самим пользователем (бесплатно на aistudio.google.com); если
// ключа нет — сразу отдаём not_configured, ничего не выдумывая вместо
// реального ИИ.
//
// У бесплатного тарифа Gemini нет server-side веб-поиска с грaundingом —
// вместо живого поиска рынка (как раньше делал Anthropic) модель получает
// в промпте выдержки из уже готового банковского ТЭО-образца ТОЙ ЖЕ отрасли
// (lib/data/business-plan-samples.ts — извлечено из готовых файлов
// public/business-plans/<id>.docx: анализ рынка, пример сметы/финансового
// плана, точка безубыточности, срок окупаемости, оценка рисков) — по
// прямому требованию пользователя, что БП должен формироваться "на
// основании уже имеющихся образцов на сайте". Модель явно инструктирована
// не копировать образец как есть, а использовать его как справочный
// ориентир по рынку/цифрам и подстроить всё под конкретный проект
// пользователя (другая сумма, идея, регион, стадия).
export async function generateBusinessPlan(
  input: BusinessPlanInput,
  locale: Locale,
): Promise<GenerateBusinessPlanResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, error: "not_configured" };

  const industry = findIndustry(input.industryId);
  const industryLabel = industry ? pickText(industry.name, locale) : input.industryId;
  const subIndustryLabel = resolveSubIndustryLabel(
    input.industryId,
    input.subIndustryId,
    input.subIndustryOther,
    locale,
  );
  const sample = findBusinessPlanSample(input.industryId);

  const sampleBlock = sample
    ? `

Справочный материал — выдержки из готового образца технико-экономического обоснования (ТЭО) MoliyaHub для отрасли "${sample.marketLabel}" (реальные рыночные ориентиры 2025-2026 года, ранее подготовленные для сайта). Используй их как справочную базу для анализа рынка и порядка величины финансовых показателей, НЕ копируй пример как есть — адаптируй под конкретные вводные этого проекта (другая сумма инвестиций, идея, регион, стадия):

Пример проекта из образца:
${sample.summary}

Анализ рынка из образца:
${sample.market}

Маркетинговый план из образца:
${sample.marketing}

Структура выручки/затрат из образца:
${sample.financial}

Точка безубыточности из образца:
${sample.breakeven}

Срок окупаемости из образца:
${sample.payback}

Оценка рисков из образца:
${sample.risks}`
    : "\n\nДля этой отрасли готового образца на сайте нет — сформируй анализ рынка и финансовый прогноз по своим общим знаниям, честно отметив в тексте, что это ориентировочная оценка, а не подтверждённые данные.";

  const userContent = `Составь бизнес-план для предпринимателя из Узбекистана по следующим данным:

Отрасль: ${industryLabel}${subIndustryLabel ? ` (${subIndustryLabel})` : ""}
Название проекта: ${input.projectName}
Идея / суть проекта: ${input.idea}
Регион реализации: ${input.region || "не указан"}
Планируемая сумма инвестиций: ${input.investmentAmount.toLocaleString("ru-RU")} сум
Стадия: ${STAGE_NAME_RU[input.stage]}
${input.teamSize ? `Команда: ${input.teamSize}\n` : ""}${input.timeframeMonths ? `Горизонт планирования: ${input.timeframeMonths} мес.\n` : ""}
У тебя НЕТ доступа к живому веб-поиску. Используй справочный материал из готового образца ниже (если он есть для этой отрасли) как основу для анализа рынка Узбекистана и порядка величины сумм, адаптируя его под данные именно этого проекта, а не переписывая как есть. Для сравнения с 2-3 зарубежными рынками (marketAnalysisForeign) используй свои общие знания о Центральной Азии и/или релевантных для этой отрасли развитых рынках, честно отмечая в тексте, где это твоя оценка, а не подтверждённый факт.${sampleBlock}

Финансовый раздел — это твой обоснованный прогноз под указанную сумму инвестиций и идею проекта (а не проверенные рыночные данные): реалистичные стартовые затраты, ежемесячная выручка и расходы, срок выхода на окупаемость и срок возврата инвестиций.

Ответ должен содержать ТОЛЬКО один валидный JSON-объект, без markdown-обёртки и без пояснений до или после, строго по схеме: ${RESPONSE_SCHEMA}`;

  const systemPrompt =
    `Ты — консультант по бизнес-планированию для предпринимателей Узбекистана. ` +
    `Ответ должен содержать ТОЛЬКО один валидный JSON-объект, без markdown-обёртки и без пояснений до или после. ` +
    `Весь текст внутри JSON — на ${LANGUAGE_NAME[locale] ?? "русском"} языке. Пиши по существу, ` +
    `конкретно для этого проекта, без общих фраз "как в любом бизнес-плане".`;

  try {
    const result = await callGeminiJson({
      apiKey,
      system: systemPrompt,
      user: userContent,
      maxOutputTokens: 8000,
    });

    if (!result.ok) return { ok: false, error: "generation_failed" };

    const raw = extractJsonObject(result.text) as RawPlan | null;
    if (!raw) return { ok: false, error: "generation_failed" };

    // Источников из веб-поиска больше нет (Gemini free tier без grounding) —
    // вместо этого честно указываем, какой готовый образец сайта послужил
    // справочной базой, со ссылкой на реальный скачиваемый файл.
    const sources: BusinessPlanSource[] = sample
      ? [{ title: `Образец ТЭО MoliyaHub — ${sample.marketLabel}`, url: `/business-plans/${input.industryId}.docx` }]
      : [];

    const plan = normalizePlan(raw, input, industryLabel, subIndustryLabel, sources);
    if (!plan) return { ok: false, error: "generation_failed" };

    return { ok: true, plan };
  } catch {
    return { ok: false, error: "generation_failed" };
  }
}
