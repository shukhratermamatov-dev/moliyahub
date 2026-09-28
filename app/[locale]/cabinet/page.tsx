import { redirect } from "next/navigation";
import { Shell } from "@/components/layout/shell";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { CabinetClient, type AnalysisRow, type ApplicationRow, type BusinessPlanRow, type ProjectRow } from "./cabinet-client";

type RawApplicationRow = {
  id: string;
  project_id: string;
  applicant_name: string;
  applicant_contact: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

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
    .select("id, name, description, region, amount, stage, is_public, hide_contacts, attached_score, created_at")
    .order("created_at", { ascending: false });

  // RLS (moliyahub_applications_select_owner) сама ограничивает выборку
  // заявками только на проекты текущего пользователя — доп. фильтр по
  // user_id тут не нужен, как и для projects/analyses/business_plans выше.
  const { data: rawApplications } = await supabase
    .from("project_applications")
    .select("id, project_id, applicant_name, applicant_contact, message, status, created_at")
    .order("created_at", { ascending: false });

  // Контакт заявителя маскируем уже здесь, на сервере — если проект просит
  // прятать контакты (hide_contacts) и заявка ещё не одобрена, клиент его
  // вообще не получает (а не просто "не показывает"). project.hide_contacts
  // отсутствует, если проекта уже нет в выборке (например, был удалён
  // параллельно) — тогда на всякий случай тоже прячем.
  const hideContactsByProject = new Map((projects ?? []).map((p) => [p.id, p.hide_contacts !== false]));
  const applications = ((rawApplications ?? []) as RawApplicationRow[]).map((a) => {
    const mustHide = hideContactsByProject.get(a.project_id) ?? true;
    const revealed = a.status === "approved" || !mustHide;
    return { ...a, applicant_contact: revealed ? a.applicant_contact : null };
  });

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

  // Имя для приветствия в кабинете — берём из user_metadata (заполняется при
  // регистрации, см. app/[locale]/login/actions.ts signUp()). Отдельную
  // колонку в profiles не читаем — в кодовой базе нет ни одного другого
  // места, которое обращалось бы к этой таблице, и рисковать нечитаемым
  // запросом к непроверенной схеме ради того же значения, что уже есть в
  // auth-метаданных, смысла нет.
  const fullName =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) ||
    (user.email ? user.email.split("@")[0] : "");

  return (
    <Shell>
      <CabinetClient
        email={user.email ?? ""}
        fullName={fullName}
        projects={(projects as ProjectRow[]) ?? []}
        applications={applications as ApplicationRow[]}
        analyses={(analyses as AnalysisRow[]) ?? []}
        businessPlans={(businessPlans as BusinessPlanRow[]) ?? []}
      />
    </Shell>
  );
}
