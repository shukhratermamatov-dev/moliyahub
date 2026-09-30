// Диалог с Gemini с вызовом инструментов (function calling).
//
// Используется тот же ключ GEMINI_API_KEY и те же модели, что и в
// ИИ-анализе (lib/ai/gemini.ts): основная gemini-3.8-flash, запасная
// gemini-3.5-flash-lite при перегрузке Google (503/429).
//
// Важно для моделей Gemini 3: ответ модели с functionCall содержит
// thoughtSignature — такой ответ нужно вернуть в историю БЕЗ изменений,
// иначе следующий запрос отклоняется. Поэтому content кандидата кладём в
// историю целиком, как пришёл.

import type { Locale } from "@/i18n/config";
import { GEMINI_FALLBACK_MODEL, GEMINI_MODEL } from "@/lib/ai/gemini";
import { buildSystemPrompt } from "./prompt";
import { searchKnowledge } from "./knowledge";
import { TOOL_DECLARATIONS, runTool } from "./tools";

export type ChatMessage = { role: "user" | "assistant"; text: string };

type Part = {
  text?: string;
  thought?: boolean;
  functionCall?: { name: string; args?: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
  thoughtSignature?: string;
};
type Content = { role: "user" | "model"; parts: Part[] };

const MAX_TOOL_ROUNDS = 5;
const RETRYABLE = new Set([503, 429]);

type CallResult = { ok: true; content: Content; finishReason?: string } | { ok: false; status?: number; error: string };

async function callOnce(apiKey: string, model: string, system: string, contents: Content[]): Promise<CallResult> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents,
      systemInstruction: { role: "system", parts: [{ text: system }] },
      tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
      toolConfig: { functionCallingConfig: { mode: "AUTO" } },
      generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[assistant] ${model} http_${res.status}:`, body.slice(0, 500));
    return { ok: false, status: res.status, error: `http_${res.status}` };
  }

  const body = (await res.json()) as {
    candidates?: { content?: Content; finishReason?: string }[];
    promptFeedback?: { blockReason?: string };
  };
  if (body.promptFeedback?.blockReason) return { ok: false, error: `blocked_${body.promptFeedback.blockReason}` };
  const cand = body.candidates?.[0];
  if (!cand?.content?.parts?.length) return { ok: false, error: `empty_${cand?.finishReason ?? "response"}` };
  return { ok: true, content: { role: "model", parts: cand.content.parts }, finishReason: cand.finishReason };
}

// Повтор — только при 503 «перегружено»: это кратковременный сбой Google.
// При 429 (исчерпан лимит запросов бесплатного тарифа — 5 в минуту на
// модель) повтор той же модели лишь сжигает квоту, поэтому сразу уходим
// на запасную модель, у которой собственный лимит.
async function callWithRetry(apiKey: string, model: string, system: string, contents: Content[]): Promise<CallResult> {
  const first = await callOnce(apiKey, model, system, contents);
  if (first.ok || first.status !== 503) return first;
  await new Promise((r) => setTimeout(r, 1200));
  return callOnce(apiKey, model, system, contents);
}

export type ChatResult =
  | { ok: true; text: string; toolsUsed: string[]; model: string }
  | { ok: false; error: string };

type LoopResult =
  | { ok: true; text: string; toolsUsed: string[]; model: string }
  | { ok: false; error: string; status?: number };

// Один полный проход диалога (модель ↔ инструменты) на одной модели.
async function runLoop(params: {
  apiKey: string;
  model: string;
  system: string;
  history: ChatMessage[];
  locale: Locale;
}): Promise<LoopResult> {
  const contents: Content[] = params.history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.text }],
  }));
  const toolsUsed: string[] = [];

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const result = await callWithRetry(params.apiKey, params.model, params.system, contents);
    if (!result.ok) return result;

    const calls = result.content.parts.filter((p) => p.functionCall);
    if (calls.length === 0 || round === MAX_TOOL_ROUNDS) {
      const text = result.content.parts
        .filter((p) => p.text && !p.thought)
        .map((p) => p.text)
        .join("")
        .trim();
      if (!text) return { ok: false, error: "empty_text" };
      return { ok: true, text, toolsUsed, model: params.model };
    }

    contents.push(result.content);
    const responses = await Promise.all(
      calls.map(async (p) => {
        const name = p.functionCall!.name;
        toolsUsed.push(name);
        let response: Record<string, unknown>;
        try {
          response = await runTool(name, p.functionCall!.args ?? {}, { locale: params.locale });
        } catch (e) {
          console.error(`[assistant] tool ${name} failed:`, e);
          response = { error: "Инструмент временно недоступен." };
        }
        return { functionResponse: { name, response } } satisfies Part;
      }),
    );
    contents.push({ role: "user", parts: responses });
  }
  return { ok: false, error: "too_many_rounds" };
}

export async function runAssistantChat(params: {
  apiKey: string;
  locale: Locale;
  page?: string;
  history: ChatMessage[];
}): Promise<ChatResult> {
  const today = new Date().toLocaleDateString("ru-RU", { timeZone: "Asia/Tashkent" });
  // Материалы базы знаний по последнему вопросу подкладываем сразу в
  // промпт (RAG): на вопросы о сайте, исламском финансировании, советах и
  // т.п. модель отвечает за ОДИН запрос, без отдельного вызова
  // search_knowledge — вдвое экономнее по лимиту бесплатного тарифа.
  const lastQuestion = params.history[params.history.length - 1]?.text ?? "";
  const context = searchKnowledge(lastQuestion, params.locale, 4);
  const system = buildSystemPrompt({ locale: params.locale, page: params.page, today, context });

  try {
    // Если основная модель перегружена или упёрлась в лимит — весь проход
    // заново на запасной модели (частичную историю с подписями размышлений
    // одной модели другой передавать нельзя).
    const primary = await runLoop({ ...params, model: GEMINI_MODEL, system });
    if (primary.ok) return primary;
    if (!primary.status || !RETRYABLE.has(primary.status)) return { ok: false, error: primary.error };

    console.error(`[assistant] ${GEMINI_MODEL} ${primary.error}, falling back to ${GEMINI_FALLBACK_MODEL}`);
    const fallback = await runLoop({ ...params, model: GEMINI_FALLBACK_MODEL, system });
    return fallback.ok ? fallback : { ok: false, error: fallback.error };
  } catch (e) {
    console.error("[assistant] network error:", e);
    return { ok: false, error: "network_error" };
  }
}
