// Общий тонкий клиент для Google Gemini API (используется lib/ai/analyze.ts
// и lib/ai/business-plan.ts). Переход с Anthropic на Gemini выбран
// пользователем как бесплатная альтернатива (Gemini 2.5 Flash, бесплатный
// тариф Google AI Studio: 1500 запросов/день, 1M TPM) — см.
// claude/analiz-kabinet-bp-bagi-status.md. Ключ GEMINI_API_KEY пользователь
// получает на aistudio.google.com и добавляет в переменные окружения Vercel.
//
// Ключ передаётся заголовком x-goog-api-key, НЕ query-параметром ?key=.
// Осенью 2026 Google перевела новые ключи Gemini API на формат "AQ." (вместо
// старого "AIzaSy...") и одновременно перестала принимать сам способ передачи
// ключа через ?key= в URL — такие запросы падают с 401
// ACCESS_TOKEN_TYPE_UNSUPPORTED независимо от того, какой именно ключ
// подставлен (подтверждено багрепортами по этой же проблеме в других
// проектах: github.com/morpheus65535/bazarr/issues/3590,
// github.com/lingarr-translate/lingarr/issues/532; официальный REST-пример
// в текущей документации ai.google.dev/gemini-api/docs/api-key тоже
// использует только заголовок). Это и было причиной того, что после
// добавления реального ключа в Vercel ИИ-анализ всё равно тихо падал в
// локальный разбор по правилам.
//
// У бесплатного тарифа Gemini нет server-side веб-поиска с грaundingом (это
// платная функция) — в отличие от прежней интеграции с Anthropic, здесь
// модель работает только с тем, что передано в промпте (расчётные данные
// компании +, для бизнес-планов, выдержки из готовых образцов ТЭО сайта —
// см. lib/data/business-plan-samples.ts). generationConfig.responseMimeType
// "application/json" заставляет Gemini вернуть чистый JSON без markdown-
// обёртки, но extractJsonObject() всё равно есть как страховка.

const GEMINI_MODEL = "gemini-2.5-flash";

export type GeminiCallResult = { ok: true; text: string } | { ok: false; error: string };

export async function callGeminiJson(params: {
  apiKey: string;
  system: string;
  user: string;
  maxOutputTokens?: number;
  temperature?: number;
}): Promise<GeminiCallResult> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": params.apiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: params.user }] }],
          systemInstruction: { role: "system", parts: [{ text: params.system }] },
          generationConfig: {
            responseMimeType: "application/json",
            temperature: params.temperature ?? 0.4,
            maxOutputTokens: params.maxOutputTokens ?? 4000,
          },
        }),
      },
    );

    if (!res.ok) {
      // Логируем тело ответа Google в серверный лог (Vercel Functions), не в
      // UI — там может быть полезная причина отказа (неверный/просроченный
      // ключ, не включён биллинг, превышена квота и т.д.), но не секрет и не
      // персональные данные пользователя сайта.
      const errorBody = await res.text().catch(() => "");
      console.error(`[gemini] http_${res.status}:`, errorBody.slice(0, 500));
      return { ok: false, error: `http_${res.status}` };
    }

    const body = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
      promptFeedback?: { blockReason?: string };
    };

    if (body.promptFeedback?.blockReason) return { ok: false, error: `blocked_${body.promptFeedback.blockReason}` };

    const text = (body.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
    if (!text) return { ok: false, error: "empty_response" };
    return { ok: true, text };
  } catch {
    return { ok: false, error: "network_error" };
  }
}

// Извлекает JSON-объект из текстового ответа модели — страховка на случай,
// если ответ всё же обёрнут в ```json fences вопреки responseMimeType.
export function extractJsonObject(text: string): unknown | null {
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
