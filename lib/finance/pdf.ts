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

// secondHeader задан — значит есть второй отчётный период, и в каждую
// строку добавляется третья колонка с его суммой (или «—», если поле не
// пришло). Без secondHeader таблицы выглядят ровно как раньше (2 колонки).
function balanceTableBody(
  dict: Dictionary,
  data: FinanceData,
  secondData?: FinanceData,
  secondHeader?: string,
): Cell[][] {
  const s = computeSubtotals(data);
  const s2 = secondData ? computeSubtotals(secondData) : null;

  const header: Cell[] = [{ text: "Статья", bold: true }, { text: "Сумма, сум", bold: true }];
  if (secondHeader) header.push({ text: secondHeader, bold: true });
  const rows: Cell[][] = [header];

  const group = (key: FinanceGroupKey, totalLabel: string, totalValue: number, totalValue2?: number) => {
    const sectionCells: Cell[] = [{ text: dict.financeFields.groups[key], bold: true }, { text: "" }];
    if (secondHeader) sectionCells.push({ text: "" });
    rows.push(sectionCells);

    for (const field of fieldsOf(key)) {
      const row: Cell[] = [dict.financeFields.labels[field], fmtMoney(data[field])];
      if (secondHeader) row.push(secondData ? fmtMoney(secondData[field]) : "—");
      rows.push(row);
    }

    const totalCells: Cell[] = [
      { text: totalLabel, bold: true, italics: true },
      { text: fmtMoney(totalValue), bold: true, italics: true },
    ];
    if (secondHeader) {
      totalCells.push({ text: totalValue2 !== undefined ? fmtMoney(totalValue2) : "—", bold: true, italics: true });
    }
    rows.push(totalCells);
  };

  group("longTermAssets", dict.financeFields.totals.longTermAssetsTotal, s.longTermAssetsTotal, s2?.longTermAssetsTotal);
  group("currentAssets", dict.financeFields.totals.currentAssetsTotal, s.currentAssetsTotal, s2?.currentAssetsTotal);

  const totalAssetsRow: Cell[] = [
    { text: dict.financeFields.totals.totalAssets, bold: true },
    { text: fmtMoney(s.totalAssets), bold: true },
  ];
  if (secondHeader) totalAssetsRow.push({ text: s2 ? fmtMoney(s2.totalAssets) : "—", bold: true });
  rows.push(totalAssetsRow);

  group("equity", dict.financeFields.totals.equityTotal, s.equityTotal, s2?.equityTotal);
  group(
    "longTermLiabilities",
    dict.financeFields.totals.longTermLiabilitiesTotal,
    s.longTermLiabilitiesTotal,
    s2?.longTermLiabilitiesTotal,
  );
  group(
    "currentLiabilities",
    dict.financeFields.totals.currentLiabilitiesTotal,
    s.currentLiabilitiesTotal,
    s2?.currentLiabilitiesTotal,
  );

  const totalLiabRow: Cell[] = [
    { text: dict.financeFields.totals.totalLiabilitiesAndEquity, bold: true },
    { text: fmtMoney(s.totalLiabilitiesAndEquity), bold: true },
  ];
  if (secondHeader) {
    totalLiabRow.push({ text: s2 ? fmtMoney(s2.totalLiabilitiesAndEquity) : "—", bold: true });
  }
  rows.push(totalLiabRow);

  return rows;
}

function pnlTableBody(
  dict: Dictionary,
  data: FinanceData,
  secondData?: FinanceData,
  secondHeader?: string,
): Cell[][] {
  const s = computeSubtotals(data);
  const s2 = secondData ? computeSubtotals(secondData) : null;

  const header: Cell[] = [{ text: "Статья", bold: true }, { text: "Сумма, сум", bold: true }];
  if (secondHeader) header.push({ text: secondHeader, bold: true });
  const rows: Cell[][] = [header];

  const line = (field: keyof FinanceData) => {
    const row: Cell[] = [dict.financeFields.labels[field], fmtMoney(data[field])];
    if (secondHeader) row.push(secondData ? fmtMoney(secondData[field]) : "—");
    rows.push(row);
  };
  const totalLine = (label: string, value: number, value2?: number) => {
    const row: Cell[] = [
      { text: label, bold: true, italics: true },
      { text: fmtMoney(value), bold: true, italics: true },
    ];
    if (secondHeader) row.push({ text: value2 !== undefined ? fmtMoney(value2) : "—", bold: true, italics: true });
    rows.push(row);
  };

  for (const key of ["revenue", "costOfSales"] as const) line(key);
  totalLine(dict.financeFields.totals.grossProfit, s.grossProfit, s2?.grossProfit);

  for (const key of ["distributionCosts", "adminExpenses", "otherOperatingIncome", "otherOperatingExpenses"] as const) {
    line(key);
  }
  totalLine(dict.financeFields.totals.operatingProfit, s.operatingProfit, s2?.operatingProfit);

  for (const key of ["financialIncome", "interestExpense"] as const) line(key);
  totalLine(dict.financeFields.totals.profitBeforeTax, s.profitBeforeTax, s2?.profitBeforeTax);

  line("incomeTax");

  const netRow: Cell[] = [
    { text: dict.financeFields.totals.netProfit, bold: true },
    { text: fmtMoney(s.netProfit), bold: true },
  ];
  if (secondHeader) netRow.push({ text: s2 ? fmtMoney(s2.netProfit) : "—", bold: true });
  rows.push(netRow);

  return rows;
}

function ratiosTableBody(
  dict: Dictionary,
  ratios: FinancialRatios,
  secondRatios?: FinancialRatios,
  secondHeader?: string,
): Cell[][] {
  const ratioKeys = ["currentRatio", "quickRatio", "absoluteLiquidity", "assetTurnover", "inventoryTurnover", "interestCoverage"] as const;
  const pctKeys = ["roa", "roe", "ros", "grossMargin", "operatingMargin", "autonomyRatio", "debtRatio"] as const;

  const header: Cell[] = [{ text: "Показатель", bold: true }, { text: "Значение", bold: true }];
  if (secondHeader) header.push({ text: secondHeader, bold: true });
  const rows: Cell[][] = [header];

  const line = (label: string, value: string, value2?: string) => {
    const row: Cell[] = [label, value];
    if (secondHeader) row.push(value2 ?? "—");
    rows.push(row);
  };

  for (const key of ratioKeys) {
    line(dict.panel.ratioRows[key], formatRatio(ratios[key]), secondRatios ? formatRatio(secondRatios[key]) : undefined);
  }
  for (const key of pctKeys) {
    line(dict.panel.ratioRows[key], formatPct(ratios[key]), secondRatios ? formatPct(secondRatios[key]) : undefined);
  }
  line(
    dict.panel.ratioRows.workingCapital,
    fmtMoney(ratios.workingCapital),
    secondRatios ? fmtMoney(secondRatios.workingCapital) : undefined,
  );
  return rows;
}

export async function buildAnalysisPdf(params: {
  dict: Dictionary;
  industry: string;
  region: string;
  companyName?: string;
  year?: number;
  data: FinanceData;
  ratios: FinancialRatios;
  secondRatios?: FinancialRatios | null;
  advice: AiAdvice | null;
  secondPeriod?: { year: number; data: FinanceData } | null;
}): Promise<Buffer> {
  const { dict, industry, region, companyName, year, data, ratios, secondRatios, advice, secondPeriod } = params;
  const printer = new PdfPrinter(fonts);

  const secondHeader = secondPeriod ? `${dict.analyze.reportingYearLabel} ${secondPeriod.year}` : undefined;
  const tableWidths = secondHeader ? ["*", 90, 90] : ["*", 120];

  const infoLine = [
    companyName ? `${dict.analyze.companyNameLabel}: ${companyName}` : null,
    year ? `${dict.analyze.reportingYearLabel}: ${year}${secondPeriod ? `, ${secondPeriod.year}` : ""}` : null,
    `${dict.analyze.industryLabel}: ${industry || "—"}`,
    `${dict.analyze.regionLabel}: ${region || "—"}`,
  ]
    .filter(Boolean)
    .join("    ");

  const content: Record<string, unknown>[] = [
    { text: dict.analyze.title, style: "h1" },
    { text: infoLine, margin: [0, 4, 0, 0] },
    { text: `${dict.panel.outOf100}: ${ratios.score} / 100`, style: "scoreLine", margin: [0, 8, 0, 12] },

    { text: dict.analyze.balanceSectionTitle, style: "h2" },
    {
      table: { headerRows: 1, widths: tableWidths, body: balanceTableBody(dict, data, secondPeriod?.data, secondHeader) },
      layout: "lightHorizontalLines",
      fontSize: 9,
      margin: [0, 4, 0, 14],
    },

    { text: dict.analyze.pnlSectionTitle, style: "h2" },
    {
      table: { headerRows: 1, widths: tableWidths, body: pnlTableBody(dict, data, secondPeriod?.data, secondHeader) },
      layout: "lightHorizontalLines",
      fontSize: 9,
      margin: [0, 4, 0, 14],
    },

    { text: "Финансовые показатели", style: "h2" },
  ];
  content.push({
    table: {
      headerRows: 1,
      widths: secondHeader ? ["*", 90, 90] : ["*", 100],
      body: ratiosTableBody(dict, ratios, secondRatios ?? undefined, secondHeader),
    },
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

    if (advice.weaknesses.length > 0) {
      content.push({ text: dict.panel.weaknesses, style: "h3" });
      content.push({ ul: advice.weaknesses, margin: [0, 2, 0, 10] });
    }

    content.push({ text: dict.panel.whatToDo, style: "h3" });
    content.push({
      ol: advice.recommendations.map(
        (r) => `${r.title} — ${r.description} (${dict.panel.effectPrefix}${r.expected_effect})`,
      ),
      margin: [0, 2, 0, 10],
    });

    content.push({ text: dict.panel.marginBridgeHeading, style: "h3" });
    content.push({ text: advice.margin_commentary, margin: [0, 2, 0, 10] });

    content.push({ text: dict.panel.frozenAssetsHeading, style: "h3" });
    content.push({ text: advice.frozen_assets_commentary, margin: [0, 2, 0, 10] });

    content.push({ text: dict.panel.safetyMarginHeading, style: "h3" });
    content.push({ text: advice.safety_margin_commentary, margin: [0, 2, 0, 10] });

    content.push({ text: dict.panel.benchmarkHeading, style: "h3" });
    if (advice.benchmark.available && advice.benchmark.comparisons.length > 0) {
      content.push({
        ul: advice.benchmark.comparisons.map(
          (c) => `${c.metric}: ${c.company_value} / ${c.benchmark_value} (${dict.panel.benchmarkSourceLabel} ${c.source})`,
        ),
        margin: [0, 2, 0, 4],
      });
    }
    content.push({ text: advice.benchmark.note || dict.panel.benchmarkUnavailable, margin: [0, 0, 0, 10] });

    if (advice.variance?.narrative) {
      content.push({ text: dict.varianceDashboard.narrativeHeading, style: "h3" });
      content.push({ text: advice.variance.narrative, margin: [0, 2, 0, 10] });
    }

    content.push({ text: dict.panel.financingHeading, style: "h3" });
    content.push({ text: advice.financing_advice });
  }

  content.push({ text: dict.analyze.disclaimer, italics: true, fontSize: 8, margin: [0, 16, 0, 0], color: "#64748b" });

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
  // ВАЖНО: .end() должен быть вызван ДО ожидания потока — иначе поток
  // никогда не эмитит 'end' и await зависает навсегда (был баг: PDF-экспорт
  // висел бесконечно и на /analyze, и на бизнес-планах).
  const bufferPromise = streamToBuffer(pdfDoc);
  pdfDoc.end();
  const buffer = await bufferPromise;
  return buffer;
}
