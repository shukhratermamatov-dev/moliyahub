"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type UpdatePasswordActionState =
  | { status: "error"; code: "weak_password" | "generic_error" }
  | undefined;

export async function updatePassword(
  _prevState: UpdatePasswordActionState,
  formData: FormData,
): Promise<UpdatePasswordActionState> {
  const password = String(formData.get("password") || "");
  const locale = String(formData.get("locale") || "ru");

  if (password.length < 6) {
    return { status: "error", code: "weak_password" };
  }

  const supabase = await createClient();
  // К этому моменту в куках уже должна быть recovery-сессия — её установил
  // /auth/callback после обмена кода из письма. Если сессии нет, updateUser
  // вернёт ошибку, и мы покажем общее сообщение.
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { status: "error", code: "generic_error" };
  }

  redirect(`/${locale}/cabinet`);
}
