import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Удаляет опубликованный проект целиком из общей базы (в отличие от старого
// блока "Опубликованные пользователями" на клиенте — тот был заглушкой на
// localStorage браузера админа, а не реальными данными сайта).
//
// Сервисным ключом, в обход RLS: у админ-панели своя, отдельная от Supabase
// Auth авторизация по паролю (см. lib/admin-auth.ts) — obычная projects_delete_own
// (user_id = auth.uid()) для неё не выполнится, потому что auth.uid() для
// этой сессии не существует вовсе.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();

  // Сначала заявки инвесторов на этот проект — если у project_applications
  // есть внешний ключ на projects без ON DELETE CASCADE, удаление проекта
  // с существующими заявками иначе молча/с ошибкой не пройдёт.
  await supabase.from("project_applications").delete().eq("project_id", id);

  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "db_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
