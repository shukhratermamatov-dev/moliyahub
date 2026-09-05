import { NextResponse } from "next/server";
import type { RateOverrideMap } from "@/lib/finance/rate-overrides";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Публичный эндпоинт: отдаёт текущие ставки, загруженные админом через
// Excel (см. /api/admin/finance/rate-overrides/*), чтобы страница
// «Финансирование» показывала их всем посетителям, а не только на
// устройстве админа. Читаем сервисным ключом (без пользовательской
// сессии) — таблица публично доступна на чтение и через RLS, сервисный
// ключ здесь просто избавляет от лишнего анонимного клиента.
export async function GET() {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("financing_rate_overrides")
      .select("offer_id, rate_min, rate_max");

    if (error || !data) {
      return NextResponse.json({}, { status: 200 });
    }

    const map: RateOverrideMap = {};
    for (const row of data) {
      map[row.offer_id as string] = {
        rateMin: Number(row.rate_min),
        rateMax: Number(row.rate_max),
      };
    }

    return NextResponse.json(map, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
    });
  } catch {
    // Таблица ещё не создана в Supabase, или сервис недоступен — молча
    // отдаём пустой набор, каталог просто покажет ставки по умолчанию.
    return NextResponse.json({}, { status: 200 });
  }
}
