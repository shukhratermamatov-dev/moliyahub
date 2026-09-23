import { NewProjectPageClient } from "./new-project-page-client";
import { NewProjectLoginRequired } from "./new-project-login-required";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

export default async function NewProjectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : defaultLocale;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Проект на "Бирже проектов" должен иметь реального владельца с аккаунтом —
  // иначе заявки инвесторов некому будет показать в личном кабинете (см.
  // app/[locale]/projects/actions.ts createPublicProject). Поэтому публикация
  // теперь требует входа, в отличие от прежнего анонимного локального
  // (zustand) черновика.
  if (!user) {
    return <NewProjectLoginRequired locale={locale} />;
  }

  return <NewProjectPageClient />;
}
