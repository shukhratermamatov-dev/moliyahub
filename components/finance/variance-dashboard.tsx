"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/i18n/provider";
import { computeVariance, VARIANCE_RATIO_KEYS } from "@/lib/finance/variance";
import type { FinancialRatios, MinimalFinanceData } from "@/lib/finance/types";
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

  const groupWidth = 96;
  const padding = { top: 24, right: 16, bottom: 56, left: 64 };
  const innerH = 220;
  const width = padding.left + padding.right + rows.length * groupWidth;
  const height = padding.top + innerH + padding.bottom;

  const maxAbs = Math.max(1, ...rows.flatMap((r) => [Math.abs(r.first), Math.abs(r.second)]));
  const niceMax = niceCeil(maxAbs * 1.15);
  const tickCount = 4;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (niceMax / tickCount) * i);

  const barH = (v: number) => (Math.abs(v) / niceMax) * innerH;
  const yBase = padding.top + innerH;
  const barW = 26;
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
                y1={yBase - barH(t)}
                y2={yBase - barH(t)}
                stroke={GRID}
                strokeWidth={1}
              />
              <text x={padding.left - 8} y={yBase - barH(t) + 4} textAnchor="end" fontSize="10" fill={AXIS_TEXT}>
                {formatValue(t)}
              </text>
            </g>
          ))}

          {rows.map((row, i) => {
            const cx = padding.left + i * groupWidth + groupWidth / 2;
            const x1 = cx - gap / 2 - barW;
            const x2 = cx + gap / 2;
            const h1 = barH(row.first);
            const h2 = barH(row.second);
            return (
              <g key={row.name}>
                <rect x={x1} y={yBase - h1} width={barW} height={h1} rx={3} fill={PRIMARY} />
                <rect x={x2} y={yBase - h2} width={barW} height={h2} rx={3} fill={SECONDARY} />
                <text x={cx} y={yBase + 16} textAnchor="middle" fontSize="10" fill={AXIS_TEXT}>
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

export function VarianceDashboard({
  period1,
  period2,
  narrative,
}: {
  period1: { year: number; ratios: FinancialRatios; aggregates: MinimalFinanceData };
  period2: { year: number; ratios: FinancialRatios; aggregates: MinimalFinanceData };
  narrative?: string;
}) {
  const { dict, locale } = useI18n();
  const vd = dict.varianceDashboard;
  const ratioLabels = dict.panel.ratioRows;
  const totalsLabels = dict.financeFields.totals;

  const period1Label = dict.analyze.periodLabel.replace("{n}", `1 · ${period1.year}`);
  const period2Label = dict.analyze.periodLabel.replace("{n}", `2 · ${period2.year}`);

  const variance = computeVariance(period1.ratios, period2.ratios);

  const pctRows: BarRow[] = (["roa", "roe", "autonomyRatio", "debtRatio"] as const)
    .filter((key) => VARIANCE_RATIO_KEYS.includes(key))
    .map((key) => ({
      name: ratioLabels[key],
      first: period1.ratios[key] ?? 0,
      second: period2.ratios[key] ?? 0,
    }));

  const balanceRows: BarRow[] = [
    { name: totalsLabels.totalAssets, first: period1.aggregates.totalAssets, second: period2.aggregates.totalAssets },
    { name: totalsLabels.equityTotal, first: period1.aggregates.equity, second: period2.aggregates.equity },
    {
      name: totalsLabels.currentAssetsTotal,
      first: period1.aggregates.currentAssets,
      second: period2.aggregates.currentAssets,
    },
    {
      name: totalsLabels.currentLiabilitiesTotal,
      first: period1.aggregates.currentLiabilities,
      second: period2.aggregates.currentLiabilities,
    },
  ];

  const scoreDeltaColor = variance.scoreDelta > 0 ? "text-ok" : variance.scoreDelta < 0 ? "text-danger" : "text-muted";
  const currentRatioDelta = (period2.ratios.currentRatio ?? 0) - (period1.ratios.currentRatio ?? 0);
  const currentRatioColor = currentRatioDelta > 0 ? "text-ok" : currentRatioDelta < 0 ? "text-danger" : "text-muted";

  return (
    <div className="mt-8 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>

      <GroupedBarChart
        title={vd.ratiosChartTitle}
        rows={pctRows}
        formatValue={(n) => formatPct(n)}
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

      {narrative ? (
        <Card>
          <h4 className="font-display text-lg">{vd.narrativeHeading}</h4>
          <p className="mt-2 text-sm leading-relaxed text-muted">{narrative}</p>
        </Card>
      ) : null}
    </div>
  );
}
