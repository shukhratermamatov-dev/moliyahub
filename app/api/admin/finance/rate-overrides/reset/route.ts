import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Сбрасывает все загруженные ставки обратно к значениям по умолчанию из
// lib/data/banks.ts — просто удаляет все строки таблицы override'ов.
export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServiceRoleClient();
    // Supabase требует условие в delete() — "не равно несуществующему id"
    // фактически означает "удалить все строки".
    const { error } = await supabase
      .from("financing_rate_overrides")
      .delete()
      .neq("offer_id", "__never__");
    if (error) {
      return NextResponse.json({ error: "db_failed" }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ error: "db_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
