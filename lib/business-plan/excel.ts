import ExcelJS from "exceljs";
import type { BusinessPlan } from "./types";

// Стили в духе существующего экспорта финансового анализа
// (lib/finance/excel.ts) — тот же тёмно-зелёный заголовок и формат сумм.
const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF14532D" } };
const SECTION_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
const TOTAL_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
const MONEY_FMT = "#,##0";

function sheetName(name: string) {
  return name.replace(/[[\]*/\\?:]/g, "").slice(0, 31) || "Sheet";
}

function textSheet(workbook: ExcelJS.Workbook, title: string, blocks: { heading: string; body: string }[]) {
  const sheet = workbook.addWorksheet(sheetName(title));
  sheet.columns = [{ width: 100 }];
  const titleRow = sheet.addRow([title]);
  titleRow.font = { bold: true, size: 14 };
  sheet.addRow([]);
  for (const { heading, body } of blocks) {
    if (!body) continue;
    const h = sheet.addRow([heading]);
    h.font = { bold: true, color: { argb: "FF14532D" } };
    const b = sheet.addRow([body]);
    b.alignment = { wrapText: true, vertical: "top" };
    b.height = Math.max(30, Math.ceil(body.length / 110) * 15);
    sheet.addRow([]);
  }
  return sheet;
}

export function buildBusinessPlanWorkbook(plan: BusinessPlan): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MoliyaHub";
  workbook.created = new Date();

  // Лист 1: Резюме проекта.
  const summarySheet = workbook.addWorksheet(sheetName("Резюме"));
  summarySheet.columns = [{ width: 28 }, { width: 90 }];
  const infoRows: [string, string][] = [
    ["Проект", plan.projectName],
    ["Отрасль", plan.subIndustryLabel ? `${plan.industryLabel} · ${plan.subIndustryLabel}` : plan.industryLabel],
    ["Регион", plan.region || "—"],
    ["Идея проекта", plan.idea],
    ["Дата формирования", new Date(plan.generatedAt).toLocaleDateString("ru-RU")],
  ];
  for (const [label, value] of infoRows) {
    const row = summarySheet.addRow([label, value]);
    row.getCell(1).font = { bold: true };
    row.getCell(2).alignment = { wrapText: true, vertical: "top" };
  }
  summarySheet.addRow([]);
  const summaryHeading = summarySheet.addRow(["Резюме проекта"]);
  summaryHeading.font = { bold: true, size: 13, color: { argb: "FF14532D" } };
  const summaryBody = summarySheet.addRow(["", plan.executiveSummary]);
  summaryBody.getCell(2).alignment = { wrapText: true, vertical: "top" };
  summarySheet.addRow([]);
  const companyHeading = summarySheet.addRow(["Описание компании / проекта"]);
  companyHeading.font = { bold: true, size: 13, color: { argb: "FF14532D" } };
  const companyBody = summarySheet.addRow(["", plan.companyDescription]);
  companyBody.getCell(2).alignment = { wrapText: true, vertical: "top" };

  // Лист 2: Анализ рынка (Узбекистан + зарубежные рынки).
  textSheet(workbook, "Анализ рынка", [
    { heading: "Рынок Узбекистана", body: plan.marketAnalysisUzbekistan },
    ...plan.marketAnalysisForeign.map((m) => ({ heading: `Зарубежный рынок: ${m.country}`, body: m.body })),
  ]);

  // Лист 3: Маркетинг, операции, организация, риски.
  textSheet(workbook, "План и риски", [
    { heading: "Маркетинг и продажи", body: plan.marketing },
    { heading: "Операционный план", body: plan.operations },
    { heading: "Организационный план", body: plan.organization },
    { heading: "Риски", body: plan.risks },
  ]);

  // Лист 4: Финансовый план — с формулами.
  const finSheet = workbook.addWorksheet(sheetName("Финансовый план"));
  finSheet.columns = [
    { header: "Статья", key: "label", width: 45 },
    { header: "Сумма, сум", key: "amount", width: 20 },
    { header: "Комментарий", key: "note", width: 45 },
  ];
  const finHeader = finSheet.getRow(1);
  finHeader.font = { bold: true, color: { argb: "FFFFFFFF" } };
  finHeader.fill = HEADER_FILL;

  const disclaimerRow = finSheet.addRow(["Финансовые оценки — прогноз ИИ под указанную сумму инвестиций и идею проекта, не проверенные рыночные данные. Перед использованием скорректируйте под реальные цены и условия.", null, null]);
  disclaimerRow.font = { italic: true, color: { argb: "FF64748B" } };
  finSheet.mergeCells(disclaimerRow.number, 1, disclaimerRow.number, 3);
  disclaimerRow.alignment = { wrapText: true };
  disclaimerRow.height = 30;
  finSheet.addRow([]);

  const initInvRow = finSheet.addRow(["Начальные инвестиции", plan.financials.initialInvestment, null]);
  initInvRow.font = { bold: true };
  initInvRow.getCell(2).numFmt = MONEY_FMT;
  finSheet.addRow([]);

  function costBlock(heading: string, lines: { label: string; amount: number; note?: string }[]): number {
    const h = finSheet.addRow([heading, null, null]);
    h.font = { bold: true };
    h.fill = SECTION_FILL;
    const firstDataRow = finSheet.rowCount + 1;
    for (const line of lines) {
      const row = finSheet.addRow([line.label, line.amount, line.note ?? ""]);
      row.getCell(2).numFmt = MONEY_FMT;
    }
    const lastDataRow = finSheet.rowCount;
    const totalRow = finSheet.addRow([
      `Итого: ${heading.toLowerCase()}`,
      lines.length > 0 ? { formula: `SUM(B${firstDataRow}:B${lastDataRow})` } : 0,
      null,
    ]);
    totalRow.font = { bold: true, italic: true };
    totalRow.fill = TOTAL_FILL;
    totalRow.getCell(2).numFmt = MONEY_FMT;
    finSheet.addRow([]);
    return totalRow.number;
  }

  const startupTotalRow = costBlock("Стартовые затраты (единоразово)", plan.financials.startupCosts);
  const revenueTotalRow = costBlock("Ежемесячная выручка", plan.financials.monthlyRevenue);
  const costsTotalRow = costBlock("Ежемесячные операционные расходы", plan.financials.monthlyCosts);

  const profitRow = finSheet.addRow([
    "Ежемесячная прибыль (оценка)",
    { formula: `B${revenueTotalRow}-B${costsTotalRow}` },
    null,
  ]);
  profitRow.font = { bold: true };
  profitRow.getCell(2).numFmt = MONEY_FMT;
  finSheet.addRow([]);

  const breakEvenRow = finSheet.addRow(["Срок выхода на окупаемость, мес. (оценка ИИ)", plan.financials.breakEvenMonths, null]);
  breakEvenRow.font = { bold: true };
  const paybackRow = finSheet.addRow(["Срок возврата инвестиций, мес. (оценка ИИ)", plan.financials.paybackMonths, null]);
  paybackRow.font = { bold: true };
  finSheet.addRow([]);

  const assumptionsHeading = finSheet.addRow(["Допущения расчёта", null, null]);
  assumptionsHeading.font = { bold: true, color: { argb: "FF14532D" } };
  const assumptionsRow = finSheet.addRow([plan.financials.assumptions, null, null]);
  finSheet.mergeCells(assumptionsRow.number, 1, assumptionsRow.number, 3);
  assumptionsRow.alignment = { wrapText: true, vertical: "top" };
  assumptionsRow.height = 45;

  void startupTotalRow;

  // Лист 5: Источники (веб-поиск).
  if (plan.sources.length > 0) {
    const srcSheet = workbook.addWorksheet(sheetName("Источники"));
    srcSheet.columns = [
      { header: "Источник", key: "title", width: 55 },
      { header: "Ссылка", key: "url", width: 70 },
    ];
    const srcHeader = srcSheet.getRow(1);
    srcHeader.font = { bold: true, color: { argb: "FFFFFFFF" } };
    srcHeader.fill = HEADER_FILL;
    for (const s of plan.sources) {
      const row = srcSheet.addRow([s.title, s.url]);
      row.getCell(2).font = { color: { argb: "FF1D4ED8" }, underline: true };
    }
  }

  return workbook;
}
