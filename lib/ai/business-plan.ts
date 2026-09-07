"use server";

import type { Locale } from "@/i18n/config";
import { findIndustry, findSubIndustry } from "@/lib/data/industries";
import { pickText } from "@/lib/i18n-text";
import type { BusinessPlan, BusinessPlanInput, BusinessPlanSource } from "@/lib/business-plan/types";

// У серверных экшенов на Vercel есть лимит времени выполнения — генерация с
// веб-поиском (несколько запросов подряд) может занимать заметно дольше
// обычного ИИ-вызова, поэтому увеличиваем лимит для этого файла.
export const maxDuration = 60;

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

type AnthropicTextBlock = {
  type: "text";
  text: string;
  citations?: { type: string; url?: string; title?: string }[];
};

// Извлекает JSON-объект из финального текстового ответа модели — на случай,
// если модель всё же обернула его в ```json fences вопреки инструкции в
// system-промпте, а не отдала как есть.
function extractJson(text: string): RawPlan | null {
  const withoutFence = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(withoutFence.slice(start, end + 1)) as RawPlan;
  } catch {
    return null;
  }
}

function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizePlan(raw: RawPlan, input: BusinessPlanInput, industryLabel: string, subIndustryLabel: string | undefined, sources: BusinessPlanSource[]): BusinessPlan | null {
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

// Генерация бизнес-плана через Anthropic (Claude) с включённым инструментом
// веб-поиска (server tool — выполняется на стороне Anthropic в рамках этого
// же запроса, без ручного цикла tool_use/tool_result с нашей стороны). Ключ
// ANTHROPIC_API_KEY добавляется в Vercel самим пользователем; если ключа нет
// — сразу отдаём not_configured, ничего не выдумывая вместо реального ИИ.
export async function generateBusinessPlan(
  input: BusinessPlanInput,
  locale: Locale,
): Promise<GenerateBusinessPlanResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, error: "not_configured" };

  const industry = findIndustry(input.industryId);
  const sub = findSubIndustry(input.industryId, input.subIndustryId);
  const industryLabel = industry ? pickText(industry.name, locale) : input.industryId;
  const subIndustryLabel = sub ? pickText(sub.name, locale) : undefined;

  const userContent = `Составь бизнес-план для предпринимателя из Узбекистана по следующим данным:

Отрасль: ${industryLabel}${subIndustryLabel ? ` (${subIndustryLabel})` : ""}
Название проекта: ${input.projectName}
Идея / суть проекта: ${input.idea}
Регион реализации: ${input.region || "не указан"}
Планируемая сумма инвестиций: ${input.investmentAmount.toLocaleString("ru-RU")} сум
Стадия: ${STAGE_NAME_RU[input.stage]}
${input.teamSize ? `Команда: ${input.teamSize}\n` : ""}${input.timeframeMonths ? `Горизонт планирования: ${input.timeframeMonths} мес.\n` : ""}
Обязательно используй веб-поиск (минимум 3-5 запросов), чтобы найти актуальные реальные данные о рынке Узбекистана для этой отрасли/продукта (объём, динамика, спрос, регуляторика, ключевые игроки), а затем сравни с 2-3 зарубежными рынками, разумными для сопоставления (соседи по Центральной Азии и/или релевантные развитые рынки для этой отрасли). Если по какому-то пункту не нашлось проверенных данных — так и напиши в тексте, не выдавай оценку за подтверждённый факт.

Финансовый раздел — это твой обоснованный прогноз под указанную сумму инвестиций и идею проекта (а не проверенные рыночные данные): реалистичные стартовые затраты, ежемесячная выручка и расходы, срок выхода на окупаемость и срок возврата инвестиций.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 8000,
        system:
          `Ты — консультант по бизнес-планированию для предпринимателей Узбекистана. ` +
          `Сначала обязательно воспользуйся инструментом веб-поиска, чтобы найти актуальные реальные данные ` +
          `о рынке Узбекистана и 2-3 зарубежных рынках для указанной отрасли. Затем, когда данных достаточно, ` +
          `дай финальный ответ — он должен содержать ТОЛЬКО один валидный JSON-объект, без markdown-обёртки ` +
          `и без пояснений до или после, строго по схеме: ${RESPONSE_SCHEMA}\n` +
          `Весь текст внутри JSON — на ${LANGUAGE_NAME[locale] ?? "русском"} языке. Пиши по существу, ` +
          `конкретно для этого проекта, без общих фраз "как в любом бизнес-плане".`,
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 8 }],
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!res.ok) return { ok: false, error: "generation_failed" };

    const body = (await res.json()) as { content?: AnthropicTextBlock[] };
    const textBlocks = (body.content ?? []).filter((c) => c.type === "text");
    if (textBlocks.length === 0) return { ok: false, error: "generation_failed" };

    const fullText = textBlocks.map((b) => b.text).join("\n");
    const raw = extractJson(fullText);
    if (!raw) return { ok: false, error: "generation_failed" };

    const seen = new Set<string>();
    const sources: BusinessPlanSource[] = [];
    for (const block of textBlocks) {
      for (const c of block.citations ?? []) {
        if (c.type !== "web_search_result_location" || !c.url || seen.has(c.url)) continue;
        seen.add(c.url);
        sources.push({ title: c.title || c.url, url: c.url });
      }
    }

    const plan = normalizePlan(raw, input, industryLabel, subIndustryLabel, sources);
    if (!plan) return { ok: false, error: "generation_failed" };

    return { ok: true, plan };
  } catch {
    return { ok: false, error: "generation_failed" };
  }
}
