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

async function callWithRetry(apiKey: string, model: string, system: string, contents: Content[]): Promise<CallResult> {
  const first = await callOnce(apiKey, model, system, contents);
  if (first.ok || !first.status || !RETRYABLE.has(first.status)) return first;
  await new Promise((r) => setTimeout(r, 1200));
  return callOnce(apiKey, model, system, contents);
}

export type ChatResult =
  | { ok: true; text: string; toolsUsed: string[]; model: string }
  | { ok: false; error: string };

export async function runAssistantChat(params: {
  apiKey: string;
  locale: Locale;
  page?: string;
  history: ChatMessage[];
}): Promise<ChatResult> {
  const today = new Date().toLocaleDateString("ru-RU", { timeZone: "Asia/Tashkent" });
  const system = buildSystemPrompt({ locale: params.locale, page: params.page, today });

  const contents: Content[] = params.history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.text }],
  }));

  const toolsUsed: string[] = [];
  // Модель выбирается на первом запросе и дальше не меняется: подписи
  // размышлений одной модели другой модели не передаются.
  let model = GEMINI_MODEL;

  try {
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      let result = await callWithRetry(params.apiKey, model, system, contents);
      if (!result.ok && round === 0 && result.status && RETRYABLE.has(result.status)) {
        console.error(`[assistant] ${GEMINI_MODEL} overloaded, falling back to ${GEMINI_FALLBACK_MODEL}`);
        model = GEMINI_FALLBACK_MODEL;
        result = await callWithRetry(params.apiKey, model, system, contents);
      }
      if (!result.ok) return { ok: false, error: result.error };

      const calls = result.content.parts.filter((p) => p.functionCall);
      if (calls.length === 0 || round === MAX_TOOL_ROUNDS) {
        const text = result.content.parts
          .filter((p) => p.text && !p.thought)
          .map((p) => p.text)
          .join("")
          .trim();
        if (!text) return { ok: false, error: "empty_text" };
        return { ok: true, text, toolsUsed, model };
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
  } catch (e) {
    console.error("[assistant] network error:", e);
    return { ok: false, error: "network_error" };
  }
}
