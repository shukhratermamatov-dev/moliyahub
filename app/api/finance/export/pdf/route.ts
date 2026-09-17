import { NextResponse } from "next/server";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { deriveAggregates } from "@/lib/finance/aggregate";
import { buildAnalysisPdf } from "@/lib/finance/pdf";
import { calculateRatios } from "@/lib/finance/ratios";
import { sanitizeFinanceData } from "@/lib/finance/sanitize";
import type { AiAdvice } from "@/lib/finance/types";
import { findIndustry } from "@/lib/data/industries";
import { findRegion } from "@/lib/data/regions";
import { pickText } from "@/lib/i18n-text";

// Экспорт текущего анализа в PDF. Как и .xlsx-экспорт, ничего не сохраняет —
// файл собирается на лету и сразу отдаётся в ответе.
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

  const locale: Locale = isLocale(body.locale ?? "") ? (body.locale as Locale) : defaultLocale;
  const dict = await getDictionary(locale);
  const data = sanitizeFinanceData(body.data);
  const ratios = calculateRatios(deriveAggregates(data));

  // industry/region приходят как id из справочников (lib/data/industries,
  // lib/data/regions) — резолвим в человекочитаемую подпись на нужной
  // локали; если id не нашёлся (например, старый свободный текст) — просто
  // показываем как есть.
  const industryLabel = body.industry ? pickText(findIndustry(body.industry)?.name ?? { ru: body.industry, uz: body.industry, en: body.industry }, locale) : "";
  const regionLabel = body.region ? pickText(findRegion(body.region)?.name ?? { ru: body.region, uz: body.region, en: body.region }, locale) : "";

  const secondPeriod = body.secondPeriod
    ? { year: body.secondPeriod.year, data: sanitizeFinanceData(body.secondPeriod.data) }
    : null;
  const secondRatios = secondPeriod ? calculateRatios(deriveAggregates(secondPeriod.data)) : null;

  let buffer: Buffer;
  try {
    buffer = await buildAnalysisPdf({
      dict,
      industry: industryLabel,
      region: regionLabel,
      companyName: body.companyName,
      year: body.year,
      data,
      ratios,
      secondRatios,
      advice: body.advice ?? null,
      secondPeriod,
    });
  } catch (err) {
    console.error("PDF export failed", err);
    return NextResponse.json({ error: "pdf_failed" }, { status: 500 });
  }

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="moliyahub-analysis.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
