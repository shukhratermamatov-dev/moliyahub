import { NewProjectPageClient } from "./new-project-page-client";
import { NewProjectLoginRequired } from "./new-project-login-required";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { findIndustry } from "@/lib/data/industries";
import { findRegion } from "@/lib/data/regions";
import { pickText } from "@/lib/i18n-text";

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

  // Подсказка для чекбокса "приложить скоринг" на форме публикации — берём
  // самый свежий сохранённый анализ пользователя. Реальное значение,
  // которое попадёт в projects.attached_score при публикации, всё равно
  // пересчитывается на сервере в createPublicProject (не доверяем тому, что
  // пришло с клиента) — здесь только для подсказки в интерфейсе.
  const { data: latestAnalysisRow } = await supabase
    .from("analyses")
    .select("companyName:company_name, industry, region, ratios, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const latestAnalysisScore =
    latestAnalysisRow && typeof latestAnalysisRow.ratios === "object" && latestAnalysisRow.ratios
      ? ((latestAnalysisRow.ratios as { score?: number }).score ?? null)
      : null;

  const latestAnalysis =
    latestAnalysisScore != null
      ? {
          score: latestAnalysisScore,
          label:
            (latestAnalysisRow!.companyName as string | null) ||
            (() => {
              const industryId = latestAnalysisRow!.industry as string | null;
              const regionId = latestAnalysisRow!.region as string | null;
              const industryLabel = industryId ? (findIndustry(industryId) ? pickText(findIndustry(industryId)!.name, locale) : industryId) : "";
              const regionLabel = regionId ? (findRegion(regionId) ? pickText(findRegion(regionId)!.name, locale) : regionId) : "";
              return [industryLabel, regionLabel].filter(Boolean).join(" · ");
            })(),
        }
      : null;

  return <NewProjectPageClient latestAnalysis={latestAnalysis} />;
}
