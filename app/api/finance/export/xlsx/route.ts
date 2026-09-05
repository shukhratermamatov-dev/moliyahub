import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { defaultLocale, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { addAdviceSheet, addBalanceSheet, addPnlSheet, addRatiosSheet } from "@/lib/finance/excel";
import { calculateRatios } from "@/lib/finance/ratios";
import { deriveAggregates } from "@/lib/finance/aggregate";
import { sanitizeFinanceData } from "@/lib/finance/sanitize";
import type { AiAdvice } from "@/lib/finance/types";

// Экспорт текущего анализа (введённые данные + коэффициенты + рекомендации,
// если есть) в .xlsx. Ничего не сохраняется на сервере — файл собирается и
// сразу отдаётся в ответе.
export async function POST(request: Request) {
  let body: {
    locale?: string;
    industry?: string;
    region?: string;
    data?: unknown;
    advice?: AiAdvice | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const locale = isLocale(body.locale ?? "") ? (body.locale as string as typeof defaultLocale) : defaultLocale;
  const dict = await getDictionary(locale);
  const data = sanitizeFinanceData(body.data);
  const ratios = calculateRatios(deriveAggregates(data));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MoliyaHub";
  workbook.created = new Date();

  addBalanceSheet(workbook, dict, data);
  addPnlSheet(workbook, dict, data);
  addRatiosSheet(workbook, dict, ratios, body.industry ?? "", body.region ?? "");
  addAdviceSheet(workbook, dict, body.advice ?? null);

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="moliyahub-analysis.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
