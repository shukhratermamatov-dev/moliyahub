"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState =
  | { status: "error"; code: "invalid_credentials" | "email_in_use" | "weak_password" | "generic_error" }
  | { status: "check_email" }
  | undefined;

export type ResetActionState = { status: "sent" } | undefined;

// Абсолютный origin текущего запроса — нужен для redirectTo в письме
// восстановления пароля (ссылка должна вести обратно на тот же хост,
// с которого пришёл запрос: прод, превью-деплой и т.д.).
async function getOrigin() {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "https://www.moliyahub.uz";
}

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const locale = String(formData.get("locale") || "ru");
  const next = String(formData.get("next") || "") || `/${locale}/cabinet`;

  if (!email || !password) {
    return { status: "error", code: "generic_error" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { status: "error", code: "invalid_credentials" };
  }

  redirect(next);
}

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("fullName") || "").trim();
  const locale = String(formData.get("locale") || "ru");

  if (!email || !password) {
    return { status: "error", code: "generic_error" };
  }
  if (password.length < 6) {
    return { status: "error", code: "weak_password" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName || null } },
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("already registered") || message.includes("already exists")) {
      return { status: "error", code: "email_in_use" };
    }
    return { status: "error", code: "generic_error" };
  }

  // Если в проекте включено подтверждение почты — сессии ещё нет.
  if (data.user && !data.session) {
    return { status: "check_email" };
  }

  redirect(`/${locale}/cabinet`);
}

export async function signOut(locale: string) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale}`);
}

export async function requestPasswordReset(
  _prevState: ResetActionState,
  formData: FormData,
): Promise<ResetActionState> {
  const email = String(formData.get("email") || "").trim();
  const locale = String(formData.get("locale") || "ru");

  if (email) {
    const supabase = await createClient();
    const origin = await getOrigin();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/${locale}/update-password`,
    });
  }

  // Не сообщаем, существует ли такой email в базе — это защита от перебора
  // адресов, поэтому статус всегда "sent", даже если письмо отправить некому.
  return { status: "sent" };
}
