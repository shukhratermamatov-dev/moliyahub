"use server";

import { getDictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { deriveAggregates } from "@/lib/finance/aggregate";
import { buildRuleAdvice } from "@/lib/finance/advice";
import { calculateRatios } from "@/lib/finance/ratios";
import type { AiAdvice, FinanceData } from "@/lib/finance/types";

type AnalyzeInput = {
  data: FinanceData;
  industry?: string;
  region?: string;
  locale: Locale;
};

const LANGUAGE_NAME: Record<Locale, string> = {
  ru: "русском",
  uz: "узбекском (латиница)",
  en: "английском",
};

const RESPONSE_SCHEMA =
  '{"summary":"","score_comment":"","red_flags":[{"indicator":"","value":"","why_critical":"","priority":1}],' +
  '"strengths":[""],"recommendations":[{"title":"","description":"","expected_effect":"","priority":1,"difficulty":"low","timeframe":""}],' +
  '"financing_advice":""}';

// ИИ-анализ через Anthropic (Claude). Раньше здесь был xAI Grok — переключено
// по решению пользователя. Ключ ANTHROPIC_API_KEY добавляется в Vercel самим
// пользователем (мы его туда не вводим); если ключа нет или вызов не удался —
// используется тот же локальный разбор по правилам (buildRuleAdvice), что и
// раньше — сайт никогда не остаётся без ответа.
export async function requestAiAdvice(payload: AnalyzeInput): Promise<AiAdvice> {
  const dict = await getDictionary(payload.locale);
  const aggregate = deriveAggregates(payload.data);
  const ratios = calculateRatios(aggregate);
  const fallback = buildRuleAdvice(aggregate, ratios, dict, payload.locale);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallback;

  const userContent = `Отрасль: ${payload.industry || "не указана"}
Регион: ${payload.region || "не указан"}
Балл: ${ratios.score}/100

Полный баланс и отчёт о финансовых результатах предприятия, укрупнённые статьи, в сумах (JSON):
${JSON.stringify(payload.data)}

Рассчитанные финансовые коэффициенты (JSON):
${JSON.stringify(ratios)}

Дай развёрнутый разбор, опираясь на ВСЕ приведённые статьи баланса и ОПУ, а не только на итоговые коэффициенты — учитывай структуру активов, состав капитала и обязательств, статьи расходов периода и их влияние на прибыль. Верни ТОЛЬКО валидный JSON без markdown и без пояснений вокруг него, строго по схеме:
${RESPONSE_SCHEMA}`;

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
        max_tokens: 1400,
        system: `Ты финансовый консультант по МСБ Узбекистана. Отвечай только валидным JSON без markdown и без пояснений вокруг него. Весь текст внутри JSON — на ${LANGUAGE_NAME[payload.locale] ?? "русском"} языке.`,
        messages: [
          { role: "user", content: userContent },
          // "Затравка" ассистента символом "{" — стандартный приём, чтобы
          // модель продолжила строго с валидного JSON (у Anthropic нет
          // отдельного параметра response_format: json_object, как у xAI).
          { role: "assistant", content: "{" },
        ],
      }),
    });

    if (!res.ok) return fallback;

    const body = (await res.json()) as { content?: { type: string; text?: string }[] };
    const textPart = body.content?.find((c) => c.type === "text")?.text;
    if (!textPart) return fallback;

    const jsonText = textPart.trimStart().startsWith("{") ? textPart : `{${textPart}`;
    const parsed = JSON.parse(jsonText) as AiAdvice;
    if (!parsed.summary || !Array.isArray(parsed.recommendations)) return fallback;

    return { ...parsed, source: "ai" };
  } catch {
    return fallback;
  }
}
