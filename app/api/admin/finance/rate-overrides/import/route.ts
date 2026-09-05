import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { OFFERS } from "@/lib/data/banks";
import { createServiceRoleClient } from "@/lib/supabase/server";

const VALID_IDS = new Set(OFFERS.map((o) => o.id));

function cellToNumber(value: ExcelJS.CellValue): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const n = Number(value.replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  // Ячейка-формула — см. app/api/finance/import/route.ts, тот же приём.
  if (value && typeof value === "object" && "result" in value) {
    const result = value.result;
    return typeof result === "number" && Number.isFinite(result) ? result : null;
  }
  return null;
}

// Загрузка Excel со ставками (см. .../template для формата). Матчит строки
// по служебной колонке "Код" (A) против известных id из lib/data/banks.ts —
// продукты, добавленные вручную через админ-панель, этим механизмом не
// покрываются (у них нет стабильного id в шаблоне). Валидные строки
// сохраняются в таблицу financing_rate_overrides сервисным ключом (в обход
// RLS) — публичный /api/finance/rate-overrides потом отдаёт их всем
// посетителям.
export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  try {
    type LoadArg = Parameters<typeof workbook.xlsx.load>[0];
    await workbook.xlsx.load(Buffer.from(arrayBuffer) as unknown as LoadArg);
  } catch {
    return NextResponse.json({ error: "bad_file" }, { status: 400 });
  }

  const rows: { offer_id: string; rate_min: number; rate_max: number }[] = [];
  const skipped: string[] = [];

  workbook.eachSheet((sheet) => {
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // заголовок
      const id = String(row.getCell(1).value ?? "").trim();
      if (!id) return;
      if (!VALID_IDS.has(id)) {
        skipped.push(id);
        return;
      }
      const rateMin = cellToNumber(row.getCell(4).value);
      const rateMax = cellToNumber(row.getCell(5).value);
      if (
        rateMin === null ||
        rateMax === null ||
        rateMin < 0 ||
        rateMax < 0 ||
        rateMin > 100 ||
        rateMax > 100 ||
        rateMin > rateMax
      ) {
        skipped.push(id);
        return;
      }
      rows.push({ offer_id: id, rate_min: rateMin, rate_max: rateMax });
    });
  });

  if (rows.length === 0) {
    return NextResponse.json({ error: "no_data", skipped }, { status: 400 });
  }

  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("financing_rate_overrides")
      .upsert(
        rows.map((r) => ({ ...r, updated_at: new Date().toISOString() })),
        { onConflict: "offer_id" },
      );
    if (error) {
      return NextResponse.json({ error: "db_failed" }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ error: "db_failed" }, { status: 500 });
  }

  return NextResponse.json({ updated: rows.length, skipped });
}
