"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, computeAdminToken } from "@/lib/admin-auth";

export type LoginState = { error: string } | undefined;

export async function adminLogin(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") || "");
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    return {
      error:
        "Пароль администратора не настроен. Добавьте переменную окружения ADMIN_PASSWORD (в Vercel: Settings → Environment Variables) и переразверните проект.",
    };
  }

  if (password !== expected) {
    return { error: "Неверный пароль" };
  }

  const token = await computeAdminToken(expected);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/admin");
}
