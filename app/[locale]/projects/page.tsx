import { ProjectsPageClient } from "./projects-page-client";
import { mapDbProjectRow, type DbProjectRow, type Project } from "@/lib/data/projects";
import { createClient } from "@/lib/supabase/server";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, name, owner_name, industry_id, sub_industry_id, stage, amount, region, description")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  const dbProjects: Project[] = ((data as DbProjectRow[]) ?? []).map(mapDbProjectRow);

  return <ProjectsPageClient dbProjects={dbProjects} />;
}
