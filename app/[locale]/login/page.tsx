import { LoginPageClient } from "./login-page-client";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; mode?: string }>;
}) {
  const { next, mode } = await searchParams;
  // Шапка сайта ведёт на /login?mode=register для кнопки «Регистрация» —
  // открываем вкладку регистрации сразу, минуя вкладку входа по умолчанию.
  const initialMode = mode === "register" ? "register" : "login";
  return <LoginPageClient next={next} initialMode={initialMode} />;
}
