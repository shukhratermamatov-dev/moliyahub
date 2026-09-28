import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Публичный эндпоинт агрегированных счётчиков для "полосы доверия" на
// главной ("N компаний прошли анализ" и т.п. — см. ТЗ на редизайн,
// раздел «Живые данные»). Отдаём только количества, без содержимого строк:
// сервисный ключ нужен, чтобы посчитать analyses — таблица закрыта RLS
// политикой "только свои строки" (analyses_select_own), у анонимного
// клиента count всегда будет 0.
export const revalidate = 3600;

export type SiteStatsDto = {
  analysesCount: number;
  publicProjectsCount: number;
};

export async function GET() {
  const supabase = createServiceRoleClient();

  const [analyses, projects] = await Promise.all([
    supabase.from("analyses").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("is_public", true),
  ]);

  const dto: SiteStatsDto = {
    analysesCount: analyses.count ?? 0,
    publicProjectsCount: projects.count ?? 0,
  };

  return NextResponse.json(dto, {
    headers: {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=600",
    },
  });
}
