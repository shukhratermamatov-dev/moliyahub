import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { defaultLocale, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { addBalanceSheet, addPnlSheet } from "@/lib/finance/excel";

// Пустой шаблон Excel для ручного заполнения баланса и ОПУ.
// GET /api/finance/template?locale=ru|uz|en&year2=2026
//
// year2 — необязательный: если передан (страница подставляет его, когда
// пользователь уже нажал «Добавить второй год»), шаблон получает четвёртую
// колонку под второй отчётный период — можно сразу заполнить оба года в
// одном файле и загрузить его обратно за один раз.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawLocale = searchParams.get("locale") ?? "";
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = await getDictionary(locale);

  const year2Param = searchParams.get("year2");
  const secondValueHeader = year2Param ? `${dict.analyze.reportingYearLabel} ${year2Param}` : undefined;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MoliyaHub";
  workbook.created = new Date();

  addBalanceSheet(workbook, dict, undefined, undefined, secondValueHeader);
  addPnlSheet(workbook, dict, undefined, undefined, secondValueHeader);

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="moliyahub-balance-template.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
