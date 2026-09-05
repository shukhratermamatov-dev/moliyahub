import { NextResponse } from "next/server";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { deriveAggregates } from "@/lib/finance/aggregate";
import { buildAnalysisPdf } from "@/lib/finance/pdf";
import { calculateRatios } from "@/lib/finance/ratios";
import { sanitizeFinanceData } from "@/lib/finance/sanitize";
import type { AiAdvice } from "@/lib/finance/types";

// Экспорт текущего анализа в PDF. Как и .xlsx-экспорт, ничего не сохраняет —
// файл собирается на лету и сразу отдаётся в ответе.
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

  const locale: Locale = isLocale(body.locale ?? "") ? (body.locale as Locale) : defaultLocale;
  const dict = await getDictionary(locale);
  const data = sanitizeFinanceData(body.data);
  const ratios = calculateRatios(deriveAggregates(data));

  let buffer: Buffer;
  try {
    buffer = await buildAnalysisPdf({
      dict,
      industry: body.industry ?? "",
      region: body.region ?? "",
      data,
      ratios,
      advice: body.advice ?? null,
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
