"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProjectFormState = { error: string } | undefined;

export async function addProject(
  locale: string,
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "not_authenticated" };
  }

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const region = String(formData.get("region") || "").trim();
  const amountRaw = String(formData.get("amount") || "").trim();
  const amount = amountRaw ? Number(amountRaw) : null;

  if (!name) {
    return { error: "name_required" };
  }

  const { error } = await supabase.from("projects").insert({
    user_id: user.id,
    name,
    description: description || null,
    region: region || null,
    amount,
  });

  if (error) {
    return { error: "generic_error" };
  }

  revalidatePath(`/${locale}/cabinet`);
  return undefined;
}

export async function deleteProject(locale: string, id: string, _formData: FormData) {
  const supabase = await createClient();
  await supabase.from("projects").delete().eq("id", id);
  revalidatePath(`/${locale}/cabinet`);
}
