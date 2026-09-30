"use server";

import { createClient } from "@/lib/supabase/server";
import { OTHER_SUB_INDUSTRY_ID } from "@/lib/data/industries";

const STAGES = ["IDEA", "MVP", "GROWTH", "SCALE"] as const;

export type CreatePublicProjectState =
  | { error: string }
  | { success: true; id: string; isPublic: boolean }
  | undefined;

// Публикация проекта на "Бирже проектов" — в отличие от приватного проекта
// в личном кабинете (app/[locale]/cabinet/actions.ts addProject), здесь
// проект сразу пишется с is_public = true и попадает в общий каталог
// /projects, оставаясь при этом обычной строкой в таблице projects — поэтому
// он одновременно виден и в "Мои проекты" в кабинете автора.
export async function createPublicProject(
  locale: string,
  _prevState: CreatePublicProjectState,
  formData: FormData,
): Promise<CreatePublicProjectState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "not_authenticated" };
  }

  const title = String(formData.get("title") || "").trim();
  const ownerName = String(formData.get("owner") || "").trim();
  const ownerContact = String(formData.get("ownerContact") || "").trim();
  const industryId = String(formData.get("industryId") || "").trim();
  const subIndustryId = String(formData.get("subIndustryId") || "").trim();
  const subIndustryOther = String(formData.get("subIndustryOther") || "").trim();
  const stageRaw = String(formData.get("stage") || "IDEA");
  const stage = (STAGES as readonly string[]).includes(stageRaw) ? stageRaw : "IDEA";
  const amountRaw = String(formData.get("amount") || "").trim();
  const amount = amountRaw ? Number(amountRaw) : null;
  const region = String(formData.get("region") || "").trim();
  const description = String(formData.get("description") || "").trim();
  // "Опубликовать для всех" vs "Сохранить черновик" — один и тот же экшен,
  // разница только в is_public (кнопки различаются name="intent").
  const isPublic = String(formData.get("intent") || "publish") !== "draft";
  const hideContacts = formData.get("hideContacts") === "on";
  const attachScore = formData.get("attachScore") === "on";

  if (!title || !ownerName || !ownerContact || !description) {
    return { error: "fill_required" };
  }
  if (subIndustryId === OTHER_SUB_INDUSTRY_ID && !subIndustryOther) {
    return { error: "fill_required" };
  }

  // Балл скоринга берём сами на сервере из самого свежего сохранённого
  // анализа автора — не доверяем значению, которое мог бы прислать клиент
  // (это публично видимая цифра на карточке проекта).
  let attachedScore: number | null = null;
  if (attachScore) {
    const { data: latestAnalysisRow } = await supabase
      .from("analyses")
      .select("ratios")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const ratios = latestAnalysisRow?.ratios as { score?: number } | null | undefined;
    attachedScore = typeof ratios?.score === "number" ? ratios.score : null;
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name: title,
      owner_name: ownerName,
      owner_contact: ownerContact,
      description: description || null,
      region: region || null,
      amount,
      stage,
      industry_id: industryId || null,
      sub_industry_id: subIndustryId || null,
      sub_industry_other: subIndustryId === OTHER_SUB_INDUSTRY_ID ? subIndustryOther : null,
      is_public: isPublic,
      hide_contacts: hideContacts,
      attached_score: attachedScore,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[createPublicProject] supabase insert error:", error);
    return { error: "generic_error" };
  }

  return { success: true, id: data.id as string, isPublic };
}

export type SubmitApplicationState =
  | { error: string }
  | { success: true; id: string }
  | undefined;

// Заявка инвестора на публичный проект — контакт нужен, чтобы владелец
// проекта мог связаться с инвестором (видно только владельцу в кабинете,
// RLS: policy moliyahub_applications_select_owner).
export async function submitApplication(
  projectId: string,
  _prevState: SubmitApplicationState,
  formData: FormData,
): Promise<SubmitApplicationState> {
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  const contact = String(formData.get("contact") || "").trim();
  const message = String(formData.get("message") || "").trim();

  if (!name || !contact) {
    return { error: "fill_required" };
  }

  const { data, error } = await supabase
    .from("project_applications")
    .insert({
      project_id: projectId,
      applicant_name: name,
      applicant_contact: contact,
      message: message || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[submitApplication] supabase insert error:", error, "projectId:", projectId);
    // TEMP DIAGNOSTIC: surface the real Postgres/PostgREST error AND the
    // projectId we actually tried to insert with, to rule out a wrong id
    // being sent. Revert to "generic_error" once diagnosed.
    return {
      error: error
        ? `diag:pid=${projectId}:${error.code ?? "?"}:${error.message ?? "?"}`
        : "generic_error",
    };
  }

  return { success: true, id: data.id as string };
}
