import { NextResponse } from "next/server";
import { isLocale, type Locale } from "@/i18n/config";
import { runAssistantChat, type ChatMessage } from "@/lib/assistant/chat";
import { createServiceRoleClient } from "@/lib/supabase/server";

// ИИ-помощник MoliyaHub. Принимает историю диалога (только текст, хранится
// в браузере посетителя) и возвращает ответ модели. Ключ Gemini живёт
// только на сервере.
export const maxDuration = 60;

const MAX_MESSAGES = 12; // последние сообщения диалога, что уходят в модель
const MAX_CHARS = 2000; // длина одного сообщения
const RATE_LIMIT = 20; // запросов
const RATE_WINDOW_MS = 10 * 60 * 1000; // за 10 минут с одного IP

// Ограничение частоты в памяти экземпляра функции. На Vercel экземпляров
// может быть несколько, так что это «мягкая» защита от случайного спама и
// перерасхода бесплатной квоты Gemini, а не строгий лимит.
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_LIMIT;
}

const FALLBACK_TEXT: Record<Locale, { noKey: string; busy: string; limit: string }> = {
  ru: {
    noKey: "Помощник пока не подключён. Напишите нам: info@moliyahub.uz или +998 90 930 03 30.",
    busy: "Сервис ИИ сейчас перегружен. Попробуйте ещё раз через минуту — или напишите нам: info@moliyahub.uz.",
    limit: "Слишком много вопросов подряд. Сделайте небольшую паузу и попробуйте снова через несколько минут.",
  },
  uz: {
    noKey: "Yordamchi hali ulanmagan. Bizga yozing: info@moliyahub.uz yoki +998 90 930 03 30.",
    busy: "AI xizmati hozir band. Bir daqiqadan so'ng qayta urinib ko'ring yoki bizga yozing: info@moliyahub.uz.",
    limit: "Juda ko'p savol ketma-ket yuborildi. Bir necha daqiqadan so'ng qayta urinib ko'ring.",
  },
  en: {
    noKey: "The assistant is not connected yet. Contact us: info@moliyahub.uz or +998 90 930 03 30.",
    busy: "The AI service is busy right now. Please try again in a minute or email us: info@moliyahub.uz.",
    limit: "Too many questions in a row. Please wait a few minutes and try again.",
  },
};

function sanitizeHistory(raw: unknown): ChatMessage[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const msgs: ChatMessage[] = [];
  for (const m of raw.slice(-MAX_MESSAGES)) {
    if (!m || typeof m !== "object") return null;
    const role = (m as { role?: unknown }).role;
    const text = (m as { text?: unknown }).text;
    if ((role !== "user" && role !== "assistant") || typeof text !== "string" || !text.trim()) return null;
    msgs.push({ role, text: text.slice(0, MAX_CHARS) });
  }
  // Диалог для модели должен начинаться с пользователя и им же заканчиваться.
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return null;
  return msgs;
}

async function logExchange(row: {
  locale: Locale;
  page: string | null;
  question: string;
  answer: string;
  tools: string[];
  model: string;
}): Promise<string | null> {
  // Журнал вопросов/ответов для контроля качества (таблица assistant_logs,
  // см. docs/sql/assistant.sql). Если таблицы нет — просто не пишем.
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("assistant_logs")
      .insert({
        locale: row.locale,
        page: row.page,
        question: row.question,
        answer: row.answer,
        tools: row.tools,
        model: row.model,
      })
      .select("id")
      .single();
    if (error) return null;
    return (data?.id as string) ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let body: { messages?: unknown; locale?: unknown; page?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const locale: Locale = typeof body.locale === "string" && isLocale(body.locale) ? body.locale : "ru";
  const page = typeof body.page === "string" ? body.page.slice(0, 200) : null;
  const history = sanitizeHistory(body.messages);
  if (!history) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ reply: FALLBACK_TEXT[locale].limit, error: "rate_limited" }, { status: 429 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ reply: FALLBACK_TEXT[locale].noKey, error: "no_key" });
  }

  const result = await runAssistantChat({ apiKey, locale, page: page ?? undefined, history });
  if (!result.ok) {
    console.error("[assistant] failed:", result.error);
    return NextResponse.json({ reply: FALLBACK_TEXT[locale].busy, error: result.error });
  }

  const id = await logExchange({
    locale,
    page,
    question: history[history.length - 1].text,
    answer: result.text,
    tools: result.toolsUsed,
    model: result.model,
  });

  return NextResponse.json({ reply: result.text, id });
}
