import path from "node:path";
import PdfPrinter from "pdfmake";
import type { BusinessPlan, BusinessPlanFinancialLine } from "./types";

// Тот же шрифт с кириллицей, что и в lib/finance/pdf.ts (DejaVu Sans,
// свободная лицензия — см. assets/fonts/LICENSE-DejaVu.txt).
const FONTS_DIR = path.join(process.cwd(), "assets", "fonts");

const fonts = {
  DejaVuSans: {
    normal: path.join(FONTS_DIR, "DejaVuSans.ttf"),
    bold: path.join(FONTS_DIR, "DejaVuSans-Bold.ttf"),
    italics: path.join(FONTS_DIR, "DejaVuSans.ttf"),
    bolditalics: path.join(FONTS_DIR, "DejaVuSans-Bold.ttf"),
  },
};

type Cell = string | { text: string; bold?: boolean; italics?: boolean };

function fmtMoney(value: number): string {
  return Math.round(value).toLocaleString("ru-RU");
}

function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

function lineTableBody(heading: string, lines: BusinessPlanFinancialLine[]): Cell[][] {
  const rows: Cell[][] = [[{ text: heading, bold: true }, { text: "Сумма, сум", bold: true }]];
  for (const l of lines) {
    rows.push([l.note ? `${l.label} (${l.note})` : l.label, fmtMoney(l.amount)]);
  }
  const total = lines.reduce((sum, l) => sum + l.amount, 0);
  rows.push([{ text: "Итого", bold: true, italics: true }, { text: fmtMoney(total), bold: true, italics: true }]);
  return rows;
}

export async function buildBusinessPlanPdf(plan: BusinessPlan): Promise<Buffer> {
  const printer = new PdfPrinter(fonts);

  const revenueTotal = plan.financials.monthlyRevenue.reduce((s, l) => s + l.amount, 0);
  const costsTotal = plan.financials.monthlyCosts.reduce((s, l) => s + l.amount, 0);

  const content: Record<string, unknown>[] = [
    { text: plan.projectName, style: "h1" },
    {
      text: [
        plan.subIndustryLabel ? `${plan.industryLabel} · ${plan.subIndustryLabel}` : plan.industryLabel,
        plan.region || "—",
        new Date(plan.generatedAt).toLocaleDateString("ru-RU"),
      ].join("   ·   "),
      margin: [0, 4, 0, 14],
      color: "#64748B",
    },

    { text: "Резюме проекта", style: "h2" },
    { text: plan.executiveSummary, margin: [0, 4, 0, 12] },

    { text: "Описание компании / проекта", style: "h2" },
    { text: plan.companyDescription, margin: [0, 4, 0, 12] },

    { text: "Анализ рынка Узбекистана", style: "h2" },
    { text: plan.marketAnalysisUzbekistan, margin: [0, 4, 0, 12] },
  ];

  if (plan.marketAnalysisForeign.length > 0) {
    content.push({ text: "Зарубежные рынки для сравнения", style: "h2" });
    for (const m of plan.marketAnalysisForeign) {
      content.push({ text: m.country, style: "h3" });
      content.push({ text: m.body, margin: [0, 2, 0, 8] });
    }
  }

  content.push(
    { text: "Маркетинг и продажи", style: "h2" },
    { text: plan.marketing, margin: [0, 4, 0, 12] },
    { text: "Операционный план", style: "h2" },
    { text: plan.operations, margin: [0, 4, 0, 12] },
    { text: "Организационный план", style: "h2" },
    { text: plan.organization, margin: [0, 4, 0, 12] },
    { text: "Риски", style: "h2" },
    { text: plan.risks, margin: [0, 4, 0, 12] },

    { text: "Финансовый план", style: "h2" },
    {
      text: "Оценки ниже — прогноз ИИ под указанную сумму инвестиций и идею проекта, не проверенные рыночные данные. Перед использованием скорректируйте под реальные цены и условия.",
      italics: true,
      color: "#64748B",
      fontSize: 8,
      margin: [0, 2, 0, 8],
    },
    { text: `Начальные инвестиции: ${fmtMoney(plan.financials.initialInvestment)} сум`, bold: true, margin: [0, 0, 0, 8] },
  );

  if (plan.financials.startupCosts.length > 0) {
    content.push({
      table: { headerRows: 1, widths: ["*", 110], body: lineTableBody("Стартовые затраты", plan.financials.startupCosts) },
      layout: "lightHorizontalLines",
      fontSize: 9,
      margin: [0, 0, 0, 10],
    });
  }
  content.push({
    table: { headerRows: 1, widths: ["*", 110], body: lineTableBody("Ежемесячная выручка", plan.financials.monthlyRevenue) },
    layout: "lightHorizontalLines",
    fontSize: 9,
    margin: [0, 0, 0, 10],
  });
  content.push({
    table: { headerRows: 1, widths: ["*", 110], body: lineTableBody("Ежемесячные расходы", plan.financials.monthlyCosts) },
    layout: "lightHorizontalLines",
    fontSize: 9,
    margin: [0, 0, 0, 10],
  });

  content.push(
    { text: `Ежемесячная прибыль (оценка): ${fmtMoney(revenueTotal - costsTotal)} сум`, bold: true, margin: [0, 0, 0, 4] },
    { text: `Срок выхода на окупаемость: ${plan.financials.breakEvenMonths} мес.`, margin: [0, 0, 0, 4] },
    { text: `Срок возврата инвестиций: ${plan.financials.paybackMonths} мес.`, margin: [0, 0, 0, 10] },
    { text: "Допущения расчёта", style: "h3" },
    { text: plan.financials.assumptions, margin: [0, 2, 0, 12] },
  );

  if (plan.sources.length > 0) {
    content.push({ text: "Источники", style: "h2" });
    content.push({
      ul: plan.sources.map((s) => `${s.title} — ${s.url}`),
      fontSize: 8,
      margin: [0, 4, 0, 0],
    });
  }

  const docDefinition = {
    content,
    defaultStyle: { font: "DejaVuSans", fontSize: 9 },
    styles: {
      h1: { fontSize: 18, bold: true },
      h2: { fontSize: 12, bold: true, margin: [0, 12, 0, 0] },
      h3: { fontSize: 10, bold: true, margin: [0, 6, 0, 0] },
    },
    pageMargins: [36, 36, 36, 36],
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  const buffer = await streamToBuffer(pdfDoc);
  pdfDoc.end();
  return buffer;
}
