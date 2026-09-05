"use server";

import { createClient } from "@/lib/supabase/server";
import type { AiAdvice, FinancialRatios } from "@/lib/finance/types";
import type { FinanceData } from "@/lib/finance/types";

export type SaveAnalysisResult =
  | { ok: true }
  | { ok: false; error: "not_authenticated" | "generic_error" };

// Сохраняет анализ в Supabase (таблица analyses, RLS: только свои строки).
// Вызывается только для залогиненных пользователей — гостям функция
// возвращает not_authenticated, и клиент ничего никуда не пишет.
export async function saveAnalysisAction(payload: {
  industry: string;
  region: string;
  data: FinanceData;
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
    industry: payload.industry,
    region: payload.region,
    data: payload.data,
    ratios: payload.ratios,
    advice: payload.advice,
  });

  if (error) {
    return { ok: false, error: "generic_error" };
  }

  return { ok: true };
}
