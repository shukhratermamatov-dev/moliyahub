"use server";

import { createClient } from "@/lib/supabase/server";

const STAGES = ["IDEA", "MVP", "GROWTH", "SCALE"] as const;

export type CreatePublicProjectState =
  | { error: string }
  | { success: true; id: string }
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
  const industryId = String(formData.get("industryId") || "").trim();
  const subIndustryId = String(formData.get("subIndustryId") || "").trim();
  const stageRaw = String(formData.get("stage") || "IDEA");
  const stage = (STAGES as readonly string[]).includes(stageRaw) ? stageRaw : "IDEA";
  const amountRaw = String(formData.get("amount") || "").trim();
  const amount = amountRaw ? Number(amountRaw) : null;
  const region = String(formData.get("region") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!title || !ownerName || !description) {
    return { error: "fill_required" };
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name: title,
      owner_name: ownerName,
      description: description || null,
      region: region || null,
      amount,
      stage,
      industry_id: industryId || null,
      sub_industry_id: subIndustryId || null,
      is_public: true,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[createPublicProject] supabase insert error:", error);
    return { error: "generic_error" };
  }

  return { success: true, id: data.id as string };
}

export type SubmitApplicationState =
  | { error: string }
  | { success: true }
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

  const { error } = await supabase.from("project_applications").insert({
    project_id: projectId,
    applicant_name: name,
    applicant_contact: contact,
    message: message || null,
  });

  if (error) {
    console.error("[submitApplication] supabase insert error:", error);
    return { error: "generic_error" };
  }

  return { success: true };
}
