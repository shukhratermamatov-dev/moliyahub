"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ScoreRing } from "@/components/finance/score-ring";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";

// Экспресс-виджет в hero — упрощённая, ИЛЛЮСТРАТИВНАЯ прикидка по 4 цифрам
// (маржа + текущая ликвидность), а не вызов настоящего движка скоринга
// (calculateRatios из lib/finance/ratios.ts — тому нужны все 15 полей
// баланса и ОПУ). Задача виджета — за секунды показать логику и
// подтолкнуть к полному расчёту на /analyze, как в макете редизайна.
const clamp = (x: number) => Math.max(0, Math.min(1, x));

function scoreFrom(revenue: number, profit: number, assets: number, debts: number) {
  const margin = revenue > 0 ? profit / revenue : 0;
  const liq = debts > 0 ? assets / debts : 0;
  const score = Math.round(clamp(margin / 0.2) * 50 + clamp((liq - 0.5) / 1.5) * 50);
  return { margin, liq, score };
}

export function MiniScoringWidget() {
  const { locale, dict } = useI18n();
  const t = dict.home.miniScoring;
  const [revenue, setRevenue] = useState(2400);
  const [profit, setProfit] = useState(260);
  const [assets, setAssets] = useState(900);
  const [debts, setDebts] = useState(520);

  const { margin, liq, score } = useMemo(
    () => scoreFrom(revenue, profit, assets, debts),
    [revenue, profit, assets, debts],
  );
  const label = score >= 70 ? t.labelGood : score >= 45 ? t.labelMid : t.labelLow;

  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-line/70 bg-raised p-7 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between">
        <span className="font-display text-lg">{t.title}</span>
        <span className="text-xs text-muted">{t.unit}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 text-xs text-muted">
          {t.revenue}
          <Input
            type="number"
            value={revenue}
            onChange={(e) => setRevenue(Number(e.target.value) || 0)}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-muted">
          {t.profit}
          <Input type="number" value={profit} onChange={(e) => setProfit(Number(e.target.value) || 0)} />
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-muted">
          {t.assets}
          <Input type="number" value={assets} onChange={(e) => setAssets(Number(e.target.value) || 0)} />
        </label>
        <label className="flex flex-col gap-1.5 text-xs text-muted">
          {t.debts}
          <Input type="number" value={debts} onChange={(e) => setDebts(Number(e.target.value) || 0)} />
        </label>
      </div>

      <div className="flex items-center gap-6 rounded-2xl bg-inset p-5">
        <ScoreRing score={score} label={t.of100} />
        <div className="flex flex-1 flex-col gap-2.5">
          <div
            className={
              "font-semibold " +
              (score >= 70 ? "text-ok" : score >= 45 ? "text-warn" : "text-danger")
            }
          >
            {label}
          </div>
          <div className="flex justify-between text-sm text-muted">
            <span>{t.margin}</span>
            <span className="font-semibold text-fg">{(margin * 100).toFixed(1).replace(".", ",")}%</span>
          </div>
          <div className="flex justify-between text-sm text-muted">
            <span>{t.liquidity}</span>
            <span className="font-semibold text-fg">{liq.toFixed(2).replace(".", ",")}</span>
          </div>
          <div className="text-xs leading-relaxed text-muted/80">{t.note}</div>
        </div>
      </div>

      <Button asChild size="lg" className="!bg-fg !text-bg hover:brightness-95">
        <Link href={`/${locale}/analyze`}>{t.cta}</Link>
      </Button>
    </div>
  );
}
