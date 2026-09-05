import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { OFFERS } from "@/lib/data/banks";
import { applyRateOverrides, type RateOverrideMap } from "@/lib/finance/rate-overrides";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Шаблон для админа: те же продукты, что в каталоге, с ТЕКУЩИМИ действующими
// ставками (включая уже загруженные ранее override'ы) — админ правит только
// колонки "Ставка от"/"Ставка до" и загружает файл обратно через
// /api/admin/finance/rate-overrides/import. Колонка "Код" — служебная,
// именно по ней импорт находит нужный продукт; менять её не нужно.
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let overrides: RateOverrideMap = {};
  try {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("financing_rate_overrides")
      .select("offer_id, rate_min, rate_max");
    for (const row of data ?? []) {
      overrides[row.offer_id as string] = {
        rateMin: Number(row.rate_min),
        rateMax: Number(row.rate_max),
      };
    }
  } catch {
    overrides = {};
  }

  const effectiveOffers = applyRateOverrides(OFFERS, overrides);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Ставки");
  sheet.columns = [
    { header: "Код", key: "code", width: 20 },
    { header: "Банк", key: "bank", width: 40 },
    { header: "Продукт", key: "title", width: 40 },
    { header: "Ставка от, %", key: "rateMin", width: 16 },
    { header: "Ставка до, %", key: "rateMax", width: 16 },
  ];
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF14532D" } };

  for (const o of effectiveOffers) {
    sheet.addRow({
      code: o.id,
      bank: o.bank.ru,
      title: o.title.ru,
      rateMin: o.rateMin,
      rateMax: o.rateMax,
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="moliyahub-stavki.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
