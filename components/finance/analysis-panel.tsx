"use client";

import { AlertTriangle, BarChart3, CheckCircle2, Gauge, Lock, Sparkles, TrendingDown } from "lucide-react";
import { ScoreRing } from "@/components/finance/score-ring";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/i18n/provider";
import type { FrozenAssetsAnalysis, MarginBridge, RevenueSafetyMargin } from "@/lib/finance/insights";
import type { AiAdvice, FinancialRatios } from "@/lib/finance/types";
import { formatMoney, formatPct, formatRatio } from "@/lib/utils";

type RatioRowKey = Exclude<keyof FinancialRatios, "score" | "scoreDetails" | "equityToDebt">;

const RATIO_ROW_KEYS: { key: RatioRowKey; kind: "ratio" | "pct" | "money" }[] = [
  { key: "currentRatio", kind: "ratio" },
  { key: "quickRatio", kind: "ratio" },
  { key: "absoluteLiquidity", kind: "ratio" },
  { key: "roa", kind: "pct" },
  { key: "roe", kind: "pct" },
  { key: "ros", kind: "pct" },
  { key: "grossMargin", kind: "pct" },
  { key: "operatingMargin", kind: "pct" },
  { key: "autonomyRatio", kind: "pct" },
  { key: "debtRatio", kind: "pct" },
  { key: "assetTurnover", kind: "ratio" },
  { key: "inventoryTurnover", kind: "ratio" },
  { key: "interestCoverage", kind: "ratio" },
  { key: "workingCapital", kind: "money" },
];

export function AnalysisPanel({
  ratios,
  advice,
  marginBridge,
  frozenAssets,
  safetyMargin,
}: {
  ratios: FinancialRatios;
  advice: AiAdvice | null;
  marginBridge: MarginBridge;
  frozenAssets: FrozenAssetsAnalysis;
  safetyMargin: RevenueSafetyMargin;
}) {
  const { locale, dict } = useI18n();
  const t = dict.panel;

  function formatValue(key: RatioRowKey, kind: "ratio" | "pct" | "money") {
    const v = ratios[key];
    if (kind === "money" && typeof v === "number") return formatMoney(v, locale);
    if (kind === "pct") return formatPct(typeof v === "number" ? v : null);
    return formatRatio(typeof v === "number" ? v : null);
  }

  const scoreDetailRows = [
    [t.scoreDetails.liquidity, ratios.scoreDetails.liquidity],
    [t.scoreDetails.profitability, ratios.scoreDetails.profitability],
    [t.scoreDetails.stability, ratios.scoreDetails.stability],
    [t.scoreDetails.efficiency, ratios.scoreDetails.efficiency],
  ] as const;

  const dragRows: { key: string; label: string; ratio: number | null }[] = [
    { key: "costOfSales", label: t.marginRows.costOfSales, ratio: marginBridge.costOfSalesRatio },
    { key: "distributionCosts", label: dict.financeFields.labels.distributionCosts, ratio: marginBridge.distributionCostsRatio },
    { key: "adminExpenses", label: dict.financeFields.labels.adminExpenses, ratio: marginBridge.adminExpensesRatio },
    { key: "otherOperatingExpenses", label: dict.financeFields.labels.otherOperatingExpenses, ratio: marginBridge.otherOperatingNetRatio },
    { key: "interestExpense", label: dict.financeFields.labels.interestExpense, ratio: marginBridge.interestNetRatio },
    { key: "incomeTax", label: dict.financeFields.labels.incomeTax, ratio: marginBridge.taxRatio },
  ];

  return (
    <div className="space-y-5">
      <Card className="flex flex-col gap-6 md:flex-row md:items-center">
        <ScoreRing score={ratios.score} label={t.outOf100} />
        <div className="grid flex-1 grid-cols-2 gap-3 text-sm md:grid-cols-4">
          {scoreDetailRows.map(([label, value]) => (
            <div key={label}>
              <div className="text-muted">{label}</div>
              <div className="mt-1 font-display text-2xl tabular-nums">{value}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {RATIO_ROW_KEYS.map((row) => (
          <div
            key={row.key}
            className="flex items-center justify-between rounded-xl bg-raised px-4 py-3 text-sm"
          >
            <span className="text-muted">{t.ratioRows[row.key]}</span>
            <span className="tabular-nums">{formatValue(row.key, row.kind)}</span>
          </div>
        ))}
      </div>

      {/* Где теряется маржа — считается всегда, не только после ИИ/правил. */}
      <Card className="space-y-3">
        <h3 className="flex items-center gap-2 font-display text-lg">
          <TrendingDown className="size-5 text-gold" /> {t.marginBridgeHeading}
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {dragRows.map((row) => (
            <div key={row.key} className="flex items-center justify-between rounded-xl bg-raised px-3 py-2 text-sm">
              <span className="text-muted">{row.label}</span>
              <span className="tabular-nums">{formatPct(row.ratio)}</span>
            </div>
          ))}
        </div>
        {advice ? <p className="text-sm leading-relaxed text-muted">{advice.margin_commentary}</p> : null}
      </Card>

      {/* Где заморожены деньги — топ статей, дни оборота запасов/дебиторки. */}
      <Card className="space-y-3">
        <h3 className="flex items-center gap-2 font-display text-lg">
          <Lock className="size-5 text-gold" /> {t.frozenAssetsHeading}
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {frozenAssets.items.map((item) => (
            <div key={item.key} className="flex items-center justify-between rounded-xl bg-raised px-3 py-2 text-sm">
              <span className="text-muted">{dict.financeFields.labels[item.key]}</span>
              <span className="tabular-nums">
                {formatMoney(item.amount, locale)} · {formatPct(item.shareOfAssets)}
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted">
          <span>
            {t.inventoryDaysLabel}: {frozenAssets.inventoryDays !== null ? Math.round(frozenAssets.inventoryDays) : "—"}
          </span>
          <span>
            {t.receivablesDaysLabel}:{" "}
            {frozenAssets.receivablesDays !== null ? Math.round(frozenAssets.receivablesDays) : "—"}
          </span>
        </div>
        {advice ? <p className="text-sm leading-relaxed text-muted">{advice.frozen_assets_commentary}</p> : null}
      </Card>

      {/* Безопасный порог снижения выручки — запас прочности до операционного убытка. */}
      <Card className="space-y-3">
        <h3 className="flex items-center gap-2 font-display text-lg">
          <Gauge className="size-5 text-gold" /> {t.safetyMarginHeading}
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl bg-raised px-3 py-2 text-sm">
            <span className="text-muted">{t.breakEvenRevenueLabel}</span>
            <span className="tabular-nums">
              {safetyMargin.breakEvenRevenue !== null ? formatMoney(safetyMargin.breakEvenRevenue, locale) : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-raised px-3 py-2 text-sm">
            <span className="text-muted">{t.safeDeclineLabel}</span>
            <span className="tabular-nums">{formatPct(safetyMargin.safeDeclinePct)}</span>
          </div>
        </div>
        {advice ? <p className="text-sm leading-relaxed text-muted">{advice.safety_margin_commentary}</p> : null}
      </Card>

      {advice ? (
        <div className="space-y-4">
          <Card>
            <div className="mb-2 flex items-center gap-2 text-sm text-gold">
              <Sparkles className="size-4" />
              {advice.source === "ai" ? t.aiAnalysis : t.expressRecommendations}
            </div>
            <p className="text-sm leading-relaxed">{advice.summary}</p>
            <p className="mt-3 text-sm text-muted">{advice.score_comment}</p>
          </Card>

          {advice.red_flags.length > 0 ? (
            <Card className="space-y-3">
              <h3 className="flex items-center gap-2 font-display text-lg text-danger">
                <AlertTriangle className="size-5" /> {t.redFlags}
              </h3>
              {advice.red_flags.map((flag) => (
                <div key={flag.indicator} className="rounded-xl bg-danger/10 p-3">
                  <div className="font-medium">
                    {flag.indicator}: {flag.value}
                  </div>
                  <p className="mt-1 text-sm text-muted">{flag.why_critical}</p>
                </div>
              ))}
            </Card>
          ) : null}

          {advice.strengths.length > 0 ? (
            <Card>
              <h3 className="mb-2 flex items-center gap-2 font-display text-lg text-ok">
                <CheckCircle2 className="size-5" /> {t.strengths}
              </h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                {advice.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </Card>
          ) : null}

          {advice.weaknesses.length > 0 ? (
            <Card>
              <h3 className="mb-2 flex items-center gap-2 font-display text-lg text-gold">
                <TrendingDown className="size-5" /> {t.weaknesses}
              </h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                {advice.weaknesses.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Card className="space-y-4">
            <h3 className="font-display text-lg">{t.whatToDo}</h3>
            {advice.recommendations.map((rec) => (
              <div key={rec.title} className="rounded-xl bg-raised p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h4 className="font-semibold">{rec.title}</h4>
                  <div className="flex gap-2 text-xs text-muted">
                    <span className="rounded-full bg-line px-2 py-1">{t.difficulty[rec.difficulty]}</span>
                    <span className="rounded-full bg-line px-2 py-1">{rec.timeframe}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm">{rec.description}</p>
                <p className="mt-1 text-sm text-muted">
                  {t.effectPrefix}
                  {rec.expected_effect}
                </p>
              </div>
            ))}
          </Card>

          <Card>
            <h3 className="mb-2 flex items-center gap-2 font-display text-lg">
              <BarChart3 className="size-5 text-gold" /> {t.benchmarkHeading}
            </h3>
            {advice.benchmark.available && advice.benchmark.comparisons.length > 0 ? (
              <div className="space-y-2">
                {advice.benchmark.comparisons.map((c) => (
                  <div key={c.metric} className="rounded-xl bg-raised p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{c.metric}</span>
                      <span className="tabular-nums text-muted">
                        {c.company_value} / {c.benchmark_value}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {t.benchmarkSourceLabel} {c.source}
                    </p>
                  </div>
                ))}
                {advice.benchmark.note ? <p className="text-sm text-muted">{advice.benchmark.note}</p> : null}
              </div>
            ) : (
              <p className="text-sm text-muted">{advice.benchmark.note || t.benchmarkUnavailable}</p>
            )}
          </Card>

          <Card>
            <h3 className="mb-2 font-display text-lg">{t.financingHeading}</h3>
            <p className="text-sm leading-relaxed">{advice.financing_advice}</p>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
