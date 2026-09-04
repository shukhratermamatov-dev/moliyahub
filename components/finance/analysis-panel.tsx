import { AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { ScoreRing } from "@/components/finance/score-ring";
import { Card } from "@/components/ui/card";
import type { AiAdvice, FinancialRatios } from "@/lib/finance/types";
import { formatMoney, formatPct, formatRatio } from "@/lib/utils";

const RATIO_ROWS: { key: keyof FinancialRatios; label: string; kind: "ratio" | "pct" | "money" }[] = [
  { key: "currentRatio", label: "Текущая ликвидность", kind: "ratio" },
  { key: "quickRatio", label: "Быстрая ликвидность", kind: "ratio" },
  { key: "absoluteLiquidity", label: "Абсолютная ликвидность", kind: "ratio" },
  { key: "roa", label: "ROA", kind: "pct" },
  { key: "roe", label: "ROE", kind: "pct" },
  { key: "ros", label: "Рентабельность продаж", kind: "pct" },
  { key: "grossMargin", label: "Валовая маржа", kind: "pct" },
  { key: "operatingMargin", label: "Операционная маржа", kind: "pct" },
  { key: "autonomyRatio", label: "Автономия", kind: "pct" },
  { key: "debtRatio", label: "Долговая нагрузка", kind: "pct" },
  { key: "assetTurnover", label: "Оборачиваемость активов", kind: "ratio" },
  { key: "inventoryTurnover", label: "Оборачиваемость запасов", kind: "ratio" },
  { key: "interestCoverage", label: "Покрытие процентов", kind: "ratio" },
  { key: "workingCapital", label: "Чистый оборотный капитал", kind: "money" },
];

function formatValue(ratios: FinancialRatios, key: keyof FinancialRatios, kind: "ratio" | "pct" | "money") {
  const v = ratios[key];
  if (kind === "money" && typeof v === "number") return formatMoney(v);
  if (kind === "pct") return formatPct(typeof v === "number" ? v : null);
  return formatRatio(typeof v === "number" ? v : null);
}

export function AnalysisPanel({
  ratios,
  advice,
}: {
  ratios: FinancialRatios;
  advice: AiAdvice | null;
}) {
  return (
    <div className="space-y-5">
      <Card className="flex flex-col gap-6 md:flex-row md:items-center">
        <ScoreRing score={ratios.score} />
        <div className="grid flex-1 grid-cols-2 gap-3 text-sm md:grid-cols-4">
          {(
            [
              ["Ликвидность", ratios.scoreDetails.liquidity],
              ["Рентабельность", ratios.scoreDetails.profitability],
              ["Устойчивость", ratios.scoreDetails.stability],
              ["Эффективность", ratios.scoreDetails.efficiency],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <div className="text-muted">{label}</div>
              <div className="mt-1 font-display text-2xl tabular-nums">{value}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {RATIO_ROWS.map((row) => (
          <div
            key={row.key}
            className="flex items-center justify-between rounded-xl bg-raised px-4 py-3 text-sm"
          >
            <span className="text-muted">{row.label}</span>
            <span className="tabular-nums">{formatValue(ratios, row.key, row.kind)}</span>
          </div>
        ))}
      </div>

      {advice ? (
        <div className="space-y-4">
          <Card>
            <div className="mb-2 flex items-center gap-2 text-sm text-gold">
              <Sparkles className="size-4" />
              {advice.source === "ai" ? "ИИ-анализ" : "Экспресс-рекомендации"}
            </div>
            <p className="text-sm leading-relaxed">{advice.summary}</p>
            <p className="mt-3 text-sm text-muted">{advice.score_comment}</p>
          </Card>

          {advice.red_flags.length > 0 ? (
            <Card className="space-y-3">
              <h3 className="flex items-center gap-2 font-display text-lg text-danger">
                <AlertTriangle className="size-5" /> Красные флаги
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
                <CheckCircle2 className="size-5" /> Сильные стороны
              </h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                {advice.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Card className="space-y-4">
            <h3 className="font-display text-lg">Что делать</h3>
            {advice.recommendations.map((rec) => (
              <div key={rec.title} className="rounded-xl bg-raised p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h4 className="font-semibold">{rec.title}</h4>
                  <div className="flex gap-2 text-xs text-muted">
                    <span className="rounded-full bg-line px-2 py-1">{rec.difficulty}</span>
                    <span className="rounded-full bg-line px-2 py-1">{rec.timeframe}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm">{rec.description}</p>
                <p className="mt-1 text-sm text-muted">Эффект: {rec.expected_effect}</p>
              </div>
            ))}
          </Card>

          <Card>
            <h3 className="mb-2 font-display text-lg">Финансирование</h3>
            <p className="text-sm leading-relaxed">{advice.financing_advice}</p>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
