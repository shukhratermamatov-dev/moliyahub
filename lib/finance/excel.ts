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

function setupSheet(sheet: ExcelJS.Worksheet) {
  sheet.columns = [
    { header: "Код", key: "code", width: 24 },
    { header: "Статья", key: "label", width: 55 },
    { header: "Сумма, сум", key: "value", width: 20 },
  ];
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

function fieldRow(sheet: ExcelJS.Worksheet, code: string, label: string, value: number | null) {
  const row = sheet.addRow({ code, label, value });
  row.getCell("value").numFmt = MONEY_FMT;
  return row;
}

function totalRow(sheet: ExcelJS.Worksheet, label: string, value: number | null) {
  const row = sheet.addRow({ code: "", label, value });
  row.font = { bold: true, italic: true };
  row.fill = TOTAL_FILL;
  row.getCell("value").numFmt = MONEY_FMT;
  return row;
}

function sheetName(name: string) {
  return name.replace(/[[\]*/\\?:]/g, "").slice(0, 31) || "Sheet";
}

export function addBalanceSheet(workbook: ExcelJS.Workbook, dict: Dictionary, data?: FinanceData) {
  const sheet = workbook.addWorksheet(sheetName(dict.analyze.balanceSectionTitle));
  setupSheet(sheet);
  const subtotals = data ? computeSubtotals(data) : null;

  sectionRow(sheet, dict.financeFields.groups.longTermAssets);
  for (const key of fieldsOf("longTermAssets")) {
    fieldRow(sheet, key, dict.financeFields.labels[key], data ? data[key] : null);
  }
  totalRow(sheet, dict.financeFields.totals.longTermAssetsTotal, subtotals?.longTermAssetsTotal ?? null);

  sectionRow(sheet, dict.financeFields.groups.currentAssets);
  for (const key of fieldsOf("currentAssets")) {
    fieldRow(sheet, key, dict.financeFields.labels[key], data ? data[key] : null);
  }
  totalRow(sheet, dict.financeFields.totals.currentAssetsTotal, subtotals?.currentAssetsTotal ?? null);
  totalRow(sheet, dict.financeFields.totals.totalAssets, subtotals?.totalAssets ?? null);

  sheet.addRow({});

  sectionRow(sheet, dict.financeFields.groups.equity);
  for (const key of fieldsOf("equity")) {
    fieldRow(sheet, key, dict.financeFields.labels[key], data ? data[key] : null);
  }
  totalRow(sheet, dict.financeFields.totals.equityTotal, subtotals?.equityTotal ?? null);

  sectionRow(sheet, dict.financeFields.groups.longTermLiabilities);
  for (const key of fieldsOf("longTermLiabilities")) {
    fieldRow(sheet, key, dict.financeFields.labels[key], data ? data[key] : null);
  }
  totalRow(sheet, dict.financeFields.totals.longTermLiabilitiesTotal, subtotals?.longTermLiabilitiesTotal ?? null);

  sectionRow(sheet, dict.financeFields.groups.currentLiabilities);
  for (const key of fieldsOf("currentLiabilities")) {
    fieldRow(sheet, key, dict.financeFields.labels[key], data ? data[key] : null);
  }
  totalRow(sheet, dict.financeFields.totals.currentLiabilitiesTotal, subtotals?.currentLiabilitiesTotal ?? null);
  totalRow(sheet, dict.financeFields.totals.totalLiabilitiesAndEquity, subtotals?.totalLiabilitiesAndEquity ?? null);

  return sheet;
}

export function addPnlSheet(workbook: ExcelJS.Workbook, dict: Dictionary, data?: FinanceData) {
  const sheet = workbook.addWorksheet(sheetName(dict.analyze.pnlSectionTitle));
  setupSheet(sheet);
  const subtotals = data ? computeSubtotals(data) : null;

  for (const key of ["revenue", "costOfSales"] as const) {
    fieldRow(sheet, key, dict.financeFields.labels[key], data ? data[key] : null);
  }
  totalRow(sheet, dict.financeFields.totals.grossProfit, subtotals?.grossProfit ?? null);

  for (const key of [
    "distributionCosts",
    "adminExpenses",
    "otherOperatingIncome",
    "otherOperatingExpenses",
  ] as const) {
    fieldRow(sheet, key, dict.financeFields.labels[key], data ? data[key] : null);
  }
  totalRow(sheet, dict.financeFields.totals.operatingProfit, subtotals?.operatingProfit ?? null);

  for (const key of ["financialIncome", "interestExpense"] as const) {
    fieldRow(sheet, key, dict.financeFields.labels[key], data ? data[key] : null);
  }
  totalRow(sheet, dict.financeFields.totals.profitBeforeTax, subtotals?.profitBeforeTax ?? null);

  fieldRow(sheet, "incomeTax", dict.financeFields.labels.incomeTax, data ? data.incomeTax : null);
  totalRow(sheet, dict.financeFields.totals.netProfit, subtotals?.netProfit ?? null);

  return sheet;
}

export function addRatiosSheet(
  workbook: ExcelJS.Workbook,
  dict: Dictionary,
  ratios: FinancialRatios,
  industry: string,
  region: string,
) {
  const sheet = workbook.addWorksheet(sheetName("Показатели"));
  sheet.columns = [
    { header: "Показатель", key: "label", width: 40 },
    { header: "Значение", key: "value", width: 20 },
  ];
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = HEADER_FILL;

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

  sheet.addRow({ text: dict.panel.whatToDo }).font = { bold: true };
  for (const r of advice.recommendations) {
    sheet.addRow({ text: `${r.title}: ${r.description} (${dict.panel.effectPrefix}${r.expected_effect})` });
  }
  sheet.addRow({});

  sheet.addRow({ text: dict.panel.financingHeading }).font = { bold: true };
  sheet.addRow({ text: advice.financing_advice });
}
