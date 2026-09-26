import { ProjectDetailClient } from "./project-detail-client";
import { mapDbProjectRow, SEED_PROJECTS, type DbProjectRow, type Project } from "@/lib/data/projects";
import { createClient } from "@/lib/supabase/server";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // SEED_PROJECTS и локальные (zustand) проекты разрешаются на клиенте в
  // ProjectDetailClient — сюда достаточно попытаться найти проект в
  // Supabase, только если это не один из статичных демо-id (не тратим
  // запрос к БД зря на каждый переход по каталогу).
  let dbProject: Project | null = null;
  if (!SEED_PROJECTS.some((p) => p.id === id)) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("projects")
      .select("id, name, owner_name, industry_id, sub_industry_id, sub_industry_other, stage, amount, region, description")
      .eq("id", id)
      .eq("is_public", true)
      .maybeSingle();
    if (data) {
      dbProject = mapDbProjectRow(data as DbProjectRow);
    }
  }

  return <ProjectDetailClient id={id} dbProject={dbProject} />;
}
