import path from "node:path";
import PdfPrinter from "pdfmake";
import type { Dictionary } from "@/i18n/get-dictionary";
import { formatPct, formatRatio } from "@/lib/utils";
import { computeSubtotals } from "./aggregate";
import { FINANCE_GROUPS, type AiAdvice, type FinanceData, type FinanceGroupKey, type FinancialRatios } from "./types";

// Шрифт с кириллицей для серверной генерации PDF (DejaVu Sans, свободная
// лицензия, файлы лежат в assets/fonts — см. assets/fonts/LICENSE-DejaVu.txt).
// Курсив/жирный курсив у нас нет отдельным файлом — переиспользуем обычный/
// жирный, это не идеально визуально, но не ломает рендер.
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

function fieldsOf(key: FinanceGroupKey) {
  return FINANCE_GROUPS.find((g) => g.key === key)?.fields ?? [];
}

function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

function balanceTableBody(dict: Dictionary, data: FinanceData): Cell[][] {
  const s = computeSubtotals(data);
  const rows: Cell[][] = [[{ text: "Статья", bold: true }, { text: "Сумма, сум", bold: true }]];

  const group = (key: FinanceGroupKey, totalLabel: string, totalValue: number) => {
    rows.push([{ text: dict.financeFields.groups[key], bold: true }, { text: "" }]);
    for (const field of fieldsOf(key)) {
      rows.push([dict.financeFields.labels[field], fmtMoney(data[field])]);
    }
    rows.push([
      { text: totalLabel, bold: true, italics: true },
      { text: fmtMoney(totalValue), bold: true, italics: true },
    ]);
  };

  group("longTermAssets", dict.financeFields.totals.longTermAssetsTotal, s.longTermAssetsTotal);
  group("currentAssets", dict.financeFields.totals.currentAssetsTotal, s.currentAssetsTotal);
  rows.push([
    { text: dict.financeFields.totals.totalAssets, bold: true },
    { text: fmtMoney(s.totalAssets), bold: true },
  ]);

  group("equity", dict.financeFields.totals.equityTotal, s.equityTotal);
  group("longTermLiabilities", dict.financeFields.totals.longTermLiabilitiesTotal, s.longTermLiabilitiesTotal);
  group("currentLiabilities", dict.financeFields.totals.currentLiabilitiesTotal, s.currentLiabilitiesTotal);
  rows.push([
    { text: dict.financeFields.totals.totalLiabilitiesAndEquity, bold: true },
    { text: fmtMoney(s.totalLiabilitiesAndEquity), bold: true },
  ]);

  return rows;
}

function pnlTableBody(dict: Dictionary, data: FinanceData): Cell[][] {
  const s = computeSubtotals(data);
  const rows: Cell[][] = [[{ text: "Статья", bold: true }, { text: "Сумма, сум", bold: true }]];

  for (const key of ["revenue", "costOfSales"] as const) {
    rows.push([dict.financeFields.labels[key], fmtMoney(data[key])]);
  }
  rows.push([
    { text: dict.financeFields.totals.grossProfit, bold: true, italics: true },
    { text: fmtMoney(s.grossProfit), bold: true, italics: true },
  ]);

  for (const key of ["distributionCosts", "adminExpenses", "otherOperatingIncome", "otherOperatingExpenses"] as const) {
    rows.push([dict.financeFields.labels[key], fmtMoney(data[key])]);
  }
  rows.push([
    { text: dict.financeFields.totals.operatingProfit, bold: true, italics: true },
    { text: fmtMoney(s.operatingProfit), bold: true, italics: true },
  ]);

  for (const key of ["financialIncome", "interestExpense"] as const) {
    rows.push([dict.financeFields.labels[key], fmtMoney(data[key])]);
  }
  rows.push([
    { text: dict.financeFields.totals.profitBeforeTax, bold: true, italics: true },
    { text: fmtMoney(s.profitBeforeTax), bold: true, italics: true },
  ]);

  rows.push([dict.financeFields.labels.incomeTax, fmtMoney(data.incomeTax)]);
  rows.push([
    { text: dict.financeFields.totals.netProfit, bold: true },
    { text: fmtMoney(s.netProfit), bold: true },
  ]);

  return rows;
}

function ratiosTableBody(dict: Dictionary, ratios: FinancialRatios): Cell[][] {
  const ratioKeys = ["currentRatio", "quickRatio", "absoluteLiquidity", "assetTurnover", "inventoryTurnover", "interestCoverage"] as const;
  const pctKeys = ["roa", "roe", "ros", "grossMargin", "operatingMargin", "autonomyRatio", "debtRatio"] as const;

  const rows: Cell[][] = [[{ text: "Показатель", bold: true }, { text: "Значение", bold: true }]];
  for (const key of ratioKeys) {
    rows.push([dict.panel.ratioRows[key], formatRatio(ratios[key])]);
  }
  for (const key of pctKeys) {
    rows.push([dict.panel.ratioRows[key], formatPct(ratios[key])]);
  }
  rows.push([dict.panel.ratioRows.workingCapital, fmtMoney(ratios.workingCapital)]);
  return rows;
}

export async function buildAnalysisPdf(params: {
  dict: Dictionary;
  industry: string;
  region: string;
  data: FinanceData;
  ratios: FinancialRatios;
  advice: AiAdvice | null;
}): Promise<Buffer> {
  const { dict, industry, region, data, ratios, advice } = params;
  const printer = new PdfPrinter(fonts);

  const content: Record<string, unknown>[] = [
    { text: dict.analyze.title, style: "h1" },
    {
      text: `${dict.analyze.industryLabel}: ${industry || "—"}    ${dict.analyze.regionLabel}: ${region || "—"}`,
      margin: [0, 4, 0, 0],
    },
    { text: `${dict.panel.outOf100}: ${ratios.score} / 100`, style: "scoreLine", margin: [0, 8, 0, 12] },

    { text: dict.analyze.balanceSectionTitle, style: "h2" },
    {
      table: { headerRows: 1, widths: ["*", 120], body: balanceTableBody(dict, data) },
      layout: "lightHorizontalLines",
      fontSize: 9,
      margin: [0, 4, 0, 14],
    },

    { text: dict.analyze.pnlSectionTitle, style: "h2" },
    {
      table: { headerRows: 1, widths: ["*", 120], body: pnlTableBody(dict, data) },
      layout: "lightHorizontalLines",
      fontSize: 9,
      margin: [0, 4, 0, 14],
    },

    { text: "Финансовые показатели", style: "h2" },
  ];
  content.push({
    table: { headerRows: 1, widths: ["*", 100], body: ratiosTableBody(dict, ratios) },
    layout: "lightHorizontalLines",
    fontSize: 9,
    margin: [0, 4, 0, 14],
  });

  if (advice) {
    content.push({ text: advice.source === "ai" ? dict.panel.aiAnalysis : dict.panel.expressRecommendations, style: "h2" });
    content.push({ text: advice.summary, margin: [0, 4, 0, 4] });
    content.push({ text: advice.score_comment, margin: [0, 0, 0, 10], italics: true });

    if (advice.red_flags.length > 0) {
      content.push({ text: dict.panel.redFlags, style: "h3" });
      content.push({
        ul: advice.red_flags.map((f) => `${f.indicator}: ${f.value} — ${f.why_critical}`),
        margin: [0, 2, 0, 10],
      });
    }

    if (advice.strengths.length > 0) {
      content.push({ text: dict.panel.strengths, style: "h3" });
      content.push({ ul: advice.strengths, margin: [0, 2, 0, 10] });
    }

    content.push({ text: dict.panel.whatToDo, style: "h3" });
    content.push({
      ol: advice.recommendations.map(
        (r) => `${r.title} — ${r.description} (${dict.panel.effectPrefix}${r.expected_effect})`,
      ),
      margin: [0, 2, 0, 10],
    });

    content.push({ text: dict.panel.financingHeading, style: "h3" });
    content.push({ text: advice.financing_advice });
  }

  const docDefinition = {
    content,
    defaultStyle: { font: "DejaVuSans", fontSize: 9 },
    styles: {
      h1: { fontSize: 16, bold: true },
      h2: { fontSize: 12, bold: true, margin: [0, 10, 0, 0] },
      h3: { fontSize: 10, bold: true, margin: [0, 6, 0, 0] },
      scoreLine: { fontSize: 12, bold: true },
    },
    pageMargins: [36, 36, 36, 36],
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  const buffer = await streamToBuffer(pdfDoc);
  pdfDoc.end();
  return buffer;
}
