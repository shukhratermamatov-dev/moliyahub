import { createClient } from "@/lib/supabase/server";
import { UpdatePasswordClient } from "./update-password-client";

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  // /auth/callback уже должен был установить recovery-сессию из ссылки
  // в письме. Если её нет (ссылка устарела, уже использована, или страницу
  // открыли напрямую без перехода по ссылке) — показываем понятное
  // сообщение вместо формы, которая всё равно не сработает.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <UpdatePasswordClient invalidLink={!!error || !user} />;
}
