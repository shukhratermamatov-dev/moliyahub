"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import type { StatUzIndicator } from "@/app/api/stat-uz/route";
import { useI18n } from "@/i18n/provider";
import type { Locale } from "@/i18n/config";
import { Button } from "@/components/ui/button";

// Редизайн блока «Предприятия и организации Узбекистана» (главная
// страница) по макету, присланному пользователем: вместо двух равноценных
// показателей (действующие + зарегистрированные, каждый — 2 обычных
// графика) — единый герой-блок только по «Действующим предприятиям» с
// 3 KPI-карточками (последнее значение, рост год-к-году, доля топ-региона)
// и CTA на /analyze.
//
// По решению пользователя (уточнено вопросом при редизайне) показатель
// «Зарегистрированные предприятия» с главной страницы убран. Данные и код
// для него НЕ удалены — components/finance/stat-uz-charts.tsx (общий
// компонент на все 4 показателя stat.uz, с тем же флагом-паттерном
// DISABLED_INDICATORS/DISABLED_CHARTS для точечного скрытия) остаётся
// нетронутым и просто больше не используется на главной; чтобы вернуть
// «Зарегистрированные» или прежний вид назад, достаточно заменить
// <EnterprisesHero /> на <StatUzCharts /> в app/[locale]/page.tsx.
//
// Своя (не переиспользующая dict.statUz) i18n-секция dict.home.enterprisesHero —
// у этого блока другая форма текста (шаблон-заголовок со вставленным
// числом, подписи KPI-карточек), общего с générique statUz мало.

const GREEN = "#22c08a";
const BLUE = "#3987e5";
const GRID = "#24343c";
const AXIS_TEXT = "#8fa09a";
const DELTA_TEXT = "#5fb894";

function fillTemplate(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce((acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)), template);
}

function localeTag(locale: Locale): string {
  return locale === "en" ? "en-US" : locale === "uz" ? "uz-UZ" : "ru-RU";
}

function formatNumber(n: number, locale: Locale): string {
  return Math.round(n).toLocaleString(localeTag(locale));
}

function formatSignedNumber(n: number, locale: Locale): string {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${formatNumber(Math.abs(n), locale)}`;
}

function formatSignedPct(n: number, locale: Locale): string {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${Math.abs(n).toLocaleString(localeTag(locale), { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%`;
}

function regionName(region: { name: { ru: string; en: string; uz: string } }, locale: Locale): string {
  return region.name[locale] || region.name.ru;
}

type Labels = {
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
  labels: Pick<Labels, "showTable" | "hideTable">;
  children: React.ReactNode;
}) {
  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={onToggle}>
        {show ? labels.hideTable : labels.showTable}
      </Button>
      {show ? <div className="mt-3 max-h-56 overflow-auto rounded-lg bg-raised">{children}</div> : null}
    </>
  );
}

// Линия динамики с заливкой площади и подписью изменения год-к-году под
// каждой точкой (кроме первой — для неё нет предыдущего года) — как на
// макете.
function HeroDynamicsChart({
  years,
  values,
  title,
  locale,
  labels,
}: {
  years: number[];
  values: number[];
  title: string;
  locale: Locale;
  labels: Labels;
}) {
  const [showTable, setShowTable] = useState(false);
  const gradientId = useId();

  const width = 640;
  const height = 300;
  const padding = { top: 36, right: 24, bottom: 48, left: 64 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const maxValue = Math.max(1, ...values);
  const niceMax = maxValue * 1.2;
  const tickCount = 3;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (niceMax / tickCount) * i);

  const xAt = (i: number) => padding.left + (years.length === 1 ? innerW / 2 : (i * innerW) / (years.length - 1));
  const yAt = (v: number) => padding.top + innerH - (v / niceMax) * innerH;

  const linePath = values.map((v, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yAt(v).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${xAt(values.length - 1).toFixed(1)} ${(padding.top + innerH).toFixed(1)} L ${xAt(0).toFixed(1)} ${(padding.top + innerH).toFixed(1)} Z`;

  return (
    <div className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h4 className="font-display text-lg">{title}</h4>
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
                  <td className="px-2 py-1 text-right text-fg">{formatNumber(values[i], locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableToggle>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 w-full" role="img" aria-label={title}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GREEN} stopOpacity={0.28} />
            <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
          </linearGradient>
        </defs>

        {ticks.map((tickValue, i) => (
          <g key={i}>
            <line x1={padding.left} x2={width - padding.right} y1={yAt(tickValue)} y2={yAt(tickValue)} stroke={GRID} strokeWidth={1} />
            <text x={padding.left - 8} y={yAt(tickValue) + 4} textAnchor="end" fontSize="10" fill={AXIS_TEXT}>
              {formatNumber(tickValue, locale)}
            </text>
          </g>
        ))}

        {years.map((year, i) => {
          const deltaPct = i === 0 ? null : ((values[i] - values[i - 1]) / values[i - 1]) * 100;
          return (
            <g key={year}>
              <text x={xAt(i)} y={height - 30} textAnchor="middle" fontSize="10" fill={AXIS_TEXT}>
                {year}
              </text>
              {deltaPct !== null && (
                <text
                  x={xAt(i)}
                  y={height - 14}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight={600}
                  fill={DELTA_TEXT}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {formatSignedPct(deltaPct, locale)}
                </text>
              )}
            </g>
          );
        })}

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path d={linePath} fill="none" stroke={GREEN} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

        {values.map((v, i) => (
          <g key={i}>
            <circle cx={xAt(i)} cy={yAt(v)} r={4.5} fill={GREEN} stroke="#0e1a24" strokeWidth={2} />
            <text
              x={xAt(i)}
              y={yAt(v) - 14}
              textAnchor="middle"
              fontSize="11"
              fontWeight={600}
              className="fill-fg"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {formatNumber(v, locale)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// Рейтинг регионов по убыванию (лидер сверху, как на макете — в отличие от
// общего RankingChart в stat-uz-charts.tsx, где сортировка по возрастанию
// сверху вниз); лидер выделен зелёным, остальные — обычным синим.
function HeroRankingChart({
  rows,
  title,
  locale,
  labels,
}: {
  rows: { name: string; value: number }[];
  title: string;
  locale: Locale;
  labels: Labels;
}) {
  const [showTable, setShowTable] = useState(false);

  const sorted = [...rows].sort((a, b) => b.value - a.value);

  const width = 640;
  const rowHeight = 28;
  const padding = { top: 8, right: 56, bottom: 8, left: 168 };
  const innerW = width - padding.left - padding.right;
  const height = padding.top + padding.bottom + sorted.length * rowHeight;

  const maxValue = Math.max(1, ...sorted.map((r) => r.value));
  const barWidth = (v: number) => (v / maxValue) * innerW;
  const yAt = (i: number) => padding.top + i * rowHeight + rowHeight / 2;

  return (
    <div className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h4 className="font-display text-lg">{title}</h4>
        <TableToggle show={showTable} onToggle={() => setShowTable((s) => !s)} labels={labels}>
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-raised text-muted">
              <tr>
                <th className="px-2 py-1.5 text-left">{labels.regionHeader}</th>
                <th className="px-2 py-1.5 text-right">{labels.valueHeader}</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {sorted.map((row) => (
                <tr key={row.name} className="border-t border-line/60">
                  <td className="px-2 py-1">{row.name}</td>
                  <td className="px-2 py-1 text-right text-fg">{formatNumber(row.value, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableToggle>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 w-full" role="img" aria-label={title}>
        {sorted.map((row, i) => {
          const isTop = i === 0;
          const w = barWidth(row.value);
          return (
            <g key={row.name}>
              <text
                x={padding.left - 10}
                y={yAt(i) + 4}
                textAnchor="end"
                fontSize="11"
                fontWeight={isTop ? 600 : 400}
                fill={isTop ? "#eaf1f4" : AXIS_TEXT}
              >
                {row.name}
              </text>
              <rect x={padding.left} y={yAt(i) - 8} width={Math.max(w, 2)} height={16} rx={4} fill={isTop ? GREEN : BLUE} />
              <text
                x={padding.left + w + 8}
                y={yAt(i) + 4}
                fontSize="11"
                fontWeight={isTop ? 700 : 400}
                className="fill-fg"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatNumber(row.value, locale)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function EnterprisesHero() {
  const { dict, locale } = useI18n();
  const t = dict.home.enterprisesHero;
  const [indicator, setIndicator] = useState<StatUzIndicator | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stat-uz")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: StatUzIndicator[]) => {
        if (cancelled || !Array.isArray(data)) return;
        setIndicator(data.find((i) => i.key === "operating") ?? null);
      })
      .catch(() => {
        if (!cancelled) setIndicator(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Пока не пришёл ответ или показатель не найден — секцию не показываем
  // совсем (как валютный тикер), чтобы не дёргать layout пустым каркасом.
  if (!indicator) {
    return null;
  }

  const labels: Labels = {
    yearHeader: t.yearHeader,
    regionHeader: t.regionHeader,
    valueHeader: t.valueHeader,
    showTable: t.showTable,
    hideTable: t.hideTable,
  };

  const lastIndex = indicator.years.length - 1;
  const lastYear = indicator.years[lastIndex];
  const prevYear = indicator.years[lastIndex - 1];
  const latestValue = indicator.republic[lastIndex];
  const prevValue = indicator.republic[lastIndex - 1];
  const yoyDelta = latestValue - prevValue;
  const yoyPct = (yoyDelta / prevValue) * 100;

  const rankingRows = indicator.regions.map((region) => ({
    name: regionName(region, locale),
    value: region.values[region.values.length - 1] ?? 0,
  }));
  const topRegion = [...rankingRows].sort((a, b) => b.value - a.value)[0];
  const topShare = (topRegion.value / latestValue) * 100;

  return (
    <section className="border-t border-line">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-primary">{t.eyebrow}</p>
            <h2 className="mt-2 max-w-2xl font-display text-3xl font-semibold sm:text-4xl">
              {fillTemplate(t.headlineTemplate, { value: formatNumber(latestValue, locale) })}
            </h2>
          </div>
          <p className="flex shrink-0 items-center gap-2 text-sm text-muted lg:mt-2">
            <span className="inline-block size-1.5 rounded-full bg-primary" />
            {t.updatedLabel}
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-raised p-5">
            <div className="font-display text-2xl font-semibold tabular-nums">{formatNumber(latestValue, locale)}</div>
            <p className="mt-1 text-sm text-muted">{fillTemplate(t.activeStatLabel, { year: lastYear })}</p>
          </div>
          <div className="rounded-2xl bg-raised p-5">
            <div className="font-display text-2xl font-semibold tabular-nums text-primary">
              {formatSignedPct(yoyPct, locale)}
            </div>
            <p className="mt-1 text-sm text-muted">
              {fillTemplate(t.growthStatLabel, { delta: formatSignedNumber(yoyDelta, locale), year: prevYear })}
            </p>
          </div>
          <div className="rounded-2xl bg-raised p-5">
            <div className="font-display text-2xl font-semibold tabular-nums">
              {topShare.toLocaleString(localeTag(locale), { maximumFractionDigits: 0 })}%
            </div>
            <p className="mt-1 text-sm text-muted">
              {fillTemplate(t.shareStatLabel, { region: topRegion.name, value: formatNumber(topRegion.value, locale) })}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <HeroDynamicsChart years={indicator.years} values={indicator.republic} title={t.dynamicsTitle} locale={locale} labels={labels} />
          <HeroRankingChart
            rows={rankingRows}
            title={fillTemplate(t.rankingTitleTemplate, { year: lastYear })}
            locale={locale}
            labels={labels}
          />
        </div>

        <div className="mt-6 flex flex-col items-start gap-4 rounded-2xl bg-raised p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-relaxed text-fg">{t.ctaText}</p>
          <Button asChild className="shrink-0">
            <Link href={`/${locale}/analyze`}>{t.ctaButton}</Link>
          </Button>
        </div>

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
