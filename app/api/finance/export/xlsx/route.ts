import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { defaultLocale, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { addAdviceSheet, addBalanceSheet, addPnlSheet, addRatiosSheet } from "@/lib/finance/excel";
import { calculateRatios } from "@/lib/finance/ratios";
import { deriveAggregates } from "@/lib/finance/aggregate";
import { sanitizeFinanceData } from "@/lib/finance/sanitize";
import type { AiAdvice } from "@/lib/finance/types";
import { findIndustry } from "@/lib/data/industries";
import { findRegion } from "@/lib/data/regions";
import { pickText } from "@/lib/i18n-text";

// Экспорт текущего анализа (введённые данные + коэффициенты + рекомендации,
// если есть) в .xlsx. Ничего не сохраняется на сервере — файл собирается и
// сразу отдаётся в ответе.
export async function POST(request: Request) {
  let body: {
    locale?: string;
    industry?: string;
    region?: string;
    companyName?: string;
    year?: number;
    data?: unknown;
    advice?: AiAdvice | null;
    secondPeriod?: { year: number; data: unknown } | null;
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

  // industry/region приходят как id из справочников — резолвим в подпись на
  // нужной локали; для старого свободного текста (id не найден) показываем
  // как есть.
  const industryLabel = body.industry ? pickText(findIndustry(body.industry)?.name ?? { ru: body.industry, uz: body.industry, en: body.industry }, locale) : "";
  const regionLabel = body.region ? pickText(findRegion(body.region)?.name ?? { ru: body.region, uz: body.region, en: body.region }, locale) : "";

  const secondPeriod = body.secondPeriod
    ? { year: body.secondPeriod.year, data: sanitizeFinanceData(body.secondPeriod.data) }
    : null;
  const secondValueHeader = secondPeriod ? `${dict.analyze.reportingYearLabel} ${secondPeriod.year}` : undefined;
  const secondRatios = secondPeriod ? calculateRatios(deriveAggregates(secondPeriod.data)) : undefined;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MoliyaHub";
  workbook.created = new Date();

  addBalanceSheet(workbook, dict, data, secondPeriod?.data, secondValueHeader);
  addPnlSheet(workbook, dict, data, secondPeriod?.data, secondValueHeader);
  addRatiosSheet(
    workbook,
    dict,
    ratios,
    industryLabel,
    regionLabel,
    body.companyName,
    body.year,
    secondRatios,
    secondValueHeader,
    secondPeriod?.year,
  );
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
