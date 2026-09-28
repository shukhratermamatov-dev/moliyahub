"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CurrencyRate } from "@/app/api/cbu-rates/route";
import type { RefinancingRate } from "@/app/api/cbu-refinancing-rate/route";
import { applyRateOverrides, type RateOverrideMap } from "@/lib/finance/rate-overrides";
import { useVisibleOffers } from "@/lib/store";
import { useI18n } from "@/i18n/provider";

const DATE_LOCALE: Record<string, string> = { ru: "ru-RU", uz: "uz-UZ", en: "en-US" };

// "Живая" строка под шапкой на всех страницах — курсы ЦБ РУз, основная
// ставка ЦБ (см. /api/cbu-refinancing-rate) и минимальная ставка по
// кредитам из каталога (учитывает админ-правки ставок и скрытые продукты,
// так что совпадает с тем, что видно на /financing).
export function CurrencyTicker() {
  const { locale, dict } = useI18n();
  const t = dict.shell;
  const [rates, setRates] = useState<CurrencyRate[] | null>(null);
  const [cbRate, setCbRate] = useState<RefinancingRate | null>(null);
  const [overrides, setOverrides] = useState<RateOverrideMap>({});
  const offers = useVisibleOffers();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cbu-rates")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: CurrencyRate[]) => {
        if (!cancelled && Array.isArray(data) && data.length > 0) setRates(data);
      })
      .catch(() => {});
    fetch("/api/finance/rate-overrides")
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: RateOverrideMap) => {
        if (!cancelled && data && typeof data === "object") setOverrides(data);
      })
      .catch(() => {});
    fetch("/api/cbu-refinancing-rate")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: RefinancingRate | null) => {
        if (!cancelled && data) setCbRate(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!rates) return null;

  const loanOffers = applyRateOverrides(
    offers.filter((o) => o.type === "BANK_LOAN"),
    overrides,
  );
  const minRate = loanOffers.length > 0 ? Math.min(...loanOffers.map((o) => o.rateMin)) : null;

  const updatedAt = rates[0]?.date
    ? new Date(rates[0].date).toLocaleDateString(DATE_LOCALE[locale] ?? "ru-RU", {
        day: "2-digit",
        month: "2-digit",
      })
    : null;

  return (
    <div className="border-b border-line/60 bg-surface">
      <div className="mx-auto flex max-w-6xl items-center gap-6 overflow-x-auto px-4 py-2.5 text-sm">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-primary-link">
          <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
          {t.liveLabel}
        </span>

        {minRate !== null ? (
          <span className="shrink-0 whitespace-nowrap">
            <span className="text-muted">{t.creditsFromLabel}</span>{" "}
            <b className="font-semibold">{minRate}%</b>
          </span>
        ) : null}

        {cbRate ? (
          <span className="shrink-0 whitespace-nowrap">
            <span className="text-muted">{t.cbRateLabel}</span>{" "}
            <b className="font-semibold">{cbRate.rate.toLocaleString("ru-RU", { maximumFractionDigits: 2 })}%</b>
          </span>
        ) : null}

        <span className="h-5 w-px shrink-0 bg-line" aria-hidden="true" />

        <div className="flex shrink-0 gap-6">
          {rates.map((r) => (
            <span key={r.code} className="flex items-center gap-1.5 tabular-nums">
              <span className="font-semibold text-fg">{r.code}</span>
              <span className="text-muted">{r.rate.toLocaleString("ru-RU", { maximumFractionDigits: 2 })}</span>
              <span
                className={
                  "text-xs " + (r.diff > 0 ? "text-primary-link" : r.diff < 0 ? "text-danger" : "text-muted/50")
                }
              >
                {r.diff > 0 ? "▲" : r.diff < 0 ? "▼" : "•"}
                {Math.abs(r.diff).toLocaleString("ru-RU", { maximumFractionDigits: 2 })}
              </span>
            </span>
          ))}
        </div>

        <span className="ml-auto hidden shrink-0 text-muted/60 sm:inline">
          {updatedAt ? `${t.updatedLabel} ${updatedAt}` : null}
        </span>
        <Link href={`/${locale}/financing`} className="shrink-0 font-medium text-primary-link no-underline">
          {t.allRatesLabel}
        </Link>
      </div>
    </div>
  );
}
