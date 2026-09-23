import { redirect } from "next/navigation";
import { Shell } from "@/components/layout/shell";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { CabinetClient, type AnalysisRow, type ApplicationRow, type BusinessPlanRow, type ProjectRow } from "./cabinet-client";

export default async function CabinetPage({
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

  // Middleware уже отсекает неаутентифицированных на этот маршрут, но
  // дублируем проверку и здесь — на случай прямого рендера/edge-кейсов.
  if (!user) {
    redirect(`/${locale}/login`);
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, description, region, amount, stage, is_public, created_at")
    .order("created_at", { ascending: false });

  // RLS (moliyahub_applications_select_owner) сама ограничивает выборку
  // заявками только на проекты текущего пользователя — доп. фильтр по
  // user_id тут не нужен, как и для projects/analyses/business_plans выше.
  const { data: applications } = await supabase
    .from("project_applications")
    .select("id, project_id, applicant_name, applicant_contact, message, created_at")
    .order("created_at", { ascending: false });

  const { data: analyses } = await supabase
    .from("analyses")
    .select("id, companyName:company_name, industry, region, data, ratios, advice, periods, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  const { data: businessPlans } = await supabase
    .from("business_plans")
    .select("id, industry_id, sub_industry_id, project_name, idea, data, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <Shell>
      <CabinetClient
        email={user.email ?? ""}
        projects={(projects as ProjectRow[]) ?? []}
        applications={(applications as ApplicationRow[]) ?? []}
        analyses={(analyses as AnalysisRow[]) ?? []}
        businessPlans={(businessPlans as BusinessPlanRow[]) ?? []}
      />
    </Shell>
  );
}
