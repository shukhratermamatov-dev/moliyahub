import { NextResponse } from "next/server";
import { buildBusinessPlanWorkbook } from "@/lib/business-plan/excel";
import type { BusinessPlan } from "@/lib/business-plan/types";

// Экспорт сформированного ИИ бизнес-плана в .xlsx. Ничего не сохраняет на
// сервере — план приходит целиком в теле запроса (это уже сгенерированный
// результат, показанный пользователю на странице) и сразу конвертируется
// в файл, который отдаётся в ответе.
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

  const workbook = buildBusinessPlanWorkbook(body.plan);
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="business-plan.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
