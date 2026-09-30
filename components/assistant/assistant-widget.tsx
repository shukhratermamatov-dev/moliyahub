"use client";

import { Bot, RotateCcw, Send, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import { AssistantMarkdown } from "./assistant-markdown";

type Msg = {
  role: "user" | "assistant";
  text: string;
  /** id записи в журнале (assistant_logs) — для оценки 👍/👎 */
  id?: string | null;
  rating?: 1 | -1;
  /** служебное сообщение (ошибка/лимит) — не отправляется в модель */
  local?: boolean;
};

const STORAGE_KEY = "moliyahub-assistant-v1";

function loadHistory(): Msg[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Msg[]) : [];
    return Array.isArray(parsed) ? parsed.slice(-40) : [];
  } catch {
    return [];
  }
}

function saveHistory(msgs: Msg[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-40)));
  } catch {
    // приватный режим / хранилище недоступно — диалог просто не переживёт перезагрузку
  }
}

export function AssistantWidget() {
  const { locale, dict } = useI18n();
  const t = dict.assistant;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // История из sessionStorage подгружается при первом открытии окна (а не
  // при монтировании) — так на сервере и при первом рендере разметка
  // одинаковая, а сохранение не затирает историю пустым списком.
  const loadedRef = useRef(false);

  function openPanel() {
    if (!loadedRef.current) {
      loadedRef.current = true;
      setMessages(loadHistory());
    }
    setOpen(true);
  }

  useEffect(() => {
    if (!loadedRef.current) return;
    saveHistory(messages);
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || loading) return;
    const next: Msg[] = [...messages, { role: "user", text: question }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          locale,
          page: pathname,
          messages: next.filter((m) => !m.local).map(({ role, text }) => ({ role, text })),
        }),
      });
      const data = (await res.json()) as { reply?: string; id?: string | null; error?: string };
      if (!data.reply) throw new Error(data.error ?? "no_reply");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.reply!, id: data.id ?? null, local: Boolean(data.error) },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: t.error, local: true }]);
    } finally {
      setLoading(false);
    }
  }

  async function rate(index: number, rating: 1 | -1) {
    const msg = messages[index];
    if (!msg?.id || msg.rating) return;
    setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, rating } : m)));
    try {
      await fetch("/api/assistant/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: msg.id, rating }),
      });
    } catch {
      // оценка не критична
    }
  }

  const empty = messages.length === 0;

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={openPanel}
          aria-label={t.openLabel}
          className="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-fg shadow-[0_10px_40px_rgba(34,192,138,0.35)] transition hover:brightness-110 sm:right-6 sm:bottom-6"
        >
          <Bot className="size-5" aria-hidden />
          <span className="hidden sm:inline">{t.buttonLabel}</span>
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label={t.title}
          className="fixed inset-0 z-50 flex flex-col bg-surface sm:inset-auto sm:right-6 sm:bottom-6 sm:h-[min(640px,calc(100dvh-3rem))] sm:w-[400px] sm:rounded-2xl sm:border sm:border-line sm:shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
        >
          <header className="flex items-start gap-3 border-b border-line px-4 py-3">
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-fg">
              <Bot className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-display text-sm">{t.title}</div>
              <div className="truncate text-xs text-muted">{t.subtitle}</div>
            </div>
            {!empty && (
              <button
                type="button"
                onClick={() => setMessages([])}
                aria-label={t.newChat}
                title={t.newChat}
                className="grid size-8 place-items-center rounded-lg text-muted hover:bg-raised hover:text-fg"
              >
                <RotateCcw className="size-4" aria-hidden />
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t.closeLabel}
              className="grid size-8 place-items-center rounded-lg text-muted hover:bg-raised hover:text-fg"
            >
              <X className="size-4" aria-hidden />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm" aria-live="polite">
            <div className="rounded-2xl rounded-tl-sm bg-raised px-3.5 py-2.5 text-fg/90">{t.greeting}</div>

            {empty && (
              <div className="flex flex-col gap-2 pt-1">
                {t.suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-xl border border-line px-3 py-2 text-left text-xs text-muted transition hover:border-primary/60 hover:text-fg"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary/15 px-3.5 py-2.5 whitespace-pre-wrap text-fg">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={i} className="flex flex-col items-start gap-1">
                  <div className={cn("max-w-[92%] rounded-2xl rounded-tl-sm bg-raised px-3.5 py-2.5 text-fg/90", m.local && "text-muted")}>
                    <AssistantMarkdown text={m.text} />
                  </div>
                  {m.id && (
                    <div className="flex items-center gap-1 pl-1 text-muted">
                      {m.rating ? (
                        <span className="text-xs">{t.thanks}</span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => rate(i, 1)}
                            aria-label={t.helpful}
                            title={t.helpful}
                            className="grid size-7 place-items-center rounded-md hover:bg-raised hover:text-ok"
                          >
                            <ThumbsUp className="size-3.5" aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => rate(i, -1)}
                            aria-label={t.notHelpful}
                            title={t.notHelpful}
                            className="grid size-7 place-items-center rounded-md hover:bg-raised hover:text-danger"
                          >
                            <ThumbsDown className="size-3.5" aria-hidden />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ),
            )}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="flex gap-1" aria-hidden>
                  <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-primary" />
                </span>
                {t.thinking}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t border-line p-3"
          >
            <div className="flex items-end gap-2 rounded-xl border border-line bg-inset px-3 py-2 focus-within:border-primary/60">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={1}
                maxLength={2000}
                placeholder={t.placeholder}
                className="max-h-32 min-h-6 flex-1 resize-none bg-transparent text-sm text-fg placeholder:text-muted focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                aria-label={t.send}
                className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-fg transition hover:brightness-110 disabled:opacity-40"
              >
                <Send className="size-4" aria-hidden />
              </button>
            </div>
            <p className="mt-2 text-[11px] leading-snug text-muted">{t.disclaimer}</p>
          </form>
        </div>
      )}
    </>
  );
}
