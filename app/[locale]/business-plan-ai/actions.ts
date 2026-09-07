"use server";

import { createClient } from "@/lib/supabase/server";
import type { BusinessPlan } from "@/lib/business-plan/types";

export type SaveBusinessPlanResult =
  | { ok: true }
  | { ok: false; error: "not_authenticated" | "generic_error" };

// Сохраняет сгенерированный ИИ бизнес-план в Supabase (таблица business_plans,
// RLS: только свои строки) — по аналогии с saveAnalysisAction для анализов.
// Вызывается только для залогиненных пользователей; гостям функция возвращает
// not_authenticated, и клиент ничего никуда не пишет (см. business-plan-ai
// guest-flow: результат живёт только в React-состоянии до экспорта).
export async function saveBusinessPlanAction(payload: {
  industryId: string;
  subIndustryId?: string;
  projectName: string;
  idea: string;
  plan: BusinessPlan;
}): Promise<SaveBusinessPlanResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "not_authenticated" };
  }

  const { error } = await supabase.from("business_plans").insert({
    user_id: user.id,
    industry_id: payload.industryId,
    sub_industry_id: payload.subIndustryId || null,
    project_name: payload.projectName,
    idea: payload.idea,
    data: payload.plan,
  });

  if (error) {
    return { ok: false, error: "generic_error" };
  }

  return { ok: true };
}
