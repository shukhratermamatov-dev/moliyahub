"use client";

import { useEffect, useState } from "react";
import type { StatUzIndicator, StatUzIndicatorKey, StatUzRegion } from "@/app/api/stat-uz/route";
import { useI18n } from "@/i18n/provider";
import type { Locale } from "@/i18n/config";

// Фиксированная пара цветов для «год 1 / год 2» на диаграмме сравнения и для
// единственного ряда на диаграмме динамики / рейтинга — те же провалидированные
// значения, что и раньше (node scripts/validate_palette.js на фоне #081018,
// см. skill dataviz): все проверки (яркость/хрома/CVD/контраст) пройдены.
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

function formatNumber(n: number): string {
  return Math.round(n).toLocaleString("ru-RU");
}

function fillTemplate(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

function regionName(region: StatUzRegion, locale: Locale): string {
  return region.name[locale] || region.name.ru;
}

type CommonLabels = {
  yearHeader: string;
  regionHeader: string;
  valueHeader: string;
  showTable: string;
  hideTable: string;
};

function TableToggle({
  show,
  onToggle,
  labels,
  children,
}: {
  show: boolean;
  onToggle: () => void;
  labels: Pick<CommonLabels, "showTable" | "hideTable">;
  children: React.ReactNode;
}) {
  return (
    <>
      <button type="button" onClick={onToggle} className="mt-3 text-xs text-primary hover:underline">
        {show ? labels.hideTable : labels.showTable}
      </button>
      {show ? <div className="mt-2 max-h-56 overflow-auto rounded-lg bg-raised">{children}</div> : null}
    </>
  );
}

// 1. Линия динамики показателя по Республике Узбекистан в целом, со значением,
// подписанным прямо у каждой точки — как на скриншоте пользователя (данные
// должны читаться без наведения мышью).
function DynamicsChart({
  years,
  values,
  title,
  labels,
}: {
  years: number[];
  values: number[];
  title: string;
  labels: CommonLabels;
}) {
  const [showTable, setShowTable] = useState(false);

  const width = 640;
  const height = 280;
  const padding = { top: 32, right: 24, bottom: 32, left: 64 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const maxValue = Math.max(1, ...values);
  const niceMax = niceCeil(maxValue * 1.15);
  const tickCount = 4;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (niceMax / tickCount) * i);

  const xAt = (i: number) =>
    padding.left + (years.length === 1 ? innerW / 2 : (i * innerW) / (years.length - 1));
  const yAt = (v: number) => padding.top + innerH - (v / niceMax) * innerH;

  const linePath = values.map((v, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)}`).join(" ");

  return (
    <div className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]">
      <h4 className="font-display text-lg">{title}</h4>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 w-full" role="img" aria-label={title}>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={padding.left} x2={width - padding.right} y1={yAt(t)} y2={yAt(t)} stroke={GRID} strokeWidth={1} />
            <text x={padding.left - 8} y={yAt(t) + 4} textAnchor="end" fontSize="10" fill={AXIS_TEXT}>
              {formatNumber(t)}
            </text>
          </g>
        ))}

        {years.map((year, i) => (
          <text key={year} x={xAt(i)} y={height - 10} textAnchor="middle" fontSize="10" fill={AXIS_TEXT}>
            {year}
          </text>
        ))}

        <path d={linePath} fill="none" stroke={PRIMARY} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {values.map((v, i) => (
          <g key={i}>
            <circle cx={xAt(i)} cy={yAt(v)} r={4} fill={PRIMARY} stroke="#111b22" strokeWidth={2} />
            <text
              x={xAt(i)}
              y={yAt(v) - 12}
              textAnchor="middle"
              fontSize="11"
              className="fill-fg"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {formatNumber(v)}
            </text>
          </g>
        ))}
      </svg>

      <TableToggle show={showTable} onToggle={() => setShowTable((s) => !s)} labels={labels}>
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-raised text-muted">
            <tr>
              <th className="px-2 py-1.5 text-left">{labels.yearHeader}</th>
              <th className="px-2 py-1.5 text-right">{labels.valueHeader}</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {years.map((year, i) => (
              <tr key={year} className="border-t border-line/60">
                <td className="px-2 py-1">{year}</td>
                <td className="px-2 py-1 text-right text-fg">{formatNumber(values[i])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableToggle>
    </div>
  );
}

// 2. Горизонтальный рейтинг регионов за последний год окна — от меньшего к
// большему сверху вниз, значение подписано у конца столбца.
function RankingChart({
  rows,
  title,
  labels,
}: {
  rows: { name: string; value: number }[];
  title: string;
  labels: CommonLabels;
}) {
  const [showTable, setShowTable] = useState(false);

  const sorted = [...rows].sort((a, b) => a.value - b.value);

  const width = 640;
  const rowHeight = 28;
  const padding = { top: 8, right: 56, bottom: 8, left: 168 };
  const innerW = width - padding.left - padding.right;
  const height = padding.top + padding.bottom + sorted.length * rowHeight;

  const maxValue = Math.max(1, ...sorted.map((r) => r.value));
  const niceMax = niceCeil(maxValue * 1.08);

  const barWidth = (v: number) => (v / niceMax) * innerW;
  const yAt = (i: number) => padding.top + i * rowHeight + rowHeight / 2;

  return (
    <div className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]">
      <h4 className="font-display text-lg">{title}</h4>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 w-full" role="img" aria-label={title}>
        {sorted.map((row, i) => {
          const w = barWidth(row.value);
          return (
            <g key={row.name}>
              <text x={padding.left - 10} y={yAt(i) + 4} textAnchor="end" fontSize="11" fill={AXIS_TEXT}>
                {row.name}
              </text>
              <rect
                x={padding.left}
                y={yAt(i) - 8}
                width={Math.max(w, 2)}
                height={16}
                rx={4}
                fill={PRIMARY}
              />
              <text
                x={padding.left + w + 8}
                y={yAt(i) + 4}
                fontSize="11"
                className="fill-fg"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatNumber(row.value)}
              </text>
            </g>
          );
        })}
      </svg>

      <TableToggle show={showTable} onToggle={() => setShowTable((s) => !s)} labels={labels}>
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-raised text-muted">
            <tr>
              <th className="px-2 py-1.5 text-left">{labels.regionHeader}</th>
              <th className="px-2 py-1.5 text-right">{labels.valueHeader}</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {[...sorted].reverse().map((row) => (
              <tr key={row.name} className="border-t border-line/60">
                <td className="px-2 py-1">{row.name}</td>
                <td className="px-2 py-1 text-right text-fg">{formatNumber(row.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableToggle>
    </div>
  );
}

// 3. Групповая диаграмма «регион × два года» — первый и последний год окна,
// два столбца на регион, подписи регионов развёрнуты по диагонали (как на
// примере пользователя).
function ComparisonChart({
  rows,
  year1,
  year2,
  title,
  labels,
}: {
  rows: { name: string; first: number; last: number }[];
  year1: number;
  year2: number;
  title: string;
  labels: CommonLabels;
}) {
  const [showTable, setShowTable] = useState(false);

  const groupWidth = 64;
  const padding = { top: 24, right: 16, bottom: 96, left: 56 };
  const innerH = 260;
  const width = padding.left + padding.right + rows.length * groupWidth;
  const height = padding.top + innerH + padding.bottom;

  const maxValue = Math.max(1, ...rows.flatMap((r) => [r.first, r.last]));
  const niceMax = niceCeil(maxValue * 1.1);
  const tickCount = 4;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (niceMax / tickCount) * i);

  const barH = (v: number) => (v / niceMax) * innerH;
  const yBase = padding.top + innerH;
  const barW = 20;
  const gap = 6;

  return (
    <div className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]">
      <h4 className="font-display text-lg">{title}</h4>
      <div className="mt-4 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} width={width} className="max-w-none" style={{ minWidth: "100%" }} role="img" aria-label={title}>
          {ticks.map((t, i) => (
            <g key={i}>
              <line x1={padding.left} x2={width - padding.right} y1={yBase - barH(t)} y2={yBase - barH(t)} stroke={GRID} strokeWidth={1} />
              <text x={padding.left - 8} y={yBase - barH(t) + 4} textAnchor="end" fontSize="10" fill={AXIS_TEXT}>
                {formatNumber(t)}
              </text>
            </g>
          ))}

          {rows.map((row, i) => {
            const cx = padding.left + i * groupWidth + groupWidth / 2;
            const x1 = cx - gap / 2 - barW;
            const x2 = cx + gap / 2;
            const h1 = barH(row.first);
            const h2 = barH(row.last);
            return (
              <g key={row.name}>
                <rect x={x1} y={yBase - h1} width={barW} height={h1} rx={3} fill={PRIMARY} />
                <rect x={x2} y={yBase - h2} width={barW} height={h2} rx={3} fill={SECONDARY} />
                <text
                  x={cx}
                  y={yBase + 14}
                  textAnchor="end"
                  fontSize="10"
                  fill={AXIS_TEXT}
                  transform={`rotate(-40 ${cx} ${yBase + 14})`}
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
          {year1}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: SECONDARY }} />
          {year2}
        </span>
      </div>

      <TableToggle show={showTable} onToggle={() => setShowTable((s) => !s)} labels={labels}>
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-raised text-muted">
            <tr>
              <th className="px-2 py-1.5 text-left">{labels.regionHeader}</th>
              <th className="px-2 py-1.5 text-right">{year1}</th>
              <th className="px-2 py-1.5 text-right">{year2}</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {rows.map((row) => (
              <tr key={row.name} className="border-t border-line/60">
                <td className="px-2 py-1">{row.name}</td>
                <td className="px-2 py-1 text-right text-fg">{formatNumber(row.first)}</td>
                <td className="px-2 py-1 text-right text-fg">{formatNumber(row.last)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableToggle>
    </div>
  );
}

function IndicatorGroup({ indicator, locale, t }: { indicator: StatUzIndicator; locale: Locale; t: StatUzDict }) {
  const forms = t.indicators[indicator.key];
  const commonLabels: CommonLabels = {
    yearHeader: t.yearHeader,
    regionHeader: t.regionHeader,
    valueHeader: t.valueHeader,
    showTable: t.showTable,
    hideTable: t.hideTable,
  };

  const lastYear = indicator.years[indicator.years.length - 1];
  const firstYear = indicator.years[0];

  const rankingRows = indicator.regions.map((region) => ({
    name: regionName(region, locale),
    value: region.values[region.values.length - 1] ?? 0,
  }));

  const comparisonRows = indicator.regions.map((region) => ({
    name: regionName(region, locale),
    first: region.values[0] ?? 0,
    last: region.values[region.values.length - 1] ?? 0,
  }));

  return (
    <div className="mt-12 first:mt-0">
      <h3 className="text-center font-display text-2xl">{forms.nominative}</h3>
      <div className="mt-6 flex flex-col gap-6">
        <DynamicsChart
          years={indicator.years}
          values={indicator.republic}
          title={fillTemplate(t.dynamicsTitleTemplate, { value: forms.genitive })}
          labels={commonLabels}
        />
        <RankingChart
          rows={rankingRows}
          title={fillTemplate(t.rankingTitleTemplate, { value: forms.dative, year: lastYear })}
          labels={commonLabels}
        />
        <ComparisonChart
          rows={comparisonRows}
          year1={firstYear}
          year2={lastYear}
          title={fillTemplate(t.comparisonTitleTemplate, {
            value: forms.nominative,
            year1: firstYear,
            year2: lastYear,
          })}
          labels={commonLabels}
        />
      </div>
    </div>
  );
}

type StatUzDict = {
  sectionHeading: string;
  sectionSubtitle: string;
  sourceLabel: string;
  loadError: string;
  regionHeader: string;
  valueHeader: string;
  yearHeader: string;
  showTable: string;
  hideTable: string;
  dynamicsTitleTemplate: string;
  rankingTitleTemplate: string;
  comparisonTitleTemplate: string;
  indicators: Record<StatUzIndicatorKey, { nominative: string; genitive: string; dative: string }>;
};

export function StatUzCharts() {
  const { dict, locale } = useI18n();
  const t = dict.statUz as StatUzDict;
  const [indicators, setIndicators] = useState<StatUzIndicator[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stat-uz")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: StatUzIndicator[]) => {
        if (!cancelled && Array.isArray(data)) setIndicators(data);
      })
      .catch(() => {
        if (!cancelled) setIndicators([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Пока не пришёл ответ — секцию не показываем совсем (как валютный тикер),
  // чтобы не дёргать layout пустым каркасом.
  if (indicators === null) {
    return null;
  }

  return (
    <section className="border-t border-line">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center font-display text-3xl">{t.sectionHeading}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted">{t.sectionSubtitle}</p>

        {indicators.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted">{t.loadError}</p>
        ) : (
          indicators.map((indicator) => (
            <IndicatorGroup key={indicator.key} indicator={indicator} locale={locale} t={t} />
          ))
        )}

        <p className="mt-10 text-center text-xs text-muted">
          <a
            href="https://stat.uz/ru/ofitsialnaya-statistika/usreo"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-fg"
          >
            {t.sourceLabel}
          </a>
        </p>
      </div>
    </section>
  );
}
