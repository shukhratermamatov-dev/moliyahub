import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Точка возврата из письма Supabase (подтверждение почты, восстановление
// пароля и т.п.): обменивает одноразовый `code` на сессию (PKCE-флоу) и
// устанавливает auth-куки, затем редиректит на `next` (уже с языковым
// префиксом — его передаёт вызывающая сторона, например форма восстановления
// пароля). Живёт вне /[locale], поэтому не должен получать языковой
// префикс — см. исключение в middleware.ts.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Ссылка недействительна, устарела или уже использована — отправляем на
  // ту же страницу с флагом ошибки, чтобы показать понятное сообщение
  // и предложить запросить новую ссылку, а не молча падать.
  const separator = next.includes("?") ? "&" : "?";
  return NextResponse.redirect(`${origin}${next}${separator}error=invalid_link`);
}
