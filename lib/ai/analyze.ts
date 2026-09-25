"use server";

import { getDictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { deriveAggregates } from "@/lib/finance/aggregate";
import { buildRuleAdvice } from "@/lib/finance/advice";
import { computeFrozenAssets, computeMarginBridge, computeRevenueSafetyMargin } from "@/lib/finance/insights";
import { calculateRatios } from "@/lib/finance/ratios";
import { computeVariance } from "@/lib/finance/variance";
import { callGeminiJson, extractJsonObject } from "@/lib/ai/gemini";
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

// ИИ-анализ через Google Gemini (gemini-3.8-flash, бесплатный тариф —
// выбрано пользователем взамен платного Anthropic, см.
// claude/analiz-kabinet-bp-bagi-status.md). У бесплатного тарифа Gemini НЕТ
// server-side веб-поиска (это платная функция Google), поэтому отраслевой
// бенчмаркинг модель теперь делает по собственным (обучающим) знаниям, а не
// по живому поиску — промпт явно требует честно ставить benchmark.available
// = false и не выдумывать цифры, если модель не уверена в конкретных
// узбекских/региональных показателях, а не выдавать оценку "с потолка" за
// подтверждённый факт.
// Числовые срезы (структура маржи, замороженные активы, запас прочности по
// выручке) считаются в коде (lib/finance/insights.ts) и передаются модели
// уже готовыми — она их комментирует, а не пересчитывает, так что итоговые
// цифры на странице и в тексте ИИ всегда совпадают.
// Ключ GEMINI_API_KEY добавляется в Vercel самим пользователем (получается
// бесплатно на aistudio.google.com); если ключа нет или вызов не удался —
// используется локальный разбор по правилам (buildRuleAdvice), сайт никогда
// не остаётся без ответа.
//
// Если передан второй период (periods[1]) — scoreDelta/ratioDeltas между
// двумя годами считаются локально через computeVariance() и НЕ зависят от
// ИИ (значит, дашборд отклонений работает даже без ключа Gemini); у ИИ
// дополнительно просим короткий текстовый комментарий variance.narrative —
// если ключа нет или ответ не распарсился, narrative остаётся пустой
// строкой, а числа всё равно на месте.
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

  const apiKey = process.env.GEMINI_API_KEY;
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
6. benchmark — у тебя НЕТ доступа к живому веб-поиску, поэтому используй только те отраслевые показатели по Узбекистану/Центральной Азии, в которых ты уверен по своим обучающим данным как в достоверных и не устаревших ориентирах. Если уверенности нет — верни available:false и честно объясни в note, что без доступа к актуальным открытым данным сравнение с отраслевыми показателями по Узбекистану сейчас дать нельзя; НИКОГДА не выдумывай цифры и не выдавай примерную оценку за подтверждённый факт.${varianceTask}

Дай развёрнутый разбор, опираясь на ВСЕ приведённые статьи баланса и ОПУ, а не только на итоговые коэффициенты. Ответ должен содержать ТОЛЬКО один валидный JSON-объект, без markdown-обёртки и без пояснений до или после, строго по схеме:
${responseSchema}`;

  const systemPrompt = `Ты финансовый консультант по МСБ Узбекистана. Ответ должен содержать ТОЛЬКО один валидный JSON-объект без markdown-обёртки и без пояснений вокруг него. Весь текст внутри JSON — на ${LANGUAGE_NAME[payload.locale] ?? "русском"} языке.`;

  try {
    const result = await callGeminiJson({
      apiKey,
      system: systemPrompt,
      user: userContent,
      maxOutputTokens: 3500,
    });

    if (!result.ok) return fallback;

    const parsed = extractJsonObject(result.text) as (Partial<AiAdvice> & { variance?: { narrative?: string } }) | null;
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
