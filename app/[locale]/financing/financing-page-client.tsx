"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/provider";
import type { FinancingType } from "@/lib/data/banks";
import { monthlyPayment } from "@/lib/finance/ratios";
import { useVisibleOffers } from "@/lib/store";
import { formatMoney } from "@/lib/utils";

const FILTER_IDS: ("ALL" | FinancingType)[] = [
  "ALL",
  "BANK_LOAN",
  "ISLAMIC",
  "LEASING",
  "VENTURE",
  "CROWDFUNDING",
  "GRANT",
];

export function FinancingPageClient() {
  const { locale, dict } = useI18n();
  const t = dict.financing;
  const offers = useVisibleOffers();
  const [type, setType] = useState<(typeof FILTER_IDS)[number]>("ALL");
  const [amount, setAmount] = useState(500_000_000);
  const [months, setMonths] = useState(24);
  const [selected, setSelected] = useState<string | null>(null);

  const list = useMemo(() => offers.filter((o) => type === "ALL" || o.type === type), [offers, type]);
  const offer = offers.find((o) => o.id === selected) ?? list[0] ?? offers[0];
  const rate = offer ? (offer.rateMin + offer.rateMax) / 2 : 0;
  const payment = offer && offer.rateMax > 0 ? monthlyPayment(amount, rate, months) : 0;

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-display text-3xl md:text-4xl">{t.title}</h1>
        <p className="mt-2 max-w-2xl text-muted">{t.subtitle}</p>

        <Card className="mt-8">
          <h2 className="font-display text-xl">{t.calculatorHeading}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block text-muted">{t.amountLabel}</span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted">{t.termLabel}</span>
              <Input
                type="number"
                value={months}
                onChange={(e) => setMonths(Number(e.target.value) || 1)}
              />
            </label>
            <div className="rounded-xl bg-raised p-3">
              <div className="text-sm text-muted">{t.paymentEstimateLabel}</div>
              <div className="mt-1 font-display text-2xl tabular-nums">
                {offer?.rateMax === 0 ? t.noPercent : formatMoney(Math.round(payment), locale)}
              </div>
              <div className="text-xs text-muted">
                {offer?.bank} · {t.averageRate} {rate}%
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-6 flex flex-wrap gap-2">
          {FILTER_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setType(id)}
              className={`min-h-10 rounded-full px-4 text-sm ${
                type === id ? "bg-primary text-primary-fg" : "bg-raised text-muted"
              }`}
            >
              {t.filters[id]}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {list.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setSelected(o.id)}
              className={`rounded-2xl bg-surface p-5 text-left shadow-[0_0_0_1px_rgba(255,255,255,0.07)] transition-shadow ${
                (selected ?? list[0]?.id) === o.id ? "shadow-[0_0_0_1px_var(--color-primary)]" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-gold">{o.bank}</div>
                  <h3 className="mt-1 font-display text-xl">{o.title}</h3>
                </div>
                <span className="rounded-full bg-line px-2 py-1 text-xs text-muted">
                  {dict.financingTypes[o.type]}
                </span>
              </div>
              <p className="mt-3 text-sm tabular-nums">
                {o.rateMax === 0 ? t.interestFree : `${o.rateMin}–${o.rateMax}%`} · {o.termMin}–{o.termMax}{" "}
                {t.monthsShort}
              </p>
              <p className="mt-1 text-sm text-muted">
                {formatMoney(o.minAmount, locale)} — {formatMoney(o.maxAmount, locale)}
              </p>
              <p className="mt-2 text-sm text-muted">{o.note}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {o.purpose.map((p) => (
                  <span key={p} className="rounded-full bg-raised px-2 py-0.5 text-xs text-muted">
                    {p}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8">
          <Button asChild>
            <Link href={`/${locale}/projects`}>{t.goToProjects}</Link>
          </Button>
        </div>
      </div>
    </Shell>
  );
}
