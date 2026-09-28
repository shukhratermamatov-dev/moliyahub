import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Статус заявки инвестора + контакт автора (только после одобрения) — по
// id заявки, который инвестор получает один раз в момент отправки формы
// (см. app/[locale]/projects/actions.ts submitApplication) и хранит у себя
// в браузере (localStorage), чтобы потом вернуться и проверить статус, не
// заходя в аккаунт (у инвесторов на сайте аккаунтов нет). Сервисным ключом
// в обход RLS, но отдаём только status + контакт (и то не всегда) — сама
// заявка (имя/сообщение инвестора) наружу не уходит.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data: application } = await supabase
    .from("project_applications")
    .select("id, project_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!application) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let ownerContact: string | null = null;
  if (application.status === "approved") {
    const { data: project } = await supabase
      .from("projects")
      .select("owner_contact")
      .eq("id", application.project_id)
      .maybeSingle();
    ownerContact = (project?.owner_contact as string | null) ?? null;
  }

  return NextResponse.json({ status: application.status as string, ownerContact });
}
