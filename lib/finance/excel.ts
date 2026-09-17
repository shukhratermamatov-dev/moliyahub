import ExcelJS from "exceljs";
import type { Dictionary } from "@/i18n/get-dictionary";
import { computeSubtotals } from "./aggregate";
import { FINANCE_GROUPS, type AiAdvice, type FinanceData, type FinanceGroupKey, type FinancialRatios } from "./types";

// Общие вспомогательные функции для сборки .xlsx (пустой шаблон и заполненный
// экспорт используют один и тот же макет — так шаблон и экспорт совместимы
// друг с другом при обратной загрузке через /api/finance/import).

function fieldsOf(key: FinanceGroupKey) {
  return FINANCE_GROUPS.find((g) => g.key === key)?.fields ?? [];
}

const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF14532D" } };
const SECTION_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
const TOTAL_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
const MONEY_FMT = "#,##0";

function setupSheet(sheet: ExcelJS.Worksheet, secondValueHeader?: string) {
  const columns: Partial<ExcelJS.Column>[] = [
    { header: "Код", key: "code", width: 24 },
    { header: "Статья", key: "label", width: 55 },
    { header: "Сумма, сум", key: "value", width: 20 },
  ];
  if (secondValueHeader !== undefined) {
    columns.push({ header: secondValueHeader, key: "value2", width: 20 });
  }
  sheet.columns = columns;
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = HEADER_FILL;
}

function sectionRow(sheet: ExcelJS.Worksheet, label: string) {
  const row = sheet.addRow({ code: "", label, value: null });
  row.font = { bold: true };
  row.fill = SECTION_FILL;
  return row;
}

function fieldRow(
  sheet: ExcelJS.Worksheet,
  code: string,
  label: string,
  value: number | null,
  value2?: number | null,
) {
  const row = sheet.addRow(value2 !== undefined ? { code, label, value, value2 } : { code, label, value });
  row.getCell("value").numFmt = MONEY_FMT;
  if (value2 !== undefined) row.getCell("value2").numFmt = MONEY_FMT;
  return row;
}

function totalRow(sheet: ExcelJS.Worksheet, label: string, value: number | null, value2?: number | null) {
  const row = sheet.addRow(value2 !== undefined ? { code: "", label, value, value2 } : { code: "", label, value });
  row.font = { bold: true, italic: true };
  row.fill = TOTAL_FILL;
  row.getCell("value").numFmt = MONEY_FMT;
  if (value2 !== undefined) row.getCell("value2").numFmt = MONEY_FMT;
  return row;
}

function sheetName(name: string) {
  return name.replace(/[[\]*/\\?:]/g, "").slice(0, 31) || "Sheet";
}

export function addBalanceSheet(
  workbook: ExcelJS.Workbook,
  dict: Dictionary,
  data?: FinanceData,
  secondData?: FinanceData,
  secondValueHeader?: string,
) {
  const sheet = workbook.addWorksheet(sheetName(dict.analyze.balanceSectionTitle));
  setupSheet(sheet, secondValueHeader);
  const subtotals = data ? computeSubtotals(data) : null;
  const subtotals2 = secondData ? computeSubtotals(secondData) : null;
  const hasSecond = secondValueHeader !== undefined;

  sectionRow(sheet, dict.financeFields.groups.longTermAssets);
  for (const key of fieldsOf("longTermAssets")) {
    fieldRow(
      sheet,
      key,
      dict.financeFields.labels[key],
      data ? data[key] : null,
      hasSecond ? (secondData ? secondData[key] : null) : undefined,
    );
  }
  totalRow(
    sheet,
    dict.financeFields.totals.longTermAssetsTotal,
    subtotals?.longTermAssetsTotal ?? null,
    hasSecond ? (subtotals2?.longTermAssetsTotal ?? null) : undefined,
  );

  sectionRow(sheet, dict.financeFields.groups.currentAssets);
  for (const key of fieldsOf("currentAssets")) {
    fieldRow(
      sheet,
      key,
      dict.financeFields.labels[key],
      data ? data[key] : null,
      hasSecond ? (secondData ? secondData[key] : null) : undefined,
    );
  }
  totalRow(
    sheet,
    dict.financeFields.totals.currentAssetsTotal,
    subtotals?.currentAssetsTotal ?? null,
    hasSecond ? (subtotals2?.currentAssetsTotal ?? null) : undefined,
  );
  totalRow(
    sheet,
    dict.financeFields.totals.totalAssets,
    subtotals?.totalAssets ?? null,
    hasSecond ? (subtotals2?.totalAssets ?? null) : undefined,
  );

  sheet.addRow({});

  sectionRow(sheet, dict.financeFields.groups.equity);
  for (const key of fieldsOf("equity")) {
    fieldRow(
      sheet,
      key,
      dict.financeFields.labels[key],
      data ? data[key] : null,
      hasSecond ? (secondData ? secondData[key] : null) : undefined,
    );
  }
  totalRow(
    sheet,
    dict.financeFields.totals.equityTotal,
    subtotals?.equityTotal ?? null,
    hasSecond ? (subtotals2?.equityTotal ?? null) : undefined,
  );

  sectionRow(sheet, dict.financeFields.groups.longTermLiabilities);
  for (const key of fieldsOf("longTermLiabilities")) {
    fieldRow(
      sheet,
      key,
      dict.financeFields.labels[key],
      data ? data[key] : null,
      hasSecond ? (secondData ? secondData[key] : null) : undefined,
    );
  }
  totalRow(
    sheet,
    dict.financeFields.totals.longTermLiabilitiesTotal,
    subtotals?.longTermLiabilitiesTotal ?? null,
    hasSecond ? (subtotals2?.longTermLiabilitiesTotal ?? null) : undefined,
  );

  sectionRow(sheet, dict.financeFields.groups.currentLiabilities);
  for (const key of fieldsOf("currentLiabilities")) {
    fieldRow(
      sheet,
      key,
      dict.financeFields.labels[key],
      data ? data[key] : null,
      hasSecond ? (secondData ? secondData[key] : null) : undefined,
    );
  }
  totalRow(
    sheet,
    dict.financeFields.totals.currentLiabilitiesTotal,
    subtotals?.currentLiabilitiesTotal ?? null,
    hasSecond ? (subtotals2?.currentLiabilitiesTotal ?? null) : undefined,
  );
  totalRow(
    sheet,
    dict.financeFields.totals.totalLiabilitiesAndEquity,
    subtotals?.totalLiabilitiesAndEquity ?? null,
    hasSecond ? (subtotals2?.totalLiabilitiesAndEquity ?? null) : undefined,
  );

  return sheet;
}

export function addPnlSheet(
  workbook: ExcelJS.Workbook,
  dict: Dictionary,
  data?: FinanceData,
  secondData?: FinanceData,
  secondValueHeader?: string,
) {
  const sheet = workbook.addWorksheet(sheetName(dict.analyze.pnlSectionTitle));
  setupSheet(sheet, secondValueHeader);
  const subtotals = data ? computeSubtotals(data) : null;
  const subtotals2 = secondData ? computeSubtotals(secondData) : null;
  const hasSecond = secondValueHeader !== undefined;

  for (const key of ["revenue", "costOfSales"] as const) {
    fieldRow(
      sheet,
      key,
      dict.financeFields.labels[key],
      data ? data[key] : null,
      hasSecond ? (secondData ? secondData[key] : null) : undefined,
    );
  }
  totalRow(
    sheet,
    dict.financeFields.totals.grossProfit,
    subtotals?.grossProfit ?? null,
    hasSecond ? (subtotals2?.grossProfit ?? null) : undefined,
  );

  for (const key of [
    "distributionCosts",
    "adminExpenses",
    "otherOperatingIncome",
    "otherOperatingExpenses",
  ] as const) {
    fieldRow(
      sheet,
      key,
      dict.financeFields.labels[key],
      data ? data[key] : null,
      hasSecond ? (secondData ? secondData[key] : null) : undefined,
    );
  }
  totalRow(
    sheet,
    dict.financeFields.totals.operatingProfit,
    subtotals?.operatingProfit ?? null,
    hasSecond ? (subtotals2?.operatingProfit ?? null) : undefined,
  );

  for (const key of ["financialIncome", "interestExpense"] as const) {
    fieldRow(
      sheet,
      key,
      dict.financeFields.labels[key],
      data ? data[key] : null,
      hasSecond ? (secondData ? secondData[key] : null) : undefined,
    );
  }
  totalRow(
    sheet,
    dict.financeFields.totals.profitBeforeTax,
    subtotals?.profitBeforeTax ?? null,
    hasSecond ? (subtotals2?.profitBeforeTax ?? null) : undefined,
  );

  fieldRow(
    sheet,
    "incomeTax",
    dict.financeFields.labels.incomeTax,
    data ? data.incomeTax : null,
    hasSecond ? (secondData ? secondData.incomeTax : null) : undefined,
  );
  totalRow(
    sheet,
    dict.financeFields.totals.netProfit,
    subtotals?.netProfit ?? null,
    hasSecond ? (subtotals2?.netProfit ?? null) : undefined,
  );

  return sheet;
}

export function addRatiosSheet(
  workbook: ExcelJS.Workbook,
  dict: Dictionary,
  ratios: FinancialRatios,
  industry: string,
  region: string,
  companyName?: string,
  year?: number,
) {
  const sheet = workbook.addWorksheet(sheetName("Показатели"));
  sheet.columns = [
    { header: "Показатель", key: "label", width: 40 },
    { header: "Значение", key: "value", width: 20 },
  ];
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = HEADER_FILL;

  if (companyName) sheet.addRow({ label: dict.analyze.companyNameLabel, value: companyName });
  if (year) sheet.addRow({ label: dict.analyze.reportingYearLabel, value: year });
  sheet.addRow({ label: dict.analyze.industryLabel, value: industry });
  sheet.addRow({ label: dict.analyze.regionLabel, value: region });
  sheet.addRow({});
  sheet.addRow({ label: dict.panel.outOf100, value: ratios.score });

  const rows: [string, number | null, "ratio" | "pct" | "money"][] = [
    [dict.panel.ratioRows.currentRatio, ratios.currentRatio, "ratio"],
    [dict.panel.ratioRows.quickRatio, ratios.quickRatio, "ratio"],
    [dict.panel.ratioRows.absoluteLiquidity, ratios.absoluteLiquidity, "ratio"],
    [dict.panel.ratioRows.roa, ratios.roa, "pct"],
    [dict.panel.ratioRows.roe, ratios.roe, "pct"],
    [dict.panel.ratioRows.ros, ratios.ros, "pct"],
    [dict.panel.ratioRows.grossMargin, ratios.grossMargin, "pct"],
    [dict.panel.ratioRows.operatingMargin, ratios.operatingMargin, "pct"],
    [dict.panel.ratioRows.autonomyRatio, ratios.autonomyRatio, "pct"],
    [dict.panel.ratioRows.debtRatio, ratios.debtRatio, "pct"],
    [dict.panel.ratioRows.assetTurnover, ratios.assetTurnover, "ratio"],
    [dict.panel.ratioRows.inventoryTurnover, ratios.inventoryTurnover, "ratio"],
    [dict.panel.ratioRows.interestCoverage, ratios.interestCoverage, "ratio"],
    [dict.panel.ratioRows.workingCapital, ratios.workingCapital, "money"],
  ];
  for (const [label, value, kind] of rows) {
    const row = sheet.addRow({ label, value });
    const cell = row.getCell("value");
    if (kind === "pct") cell.numFmt = "0.0%";
    else if (kind === "money") cell.numFmt = MONEY_FMT;
    else cell.numFmt = "0.00";
  }

  sheet.addRow({});
  const disclaimerRow = sheet.addRow({ label: dict.analyze.disclaimer });
  disclaimerRow.font = { italic: true, color: { argb: "FF64748B" } };
  sheet.mergeCells(`A${disclaimerRow.number}:B${disclaimerRow.number}`);
  disclaimerRow.getCell("label").alignment = { wrapText: true };

  return sheet;
}

export function addAdviceSheet(workbook: ExcelJS.Workbook, dict: Dictionary, advice: AiAdvice | null) {
  if (!advice) return;
  const title = advice.source === "ai" ? dict.panel.aiAnalysis : dict.panel.expressRecommendations;
  const sheet = workbook.addWorksheet(sheetName(title));
  sheet.columns = [{ header: "", key: "text", width: 100 }];
  sheet.getColumn("text").alignment = { wrapText: true, vertical: "top" };

  sheet.addRow({ text: advice.summary });
  sheet.addRow({ text: advice.score_comment });
  sheet.addRow({});

  if (advice.red_flags.length > 0) {
    sheet.addRow({ text: dict.panel.redFlags }).font = { bold: true };
    for (const f of advice.red_flags) {
      sheet.addRow({ text: `${f.indicator}: ${f.value} — ${f.why_critical}` });
    }
    sheet.addRow({});
  }

  if (advice.strengths.length > 0) {
    sheet.addRow({ text: dict.panel.strengths }).font = { bold: true };
    for (const s of advice.strengths) sheet.addRow({ text: s });
    sheet.addRow({});
  }

  if (advice.weaknesses.length > 0) {
    sheet.addRow({ text: dict.panel.weaknesses }).font = { bold: true };
    for (const s of advice.weaknesses) sheet.addRow({ text: s });
    sheet.addRow({});
  }

  sheet.addRow({ text: dict.panel.whatToDo }).font = { bold: true };
  for (const r of advice.recommendations) {
    sheet.addRow({ text: `${r.title}: ${r.description} (${dict.panel.effectPrefix}${r.expected_effect})` });
  }
  sheet.addRow({});

  sheet.addRow({ text: dict.panel.marginBridgeHeading }).font = { bold: true };
  sheet.addRow({ text: advice.margin_commentary });
  sheet.addRow({});

  sheet.addRow({ text: dict.panel.frozenAssetsHeading }).font = { bold: true };
  sheet.addRow({ text: advice.frozen_assets_commentary });
  sheet.addRow({});

  sheet.addRow({ text: dict.panel.safetyMarginHeading }).font = { bold: true };
  sheet.addRow({ text: advice.safety_margin_commentary });
  sheet.addRow({});

  sheet.addRow({ text: dict.panel.benchmarkHeading }).font = { bold: true };
  if (advice.benchmark.available && advice.benchmark.comparisons.length > 0) {
    for (const c of advice.benchmark.comparisons) {
      sheet.addRow({
        text: `${c.metric}: ${c.company_value} / ${c.benchmark_value} (${dict.panel.benchmarkSourceLabel} ${c.source})`,
      });
    }
  }
  sheet.addRow({ text: advice.benchmark.note || dict.panel.benchmarkUnavailable });
  sheet.addRow({});

  sheet.addRow({ text: dict.panel.financingHeading }).font = { bold: true };
  sheet.addRow({ text: advice.financing_advice });
}
