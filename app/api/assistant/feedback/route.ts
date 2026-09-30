import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Оценка ответа помощника (👍 / 👎) — записывается в assistant_logs.rating,
// чтобы администратор видел, на какие вопросы помощник отвечает плохо, и
// дополнял базу знаний (lib/assistant/custom-knowledge.ts).
export async function POST(request: Request) {
  try {
    const { id, rating } = (await request.json()) as { id?: unknown; rating?: unknown };
    if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id) || (rating !== 1 && rating !== -1)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const supabase = createServiceRoleClient();
    // Оценку можно поставить только один раз — повторные запросы не
    // перезаписывают её (rating is null).
    await supabase.from("assistant_logs").update({ rating }).eq("id", id).is("rating", null);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
