import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Список реально опубликованных проектов (is_public = true) из общей базы —
// для админ-панели, вкладка «Проекты». Сервисным ключом, в обход RLS: у
// админ-сессии нет обычной Supabase auth.uid(), поэтому projects_select_own
// для неё ничего не вернёт.
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, name, owner_name, industry_id, sub_industry_id, sub_industry_other, stage, amount, region, description, created_at",
    )
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "db_failed" }, { status: 500 });
  }

  return NextResponse.json({ projects: data ?? [] });
}
