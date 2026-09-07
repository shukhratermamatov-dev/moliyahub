import { NextResponse } from "next/server";
import { buildBusinessPlanPdf } from "@/lib/business-plan/pdf";
import type { BusinessPlan } from "@/lib/business-plan/types";

// Экспорт сформированного ИИ бизнес-плана в PDF. Как и .xlsx-экспорт,
// ничего не сохраняет — план приходит в теле запроса и сразу превращается
// в файл.
export async function POST(request: Request) {
  let body: { plan?: BusinessPlan };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.plan || !body.plan.executiveSummary || !body.plan.financials) {
    return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
  }

  let buffer: Buffer;
  try {
    buffer = await buildBusinessPlanPdf(body.plan);
  } catch (err) {
    console.error("Business plan PDF export failed", err);
    return NextResponse.json({ error: "pdf_failed" }, { status: 500 });
  }

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="business-plan.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
