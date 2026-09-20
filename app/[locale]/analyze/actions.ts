"use server";

import { createClient } from "@/lib/supabase/server";
import type { AiAdvice, FinancePeriod, FinancialRatios } from "@/lib/finance/types";

export type SaveAnalysisResult =
  | { ok: true }
  | { ok: false; error: "not_authenticated" | "generic_error" };

// Сохраняет анализ в Supabase (таблица analyses, RLS: только свои строки).
// Вызывается только для залогиненных пользователей — гостям функция
// возвращает not_authenticated, и клиент ничего никуда не пишет.
//
// data/ratios/advice (существующие колонки) продолжают хранить период 1, как
// и раньше, — их не переименовываем, чтобы не сломать существующую фичу
// кабинета «сравнить 2 сохранённых анализа» (она читает именно data/ratios
// каждой строки). Новая колонка periods хранит весь массив периодов (1 или 2)
// для новой внутри-анализа фичи 2 периодов и дашборда отклонений.
export async function saveAnalysisAction(payload: {
  companyName: string;
  industry: string;
  region: string;
  periods: FinancePeriod[];
  ratios: FinancialRatios;
  advice: AiAdvice | null;
}): Promise<SaveAnalysisResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "not_authenticated" };
  }

  const { error } = await supabase.from("analyses").insert({
    user_id: user.id,
    company_name: payload.companyName || null,
    industry: payload.industry,
    region: payload.region,
    data: payload.periods[0]?.data ?? null,
    ratios: payload.ratios,
    advice: payload.advice,
    periods: payload.periods,
  });

  if (error) {
    // Логируем реальную ошибку Supabase в серверный лог (Vercel → Logs) —
    // без этого причина падения (например, отсутствующая колонка из-за не
    // выполненного SQL-патча) была не видна вообще нигде.
    console.error("[saveAnalysisAction] supabase insert error:", error);
    return { ok: false, error: "generic_error" };
  }

  return { ok: true };
}
