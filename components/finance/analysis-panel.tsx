"use client";

import { AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { ScoreRing } from "@/components/finance/score-ring";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/i18n/provider";
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
}: {
  ratios: FinancialRatios;
  advice: AiAdvice | null;
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
            <h3 className="mb-2 font-display text-lg">{t.financingHeading}</h3>
            <p className="text-sm leading-relaxed">{advice.financing_advice}</p>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
