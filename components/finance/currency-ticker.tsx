"use client";

import { useEffect, useState } from "react";
import type { CurrencyRate } from "@/app/api/cbu-rates/route";
import { useI18n } from "@/i18n/provider";

export function CurrencyTicker() {
  const { dict } = useI18n();
  const [rates, setRates] = useState<CurrencyRate[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cbu-rates")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: CurrencyRate[]) => {
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setRates(data);
        }
      })
      .catch(() => {
        // тихо игнорируем — тикер просто не появится
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!rates) return null;

  return (
    <div className="border-b border-line/60 bg-raised/50">
      <div className="mx-auto flex max-w-6xl items-center gap-4 overflow-x-auto px-4 py-1.5 text-xs text-muted">
        <span className="shrink-0 text-muted/60">{dict.shell.cbuRatesLabel}</span>
        {rates.map((r) => (
          <span key={r.code} className="flex shrink-0 items-center gap-1 tabular-nums">
            <span className="font-medium text-fg">{r.code}</span>
            <span>{r.rate.toLocaleString("ru-RU", { maximumFractionDigits: 2 })}</span>
            <span
              className={
                r.diff > 0 ? "text-primary" : r.diff < 0 ? "text-gold" : "text-muted/50"
              }
            >
              {r.diff > 0 ? "▲" : r.diff < 0 ? "▼" : "•"}
              {Math.abs(r.diff).toLocaleString("ru-RU", { maximumFractionDigits: 2 })}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
