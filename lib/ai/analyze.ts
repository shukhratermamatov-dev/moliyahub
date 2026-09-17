"use server";

import { getDictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { deriveAggregates } from "@/lib/finance/aggregate";
import { buildRuleAdvice } from "@/lib/finance/advice";
import { computeFrozenAssets, computeMarginBridge, computeRevenueSafetyMargin } from "@/lib/finance/insights";
import { calculateRatios } from "@/lib/finance/ratios";
import { computeVariance } from "@/lib/finance/variance";
import type { AiAdvice, FinancePeriod } from "@/lib/finance/types";

type AnalyzeInput = {
  // periods[0] — основной (последний/единственный) отчётный период, на нём
  // считаются все показатели, как и раньше; periods[1] — необязательный
  // второй год для сравнения (появляется только если пользователь его добавил).
  periods: FinancePeriod[];
  industry?: string;
  region?: string;
  locale: Locale;
};

const LANGUAGE_NAME: Record<Locale, string> = {
  ru: "русском",
  uz: "узбекском (латиница)",
  en: "английском",
};

const BASE_SCHEMA_FIELDS =
  '"summary":"","score_comment":"",' +
  '"red_flags":[{"indicator":"","value":"","why_critical":"","priority":1}],' +
  '"strengths":[""],"weaknesses":[""],' +
  '"recommendations":[{"title":"","description":"","expected_effect":"","priority":1,"difficulty":"low","timeframe":""}],' +
  '"financing_advice":"","margin_commentary":"","frozen_assets_commentary":"","safety_margin_commentary":"",' +
  '"benchmark":{"available":false,"note":"","comparisons":[{"metric":"","company_value":"","benchmark_value":"","source":""}]}';

const VARIANCE_SCHEMA_FIELD = ',"variance":{"narrative":""}';

type AnthropicTextBlock = { type: "text"; text: string };

// Извлекает JSON-объект из финального текстового ответа модели — на случай,
// если модель обернула его в ```json fences вопреки инструкции. Тот же приём,
// что в lib/ai/business-plan.ts (нужен, когда включён server tool веб-поиска —
// тогда старая "затравка" ассистента символом "{" не работает: с
// инструментами Anthropic не разрешает предзаполнять ответ ассистента).
function extractJson(text: string): unknown | null {
  const withoutFence = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(withoutFence.slice(start, end + 1));
  } catch {
    return null;
  }
}

// ИИ-анализ через Anthropic (Claude), с включённым веб-поиском (server tool)
// для отраслевого бенчмаркинга — модель ищет реальные публикуемые показатели
// и обязана честно писать benchmark.available=false, если ничего надёжного не
// нашла, а не выдумывать цифры. Числовые срезы (структура маржи, замороженные
// активы, запас прочности по выручке) считаются в коде (lib/finance/insights.ts)
// и передаются модели уже готовыми — она их комментирует, а не пересчитывает,
// так что итоговые цифры на странице и в тексте ИИ всегда совпадают.
// Ключ ANTHROPIC_API_KEY добавляется в Vercel самим пользователем; если ключа
// нет или вызов не удался — используется локальный разбор по правилам
// (buildRuleAdvice), сайт никогда не остаётся без ответа.
//
// Если передан второй период (periods[1]) — scoreDelta/ratioDeltas между двумя
// годами считаются локально через computeVariance() и НЕ зависят от ИИ (значит,
// дашборд отклонений работает даже без ключа Anthropic); у ИИ дополнительно
// просим короткий текстовый комментарий variance.narrative — если ключа нет
// или ответ не распарсился, narrative остаётся пустой строкой, а числа всё
// равно на месте.
export async function requestAiAdvice(payload: AnalyzeInput): Promise<AiAdvice> {
  const dict = await getDictionary(payload.locale);
  const primary = payload.periods[0];
  const second = payload.periods[1];

  const aggregate = deriveAggregates(primary.data);
  const ratios = calculateRatios(aggregate);
  const marginBridge = computeMarginBridge(primary.data);
  const frozenAssets = computeFrozenAssets(primary.data, aggregate.totalAssets);
  const safetyMargin = computeRevenueSafetyMargin(primary.data);
  const fallback = buildRuleAdvice(aggregate, ratios, dict, payload.locale, primary.data);

  if (second) {
    const aggregate2 = deriveAggregates(second.data);
    const ratios2 = calculateRatios(aggregate2);
    fallback.variance = { ...computeVariance(ratios, ratios2), narrative: "" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallback;

  const secondPeriodBlock = second
    ? `

Второй отчётный период для сравнения — год ${second.year} (первый — год ${primary.year}). Полный баланс и ОПУ этого периода (JSON):
${JSON.stringify(second.data)}

Рассчитанные коэффициенты второго периода (JSON):
${JSON.stringify(calculateRatios(deriveAggregates(second.data)))}`
    : "";

  const varianceTask = second
    ? `\n7. variance.narrative — короткий (2-4 предложения) человеческим языком комментарий, что изменилось между годом ${primary.year} и годом ${second.year}: какие показатели улучшились/ухудшились и что это значит для бизнеса. Не пересчитывай дельты сам — просто прокомментируй направление и масштаб изменений по переданным данным обоих периодов.`
    : "";

  const responseSchema = `{${BASE_SCHEMA_FIELDS}${second ? VARIANCE_SCHEMA_FIELD : ""}}`;

  const userContent = `Отрасль: ${payload.industry || "не указана"}
Регион: ${payload.region || "не указан"}
Основной отчётный период — год ${primary.year}. Балл: ${ratios.score}/100

Полный баланс и отчёт о финансовых результатах предприятия, укрупнённые статьи, в сумах (JSON):
${JSON.stringify(primary.data)}

Рассчитанные финансовые коэффициенты (JSON):
${JSON.stringify(ratios)}

Уже посчитанная структура маржи — себестоимость и статьи ОПУ как доля от выручки, и какая статья сильнее всего "съедает" маржу после себестоимости (JSON, не пересчитывай эти числа заново, используй как есть):
${JSON.stringify(marginBridge)}

Уже посчитанный разбор, какие активы замораживают свободные деньги (топ статей по сумме, доля от суммарных активов, дни оборота запасов и дебиторки) (JSON):
${JSON.stringify(frozenAssets)}

Уже посчитанный запас прочности по выручке — на сколько можно упасть в выручке до выхода в операционный убыток (JSON, поле status: "ok" — есть запас, "already_at_or_below_breakeven" — уже на грани или за гранью безубыточности, "loses_on_every_sale" — себестоимость съедает всю выручку, запаса не существует в принципе, "insufficient_data" — выручка нулевая):
${JSON.stringify(safetyMargin)}${secondPeriodBlock}

Задача — развёрнутый разбор для предпринимателя МСБ Узбекистана. Обязательно включи:
1. Сильные и слабые стороны (weaknesses — это более широкий список, чем red_flags: red_flags только для по-настоящему критичных проблем с приоритетом и объяснением почему критично; weaknesses — более мягкие моменты, на которые стоит обратить внимание, но без паники).
2. Рекомендации (recommendations), ориентированные конкретно на отрасль "${payload.industry || "не указана"}" — не общие фразы "сократите расходы", а то, что реально применимо в этой отрасли в Узбекистане.
3. margin_commentary — простыми словами объясни, где компания теряет маржинальность, опираясь на переданную структуру маржи (marginBridge) и её biggestDrag.
4. frozen_assets_commentary — объясни, в каких активах заморожены деньги, опираясь на переданный разбор (frozenAssets), включая дни оборота запасов/дебиторки, если они посчитаны.
5. safety_margin_commentary — объясни человеческим языком безопасный порог снижения выручки, опираясь на переданный расчёт (safetyMargin): на сколько % может упасть выручка до операционного убытка, и что произойдёт, если status не "ok".
6. benchmark — воспользуйся веб-поиском, чтобы найти РЕАЛЬНЫЕ публикуемые средние показатели по отрасли "${payload.industry || "не указана"}" (в Узбекистане, а если не нашлось — в Центральной Азии или в целом по развивающимся рынкам, явно уточнив это в note). Сравнивай с показателями, где сравнение осмысленно (рентабельность, оборачиваемость, автономия). Если ничего достоверного с указанием источника не нашлось — верни available:false и честно объясни в note, что открытых отраслевых данных по коэффициентам для Узбекистана нет; НИКОГДА не выдумывай цифры и не выдавай примерную оценку за подтверждённый факт.${varianceTask}

Дай развёрнутый разбор, опираясь на ВСЕ приведённые статьи баланса и ОПУ, а не только на итоговые коэффициенты. Когда данных для веб-поиска достаточно (или сразу, если он не даёт результата за 2-3 запроса), дай финальный ответ — он должен содержать ТОЛЬКО один валидный JSON-объект, без markdown-обёртки и без пояснений до или после, строго по схеме:
${responseSchema}`;

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
        max_tokens: 3500,
        system: `Ты финансовый консультант по МСБ Узбекистана. Когда данных для ответа достаточно, финальный ответ должен содержать ТОЛЬКО один валидный JSON-объект без markdown-обёртки и без пояснений вокруг него. Весь текст внутри JSON — на ${LANGUAGE_NAME[payload.locale] ?? "русском"} языке.`,
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 4 }],
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!res.ok) return fallback;

    const body = (await res.json()) as { content?: AnthropicTextBlock[] };
    const textBlocks = (body.content ?? []).filter((c) => c.type === "text");
    if (textBlocks.length === 0) return fallback;

    const fullText = textBlocks.map((b) => b.text).join("\n");
    const parsed = extractJson(fullText) as (Partial<AiAdvice> & { variance?: { narrative?: string } }) | null;
    if (!parsed || !parsed.summary || !Array.isArray(parsed.recommendations)) return fallback;

    const advice: AiAdvice = {
      summary: parsed.summary,
      score_comment: parsed.score_comment ?? "",
      red_flags: Array.isArray(parsed.red_flags) ? parsed.red_flags : [],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      recommendations: parsed.recommendations,
      financing_advice: parsed.financing_advice ?? "",
      margin_commentary: parsed.margin_commentary ?? "",
      frozen_assets_commentary: parsed.frozen_assets_commentary ?? "",
      safety_margin_commentary: parsed.safety_margin_commentary ?? "",
      benchmark:
        parsed.benchmark && typeof parsed.benchmark === "object"
          ? {
              available: !!parsed.benchmark.available,
              note: parsed.benchmark.note ?? "",
              comparisons: Array.isArray(parsed.benchmark.comparisons) ? parsed.benchmark.comparisons : [],
            }
          : { available: false, note: "", comparisons: [] },
      source: "ai",
    };

    if (second) {
      const aggregate2 = deriveAggregates(second.data);
      const ratios2 = calculateRatios(aggregate2);
      advice.variance = { ...computeVariance(ratios, ratios2), narrative: parsed.variance?.narrative ?? "" };
    }

    return advice;
  } catch {
    return fallback;
  }
}
