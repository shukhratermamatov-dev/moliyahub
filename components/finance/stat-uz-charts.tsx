"use client";

import { useEffect, useState, type PointerEvent } from "react";
import type { StatUzIndicator, StatUzIndicatorKey } from "@/app/api/stat-uz/route";
import { useI18n } from "@/i18n/provider";

// Порядок и цвета рядов — фиксированный категориальный набор (не берём из
// брендовых teal/gold напрямую: для 4 читаемых, различимых для дальтоников
// линий на тёмном фоне нужен провалидированный набор, см. skill dataviz).
// Проверено node scripts/validate_palette.js на #081018 (тёмный фон сайта):
// все проверки (яркость/хрома/CVD/контраст) пройдены.
const SERIES_COLORS = {
  republic: "#3987e5",
  regions: "#d95926",
  tashkentCity: "#199e70",
  karakalpakstan: "#c98500",
} as const;

const SERIES_ORDER = ["republic", "regions", "tashkentCity", "karakalpakstan"] as const;
type SeriesKey = (typeof SERIES_ORDER)[number];

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

type ChartLabels = {
  series: Record<SeriesKey, string>;
  showTable: string;
  hideTable: string;
  yearHeader: string;
};

function IndicatorChart({
  indicator,
  title,
  labels,
}: {
  indicator: StatUzIndicator;
  title: string;
  labels: ChartLabels;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const width = 640;
  const height = 260;
  const padding = { top: 16, right: 16, bottom: 28, left: 56 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const years = indicator.years;
  const maxValue = Math.max(1, ...SERIES_ORDER.flatMap((key) => indicator[key]));
  const niceMax = niceCeil(maxValue);
  const tickCount = 4;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (niceMax / tickCount) * i);

  const xAt = (i: number) =>
    padding.left + (years.length === 1 ? innerW / 2 : (i * innerW) / (years.length - 1));
  const yAt = (v: number) => padding.top + innerH - (v / niceMax) * innerH;

  const linePath = (values: number[]) =>
    values.map((v, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)}`).join(" ");

  const handleMove = (e: PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xInRect = e.clientX - rect.left;
    const viewBoxX = (xInRect / rect.width) * innerW + padding.left;
    const relative = (viewBoxX - padding.left) / innerW;
    const idx = Math.round(relative * (years.length - 1));
    setHoverIndex(Math.min(Math.max(idx, 0), years.length - 1));
  };

  const tooltipLeftPct = hoverIndex !== null ? (xAt(hoverIndex) / width) * 100 : 0;
  const tooltipFlip = tooltipLeftPct > 60;

  return (
    <div className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]">
      <h3 className="font-display text-lg">{title}</h3>
      <div className="relative mt-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={title}>
          {ticks.map((t, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={yAt(t)}
                y2={yAt(t)}
                stroke="#24343c"
                strokeWidth={1}
              />
              <text x={padding.left - 8} y={yAt(t) + 4} textAnchor="end" fontSize="10" fill="#8fa09a">
                {formatNumber(t)}
              </text>
            </g>
          ))}

          {years.map((year, i) => {
            const step = Math.max(1, Math.ceil(years.length / 6));
            if (i % step !== 0 && i !== years.length - 1) return null;
            return (
              <text key={year} x={xAt(i)} y={height - 8} textAnchor="middle" fontSize="10" fill="#8fa09a">
                {year}
              </text>
            );
          })}

          {SERIES_ORDER.map((key) => (
            <path
              key={key}
              d={linePath(indicator[key])}
              fill="none"
              stroke={SERIES_COLORS[key]}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {SERIES_ORDER.map((key) => {
            const values = indicator[key];
            const lastIdx = values.length - 1;
            return (
              <circle
                key={key}
                cx={xAt(lastIdx)}
                cy={yAt(values[lastIdx])}
                r={4}
                fill={SERIES_COLORS[key]}
                stroke="#111b22"
                strokeWidth={2}
              />
            );
          })}

          {hoverIndex !== null ? (
            <line
              x1={xAt(hoverIndex)}
              x2={xAt(hoverIndex)}
              y1={padding.top}
              y2={height - padding.bottom}
              stroke="#8fa09a"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          ) : null}

          <rect
            x={padding.left}
            y={padding.top}
            width={innerW}
            height={innerH}
            fill="transparent"
            onPointerMove={handleMove}
            onPointerLeave={() => setHoverIndex(null)}
          />
        </svg>

        {hoverIndex !== null ? (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-[180px] rounded-lg bg-raised p-3 text-xs shadow-[0_0_0_1px_rgba(255,255,255,0.1)]"
            style={{
              left: `${tooltipLeftPct}%`,
              transform: tooltipFlip ? "translateX(-100%)" : "translateX(8px)",
            }}
          >
            <div className="mb-1.5 font-medium text-fg">{years[hoverIndex]}</div>
            {SERIES_ORDER.map((key) => (
              <div key={key} className="flex items-center justify-between gap-3 py-0.5">
                <span className="flex items-center gap-1.5 text-muted">
                  <span
                    className="inline-block h-0.5 w-3 rounded-full"
                    style={{ backgroundColor: SERIES_COLORS[key] }}
                  />
                  {labels.series[key]}
                </span>
                <span className="font-medium tabular-nums text-fg">
                  {formatNumber(indicator[key][hoverIndex])}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        {SERIES_ORDER.map((key) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 rounded-full" style={{ backgroundColor: SERIES_COLORS[key] }} />
            {labels.series[key]}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowTable((v) => !v)}
        className="mt-3 text-xs text-primary hover:underline"
      >
        {showTable ? labels.hideTable : labels.showTable}
      </button>

      {showTable ? (
        <div className="mt-2 max-h-56 overflow-auto rounded-lg bg-raised">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-raised text-muted">
              <tr>
                <th className="px-2 py-1.5 text-left">{labels.yearHeader}</th>
                {SERIES_ORDER.map((key) => (
                  <th key={key} className="px-2 py-1.5 text-right">
                    {labels.series[key]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {years.map((year, i) => (
                <tr key={year} className="border-t border-line/60">
                  <td className="px-2 py-1">{year}</td>
                  {SERIES_ORDER.map((key) => (
                    <td key={key} className="px-2 py-1 text-right text-fg">
                      {formatNumber(indicator[key][i])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

export function StatUzCharts() {
  const { dict } = useI18n();
  const t = dict.statUz;
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

  const seriesLabels: Record<SeriesKey, string> = {
    republic: t.seriesRepublic,
    regions: t.seriesRegions,
    tashkentCity: t.seriesTashkent,
    karakalpakstan: t.seriesKarakalpakstan,
  };

  return (
    <section className="border-t border-line">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center font-display text-3xl">{t.sectionHeading}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted">{t.sectionSubtitle}</p>

        {indicators.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted">{t.loadError}</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {indicators.map((indicator) => (
              <IndicatorChart
                key={indicator.key}
                indicator={indicator}
                title={t.indicators[indicator.key as StatUzIndicatorKey]}
                labels={{
                  series: seriesLabels,
                  showTable: t.showTable,
                  hideTable: t.hideTable,
                  yearHeader: t.yearHeader,
                }}
              />
            ))}
          </div>
        )}

        <p className="mt-6 text-center text-xs text-muted">
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
