// Общий тонкий клиент для Google Gemini API (используется lib/ai/analyze.ts
// и lib/ai/business-plan.ts). Переход с Anthropic на Gemini выбран
// пользователем как бесплатная альтернатива (сейчас — Gemini 3.8 Flash,
// бесплатный тариф Google AI Studio) — см.
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
// использует только заголовок).
//
// Модель gemini-2.5-flash (и другие модели линейки 2.5) с осени 2026
// недоступна новым ключам/пользователям — Gemini API отвечает 404
// "This model models/gemini-2.5-flash is no longer available to new
// users" и рекомендует models/gemini-3.8-flash. См.
// ai.google.dev/gemini-api/docs/deprecations. Именно эти две причины вместе
// (query-параметр вместо заголовка + устаревший ID модели) объясняют, почему
// после добавления реального ключа в Vercel ИИ-анализ всё равно тихо падал
// в локальный разбор по правилам — обе исправлены в этом файле.
//
// У бесплатного тарифа Gemini нет server-side веб-поиска с грaundingом (это
// платная функция) — в отличие от прежней интеграции с Anthropic, здесь
// модель работает только с тем, что передано в промпте (расчётные данные
// компании +, для бизнес-планов, выдержки из готовых образцов ТЭО сайта —
// см. lib/data/business-plan-samples.ts). generationConfig.responseMimeType
// "application/json" заставляет Gemini вернуть чистый JSON без markdown-
// обёртки, но extractJsonObject() всё равно есть как страховка.

export const GEMINI_MODEL = "gemini-3.8-flash";
// Запасная модель — тоже бесплатный тариф, но менее востребованная/более
// лёгкая, поэтому реже упирается в 503 "high demand" у основной модели.
// Используется только если основная модель дважды подряд отказала с
// перегрузкой — качество ответа чуть ниже, но живой ИИ-анализ лучше, чем
// молчаливый откат в локальный разбор по правилам.
export const GEMINI_FALLBACK_MODEL = "gemini-3.5-flash-lite";

// gemini-3.8-flash — популярная бесплатная модель, поэтому Google иногда
// отвечает 503 "This model is currently experiencing high demand" в часы
// пиковой нагрузки — это не ошибка кода и не проблема ключа, а временная
// перегрузка на стороне Google (подтверждено логами: несколько отдельных
// случаев 25.09.2026 и 28.09.2026, каждый раз с 503 "UNAVAILABLE"; 28.09
// в одном инциденте даже запасная модель gemini-3.5-flash-lite с первой
// попытки тоже словила 503 — то есть в пиковые моменты перегружены сразу
// обе модели). Поэтому повтор через ~1.2с применяется к КАЖДОЙ модели по
// отдельности (см. callWithRetry ниже): основная модель — попытка + при
// 503/429 повтор, и если оба раза не вышло — та же логика (попытка +
// повтор) на запасной модели, и только если и она дважды отказала —
// откат в локальный разбор по правилам. Итого до 4 обращений к Gemini на
// один клик "Получить ИИ-анализ" — заметно надёжнее, чем раньше (было
// максимум 3), ценой небольшой добавки к времени ответа в худшем случае.
const RETRYABLE_STATUSES = new Set([503, 429]);
const RETRY_DELAY_MS = 1200;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type GeminiCallResult = { ok: true; text: string } | { ok: false; error: string };

async function callGeminiOnce(params: {
  apiKey: string;
  system: string;
  user: string;
  maxOutputTokens?: number;
  temperature?: number;
  model?: string;
}): Promise<{ ok: true; text: string } | { ok: false; error: string; status?: number }> {
  const model = params.model ?? GEMINI_MODEL;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
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
    // ключ, не включён биллинг, превышена квота, временная перегрузка и
    // т.д.), но не секрет и не персональные данные пользователя сайта.
    const errorBody = await res.text().catch(() => "");
    console.error(`[gemini] http_${res.status}:`, errorBody.slice(0, 500));
    return { ok: false, error: `http_${res.status}`, status: res.status };
  }

  const body = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
    promptFeedback?: { blockReason?: string };
  };

  if (body.promptFeedback?.blockReason) return { ok: false, error: `blocked_${body.promptFeedback.blockReason}` };

  const text = (body.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
  if (!text) return { ok: false, error: "empty_response" };
  return { ok: true, text };
}

// Одна попытка + (если ответ 503/429) один повтор спустя RETRY_DELAY_MS —
// на КОНКРЕТНОЙ модели. Общий помощник, вызывается отдельно для основной и
// для запасной модели, чтобы у запасной был точно такой же шанс пережить
// кратковременную перегрузку, а не единственная попытка без повтора (см.
// комментарий у RETRY_DELAY_MS — инцидент 28.09.2026, когда с первой
// попытки отказала и она).
async function callWithRetry(
  params: { apiKey: string; system: string; user: string; maxOutputTokens?: number; temperature?: number },
  model: string,
): Promise<{ ok: true; text: string } | { ok: false; error: string; status?: number }> {
  const first = await callGeminiOnce({ ...params, model });
  if (first.ok) return first;
  if (!first.status || !RETRYABLE_STATUSES.has(first.status)) return first;

  await sleep(RETRY_DELAY_MS);
  console.error(`[gemini] retrying ${model} after ${first.error}`);
  return callGeminiOnce({ ...params, model });
}

export async function callGeminiJson(params: {
  apiKey: string;
  system: string;
  user: string;
  maxOutputTokens?: number;
  temperature?: number;
}): Promise<GeminiCallResult> {
  try {
    const primary = await callWithRetry(params, GEMINI_MODEL);
    if (primary.ok) return primary;
    if (!primary.status || !RETRYABLE_STATUSES.has(primary.status)) return primary;

    console.error(`[gemini] ${GEMINI_MODEL} overloaded twice, falling back to ${GEMINI_FALLBACK_MODEL}`);
    return await callWithRetry(params, GEMINI_FALLBACK_MODEL);
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
