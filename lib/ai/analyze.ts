"use server";

import { buildRuleAdvice } from "@/lib/finance/advice";
import { calculateRatios } from "@/lib/finance/ratios";
import { getDictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import type { AiAdvice, MinimalFinanceData } from "@/lib/finance/types";

type AnalyzeInput = {
  data: MinimalFinanceData;
  industry?: string;
  region?: string;
  locale: Locale;
};

const LANGUAGE_NAME: Record<Locale, string> = {
  ru: "русском",
  uz: "узбекском (латиница)",
  en: "английском",
};

export async function requestAiAdvice(payload: AnalyzeInput): Promise<AiAdvice> {
  // Словарь запрашиваем на сервере — Server Action получает от клиента только
  // сериализуемые данные (locale), а не сам объект словаря (в нём есть функции).
  const dict = await getDictionary(payload.locale);
  const ratios = calculateRatios(payload.data);
  const fallback = buildRuleAdvice(payload.data, ratios, dict, payload.locale);
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return fallback;

  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.3,
        max_tokens: 900,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Ты финансовый консультант по МСБ Узбекистана. Отвечай только JSON без markdown. Весь текст в ответе — на ${LANGUAGE_NAME[payload.locale] ?? "русском"} языке.`,
          },
          {
            role: "user",
            content: `Отрасль: ${payload.industry || "не указана"}
Регион: ${payload.region || "не указан"}
Балл: ${ratios.score}/100
Коэффициенты: ${JSON.stringify(ratios)}
Данные: ${JSON.stringify(payload.data)}

Верни JSON:
{"summary":"","score_comment":"","red_flags":[{"indicator":"","value":"","why_critical":"","priority":1}],"strengths":[""],"recommendations":[{"title":"","description":"","expected_effect":"","priority":1,"difficulty":"low","timeframe":""}],"financing_advice":""}`,
          },
        ],
      }),
    });
    if (!res.ok) return fallback;
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content;
    if (!text) return fallback;
    const parsed = JSON.parse(text) as AiAdvice;
    if (!parsed.summary || !Array.isArray(parsed.recommendations)) return fallback;
    return { ...parsed, source: "ai" };
  } catch {
    return fallback;
  }
}
