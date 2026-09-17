"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/i18n/provider";
import type { FinanceSubtotals } from "@/lib/finance/aggregate";
import { computeVariance } from "@/lib/finance/variance";
import type { FinanceData, FinancialRatios } from "@/lib/finance/types";
import { formatMoney, formatPct, formatRatio } from "@/lib/utils";

// Та же провалидированная палитра (skill dataviz), что уже используется для
// «регион × два года» на главной странице (components/finance/stat-uz-charts.tsx,
// ComparisonChart) — переиспользуем без изменений и повторной валидации.
const PRIMARY = "#3987e5";
const SECONDARY = "#d95926";
const GRID = "#24343c";
const AXIS_TEXT = "#8fa09a";

function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const exp = Math.floor(Math.log10(value));
  const base = value / 10 ** exp;
  const niceBase = base <= 1 ? 1 : base <= 2 ? 2 : base <= 5 ? 5 : 10;
  return niceBase * 10 ** exp;
}

type BarRow = { name: string; first: number; second: number };

// Столбцы с общим нулевым уровнем: значение может быть отрицательным (например,
// чистая прибыль в убыточном периоде) — столбец в этом случае рисуется вниз от
// нулевой линии, а не «как положительный», чтобы диаграмма не вводила в
// заблуждение.
function GroupedBarChart({
  title,
  rows,
  formatValue,
  period1Label,
  period2Label,
  labels,
}: {
  title: string;
  rows: BarRow[];
  formatValue: (n: number) => string;
  period1Label: string;
  period2Label: string;
  labels: { showTable: string; hideTable: string; metricHeader: string; valueHeader: string };
}) {
  const [showTable, setShowTable] = useState(false);
  if (rows.length === 0) return null;

  const groupWidth = 108;
  const padding = { top: 24, right: 16, bottom: 74, left: 64 };
  const innerH = 220;
  const width = padding.left + padding.right + rows.length * groupWidth;
  const height = padding.top + innerH + padding.bottom;

  const maxAbs = Math.max(1, ...rows.flatMap((r) => [Math.abs(r.first), Math.abs(r.second)]));
  const hasNeg = rows.some((r) => r.first < 0 || r.second < 0);
  const scaleMax = niceCeil(maxAbs * 1.15);
  const yMin = hasNeg ? -scaleMax : 0;
  const yRange = scaleMax - yMin;
  const yFor = (v: number) => padding.top + innerH - ((v - yMin) / yRange) * innerH;
  const zeroY = yFor(0);

  const tickCount = 4;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => yMin + (yRange / tickCount) * i);

  const barW = 28;
  const gap = 8;

  return (
    <Card>
      <h4 className="font-display text-lg">{title}</h4>
      <div className="mt-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          className="max-w-none"
          style={{ minWidth: "100%" }}
          role="img"
          aria-label={title}
        >
          {ticks.map((t, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={yFor(t)}
                y2={yFor(t)}
                stroke={GRID}
                strokeWidth={1}
              />
              <text x={padding.left - 8} y={yFor(t) + 4} textAnchor="end" fontSize="10" fill={AXIS_TEXT}>
                {formatValue(t)}
              </text>
            </g>
          ))}
          {hasNeg ? (
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={zeroY}
              y2={zeroY}
              stroke="#3a4a52"
              strokeWidth={1.4}
            />
          ) : null}

          {rows.map((row, i) => {
            const cx = padding.left + i * groupWidth + groupWidth / 2;
            const x1 = cx - gap / 2 - barW;
            const x2 = cx + gap / 2;
            const y1top = yFor(Math.max(row.first, 0));
            const y1bottom = yFor(Math.min(row.first, 0));
            const y2top = yFor(Math.max(row.second, 0));
            const y2bottom = yFor(Math.min(row.second, 0));
            const labelY = height - padding.bottom + 16;
            return (
              <g key={row.name}>
                <rect x={x1} y={y1top} width={barW} height={Math.max(1, y1bottom - y1top)} rx={3} fill={PRIMARY} />
                <rect x={x2} y={y2top} width={barW} height={Math.max(1, y2bottom - y2top)} rx={3} fill={SECONDARY} />
                <text
                  x={cx}
                  y={labelY}
                  textAnchor="end"
                  fontSize="10.5"
                  fill={AXIS_TEXT}
                  transform={`rotate(-28 ${cx} ${labelY})`}
                >
                  {row.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: PRIMARY }} />
          {period1Label}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: SECONDARY }} />
          {period2Label}
        </span>
      </div>

      <button type="button" onClick={() => setShowTable((s) => !s)} className="mt-3 text-xs text-primary hover:underline">
        {showTable ? labels.hideTable : labels.showTable}
      </button>
      {showTable ? (
        <div className="mt-2 max-h-56 overflow-auto rounded-lg bg-raised">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-raised text-muted">
              <tr>
                <th className="px-2 py-1.5 text-left">{labels.metricHeader}</th>
                <th className="px-2 py-1.5 text-right">{period1Label}</th>
                <th className="px-2 py-1.5 text-right">{period2Label}</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {rows.map((row) => (
                <tr key={row.name} className="border-t border-line/60">
                  <td className="px-2 py-1">{row.name}</td>
                  <td className="px-2 py-1 text-right text-fg">{formatValue(row.first)}</td>
                  <td className="px-2 py-1 text-right text-fg">{formatValue(row.second)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </Card>
  );
}

type PeriodInput = {
  year: number;
  data: FinanceData;
  subtotals: FinanceSubtotals;
  ratios: FinancialRatios;
};

// Коэффициенты, сгруппированные по единице измерения — проценты и «разы»
// (кратные/обороты) не смешиваются в одной диаграмме с общей осью (см. skill
// dataviz: «один axis», единицы должны совпадать для сравнимых столбцов).
const PERCENT_RATIO_KEYS = ["roa", "roe", "ros", "grossMargin", "operatingMargin", "autonomyRatio", "debtRatio"] as const;
const TIMES_RATIO_KEYS = [
  "currentRatio",
  "quickRatio",
  "absoluteLiquidity",
  "assetTurnover",
  "inventoryTurnover",
  "interestCoverage",
] as const;

export function VarianceDashboard({
  period1,
  period2,
  narrative,
}: {
  period1: PeriodInput;
  period2: PeriodInput;
  narrative?: string;
}) {
  const { dict, locale } = useI18n();
  const vd = dict.varianceDashboard;
  const ratioLabels = dict.panel.ratioRows;
  const totalsLabels = dict.financeFields.totals;
  const fieldLabels = dict.financeFields.labels;

  const period1Label = dict.analyze.periodLabel.replace("{n}", `1 · ${period1.year}`);
  const period2Label = dict.analyze.periodLabel.replace("{n}", `2 · ${period2.year}`);

  const variance = computeVariance(period1.ratios, period2.ratios);

  const percentRows: BarRow[] = PERCENT_RATIO_KEYS.map((key) => ({
    name: ratioLabels[key],
    first: period1.ratios[key] ?? 0,
    second: period2.ratios[key] ?? 0,
  }));

  const timesRows: BarRow[] = TIMES_RATIO_KEYS.map((key) => ({
    name: ratioLabels[key],
    first: period1.ratios[key] ?? 0,
    second: period2.ratios[key] ?? 0,
  }));

  const balanceRows: BarRow[] = [
    {
      name: totalsLabels.longTermAssetsTotal,
      first: period1.subtotals.longTermAssetsTotal,
      second: period2.subtotals.longTermAssetsTotal,
    },
    {
      name: totalsLabels.currentAssetsTotal,
      first: period1.subtotals.currentAssetsTotal,
      second: period2.subtotals.currentAssetsTotal,
    },
    { name: totalsLabels.totalAssets, first: period1.subtotals.totalAssets, second: period2.subtotals.totalAssets },
    { name: totalsLabels.equityTotal, first: period1.subtotals.equityTotal, second: period2.subtotals.equityTotal },
    {
      name: totalsLabels.longTermLiabilitiesTotal,
      first: period1.subtotals.longTermLiabilitiesTotal,
      second: period2.subtotals.longTermLiabilitiesTotal,
    },
    {
      name: totalsLabels.currentLiabilitiesTotal,
      first: period1.subtotals.currentLiabilitiesTotal,
      second: period2.subtotals.currentLiabilitiesTotal,
    },
    {
      name: totalsLabels.totalLiabilitiesAndEquity,
      first: period1.subtotals.totalLiabilitiesAndEquity,
      second: period2.subtotals.totalLiabilitiesAndEquity,
    },
  ];

  const pnlRows: BarRow[] = [
    { name: fieldLabels.revenue, first: period1.data.revenue, second: period2.data.revenue },
    { name: fieldLabels.costOfSales, first: period1.data.costOfSales, second: period2.data.costOfSales },
    { name: totalsLabels.grossProfit, first: period1.subtotals.grossProfit, second: period2.subtotals.grossProfit },
    {
      name: totalsLabels.operatingProfit,
      first: period1.subtotals.operatingProfit,
      second: period2.subtotals.operatingProfit,
    },
    {
      name: totalsLabels.profitBeforeTax,
      first: period1.subtotals.profitBeforeTax,
      second: period2.subtotals.profitBeforeTax,
    },
    { name: totalsLabels.netProfit, first: period1.subtotals.netProfit, second: period2.subtotals.netProfit },
  ];

  const workingCapital1 = period1.subtotals.currentAssetsTotal - period1.subtotals.currentLiabilitiesTotal;
  const workingCapital2 = period2.subtotals.currentAssetsTotal - period2.subtotals.currentLiabilitiesTotal;
  const workingCapitalDelta = workingCapital2 - workingCapital1;
  const workingCapitalColor =
    workingCapitalDelta > 0 ? "text-ok" : workingCapitalDelta < 0 ? "text-danger" : "text-muted";

  const scoreDeltaColor = variance.scoreDelta > 0 ? "text-ok" : variance.scoreDelta < 0 ? "text-danger" : "text-muted";
  const currentRatioDelta = (period2.ratios.currentRatio ?? 0) - (period1.ratios.currentRatio ?? 0);
  const currentRatioColor = currentRatioDelta > 0 ? "text-ok" : currentRatioDelta < 0 ? "text-danger" : "text-muted";

  return (
    <div className="mt-8 space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-muted">{vd.scoreDeltaLabel}</p>
          <p className={`mt-2 font-display text-3xl ${scoreDeltaColor}`}>
            {variance.scoreDelta > 0 ? "+" : ""}
            {variance.scoreDelta.toFixed(0)}
          </p>
          <p className="mt-1 text-xs text-muted">
            {period1.ratios.score.toFixed(0)} → {period2.ratios.score.toFixed(0)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-muted">{ratioLabels.currentRatio}</p>
          <p className={`mt-2 font-display text-3xl ${currentRatioColor}`}>
            {formatRatio(period1.ratios.currentRatio)} → {formatRatio(period2.ratios.currentRatio)}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-muted">{ratioLabels.workingCapital}</p>
          <p className={`mt-2 font-display text-3xl ${workingCapitalColor}`}>
            {formatMoney(workingCapital1, locale)} → {formatMoney(workingCapital2, locale)}
          </p>
        </Card>
      </div>

      <GroupedBarChart
        title={vd.ratiosChartTitle}
        rows={percentRows}
        formatValue={(n) => formatPct(n)}
        period1Label={period1Label}
        period2Label={period2Label}
        labels={vd}
      />

      <GroupedBarChart
        title={vd.ratiosTimesChartTitle}
        rows={timesRows}
        formatValue={(n) => formatRatio(n)}
        period1Label={period1Label}
        period2Label={period2Label}
        labels={vd}
      />

      <GroupedBarChart
        title={vd.balanceChartTitle}
        rows={balanceRows}
        formatValue={(n) => formatMoney(n, locale)}
        period1Label={period1Label}
        period2Label={period2Label}
        labels={vd}
      />

      <GroupedBarChart
        title={vd.pnlChartTitle}
        rows={pnlRows}
        formatValue={(n) => formatMoney(n, locale)}
        period1Label={period1Label}
        period2Label={period2Label}
        labels={vd}
      />

      {narrative ? (
        <Card>
          <h4 className="font-display text-lg">{vd.narrativeHeading}</h4>
          <p className="mt-2 text-sm leading-relaxed text-muted">{narrative}</p>
        </Card>
      ) : null}
    </div>
  );
}
