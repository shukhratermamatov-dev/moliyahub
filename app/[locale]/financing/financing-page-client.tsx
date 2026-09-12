"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumberField } from "@/components/ui/number-input";
import { useI18n } from "@/i18n/provider";
import { BankLogo } from "@/components/finance/bank-logo";
import { BANK_DIRECTORY, type BankCategory, type FinancingType } from "@/lib/data/banks";
import { buildRepaymentSchedule, type RepaymentMethod } from "@/lib/finance/ratios";
import { applyRateOverrides, type RateOverrideMap } from "@/lib/finance/rate-overrides";
import { pickList, pickText } from "@/lib/i18n-text";
import { SITE_IMAGES } from "@/lib/site-images";
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

const CATEGORY_ORDER: BankCategory[] = ["STATE", "JOINT_STOCK", "PRIVATE", "FOREIGN_CAPITAL"];
const METHOD_IDS: RepaymentMethod[] = ["ANNUITY", "DIFFERENTIATED"];

export function FinancingPageClient() {
  const { locale, dict } = useI18n();
  const t = dict.financing;
  const rawOffers = useVisibleOffers();
  const [rateOverrides, setRateOverrides] = useState<RateOverrideMap>({});
  // Ставки, загруженные админом через Excel (см. /admin), — публичный
  // эндпоинт отдаёт их всем посетителям, не только с этого устройства.
  // Тихо игнорируем ошибку: без override'ов просто останутся ставки по
  // умолчанию из каталога.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/finance/rate-overrides")
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: RateOverrideMap) => {
        if (!cancelled && data && typeof data === "object") setRateOverrides(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  const offers = useMemo(
    () => applyRateOverrides(rawOffers, rateOverrides),
    [rawOffers, rateOverrides],
  );
  const [type, setType] = useState<(typeof FILTER_IDS)[number]>("ALL");
  const [amount, setAmount] = useState(500_000_000);
  const [months, setMonths] = useState(24);
  const [selected, setSelected] = useState<string | null>(null);
  const [method, setMethod] = useState<RepaymentMethod>("ANNUITY");
  const [rateOverride, setRateOverride] = useState<number | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);

  const list = useMemo(() => offers.filter((o) => type === "ALL" || o.type === type), [offers, type]);
  const offer = offers.find((o) => o.id === selected) ?? list[0] ?? offers[0];
  const autoRate = offer ? Math.round(((offer.rateMin + offer.rateMax) / 2) * 10) / 10 : 0;
  const rate = rateOverride ?? autoRate;
  const isRepayable = !!offer && offer.rateMax > 0;

  // При выборе другого продукта сбрасываем ручную правку ставки — иначе
  // после переключения с кредита на другой кредит осталась бы ставка от
  // предыдущего выбора, что запутывает.
  useEffect(() => {
    setRateOverride(null);
  }, [selected]);

  const schedule = useMemo(
    () => (isRepayable ? buildRepaymentSchedule(amount, rate, months, method) : []),
    [isRepayable, amount, rate, months, method],
  );
  const firstPayment = schedule[0]?.payment ?? 0;
  const lastPayment = schedule[schedule.length - 1]?.payment ?? 0;
  const totalInterest = schedule.reduce((sum, row) => sum + row.interestPart, 0);
  const totalPayment = schedule.reduce((sum, row) => sum + row.payment, 0);

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-display text-3xl md:text-4xl">{t.title}</h1>
        <p className="mt-2 max-w-2xl text-muted">{t.subtitle}</p>

        <div className="relative mt-6 h-40 overflow-hidden rounded-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.07)] md:h-56">
          <img
            src={SITE_IMAGES.smallBusinessOwner.src}
            alt={SITE_IMAGES.smallBusinessOwner.alt}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/20 to-transparent" />
          <p className="absolute inset-x-0 bottom-0 p-4 font-display text-base text-fg md:p-5 md:text-lg">
            {t.bannerCaption}
          </p>
        </div>

        <Card className="mt-8">
          <h2 className="font-display text-xl">{t.calculatorHeading}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block text-muted">{t.amountLabel}</span>
              <NumberField value={amount} onValueChange={(n) => setAmount(n || 0)} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted">{t.termLabel}</span>
              <Input
                type="number"
                value={months}
                onChange={(e) => setMonths(Number(e.target.value) || 1)}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted">{t.rateLabel}</span>
              <Input
                type="number"
                step="0.1"
                disabled={!isRepayable}
                value={rate}
                onChange={(e) => setRateOverride(Number(e.target.value) || 0)}
              />
            </label>
          </div>

          {isRepayable ? (
            <>
              <div className="mt-4 flex flex-wrap gap-2">
                {METHOD_IDS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMethod(id)}
                    className={`min-h-10 rounded-full px-4 text-sm ${
                      method === id ? "bg-primary text-primary-fg" : "bg-raised text-muted"
                    }`}
                  >
                    {id === "ANNUITY" ? t.methodAnnuity : t.methodDifferentiated}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-raised p-3">
                  <div className="text-sm text-muted">
                    {method === "ANNUITY" ? t.paymentEstimateLabel : t.firstPaymentLabel}
                  </div>
                  <div className="mt-1 font-display text-2xl tabular-nums">
                    {formatMoney(Math.round(firstPayment), locale)}
                  </div>
                </div>
                {method === "DIFFERENTIATED" ? (
                  <div className="rounded-xl bg-raised p-3">
                    <div className="text-sm text-muted">{t.lastPaymentLabel}</div>
                    <div className="mt-1 font-display text-2xl tabular-nums">
                      {formatMoney(Math.round(lastPayment), locale)}
                    </div>
                  </div>
                ) : null}
                <div className="rounded-xl bg-raised p-3">
                  <div className="text-sm text-muted">{t.totalInterestLabel}</div>
                  <div className="mt-1 font-display text-2xl tabular-nums">
                    {formatMoney(Math.round(totalInterest), locale)}
                  </div>
                </div>
                <div className="rounded-xl bg-raised p-3">
                  <div className="text-sm text-muted">{t.totalPaymentLabel}</div>
                  <div className="mt-1 font-display text-2xl tabular-nums">
                    {formatMoney(Math.round(totalPayment), locale)}
                  </div>
                  <div className="text-xs text-muted">
                    {offer ? pickText(offer.bank, locale) : ""} · {t.averageRate} {rate}%
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSchedule((v) => !v)}
                className="mt-4 text-sm text-primary hover:underline"
              >
                {showSchedule ? t.hideScheduleLabel : t.showScheduleLabel}
              </button>

              {showSchedule ? (
                <div className="mt-3 max-h-80 overflow-auto rounded-xl bg-raised">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-raised text-xs text-muted">
                      <tr>
                        <th className="px-3 py-2 text-left">{t.scheduleMonthHeader}</th>
                        <th className="px-3 py-2 text-right">{t.schedulePaymentHeader}</th>
                        <th className="px-3 py-2 text-right">{t.schedulePrincipalHeader}</th>
                        <th className="px-3 py-2 text-right">{t.scheduleInterestHeader}</th>
                        <th className="px-3 py-2 text-right">{t.scheduleBalanceHeader}</th>
                      </tr>
                    </thead>
                    <tbody className="tabular-nums">
                      {schedule.map((row) => (
                        <tr key={row.month} className="border-t border-line/60">
                          <td className="px-3 py-1.5">{row.month}</td>
                          <td className="px-3 py-1.5 text-right">
                            {formatMoney(Math.round(row.payment), locale)}
                          </td>
                          <td className="px-3 py-1.5 text-right text-muted">
                            {formatMoney(Math.round(row.principalPart), locale)}
                          </td>
                          <td className="px-3 py-1.5 text-right text-muted">
                            {formatMoney(Math.round(row.interestPart), locale)}
                          </td>
                          <td className="px-3 py-1.5 text-right text-muted">
                            {formatMoney(Math.round(row.balance), locale)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </>
          ) : (
            <div className="mt-4 rounded-xl bg-raised p-3 text-sm text-muted">{t.noPercent}</div>
          )}
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
                <div className="flex items-start gap-3">
                  <BankLogo name={pickText(o.bank, locale)} logoDomain={o.logoDomain} size={36} />
                  <div>
                    <div className="text-xs text-gold">{pickText(o.bank, locale)}</div>
                    <h3 className="mt-1 font-display text-xl">{pickText(o.title, locale)}</h3>
                  </div>
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
              <p className="mt-2 text-sm text-muted">{pickText(o.note, locale)}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {pickList(o.purpose, locale).map((p) => (
                  <span key={p} className="rounded-full bg-raised px-2 py-0.5 text-xs text-muted">
                    {p}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        <Card className="mt-10">
          <h2 className="font-display text-xl">{dict.bankDirectory.heading}</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">{dict.bankDirectory.subtitle}</p>
          <div className="mt-6 space-y-6">
            {CATEGORY_ORDER.map((category) => {
              const banks = BANK_DIRECTORY.filter((b) => b.category === category);
              if (banks.length === 0) return null;
              return (
                <div key={category}>
                  <h3 className="text-sm font-medium text-gold">
                    {dict.bankDirectory.categories[category]} ({banks.length})
                  </h3>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {banks.map((bank) => (
                      <div
                        key={bank.id}
                        className="flex items-start gap-3 rounded-xl bg-raised p-3 text-sm shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
                      >
                        <BankLogo name={pickText(bank.name, locale)} logoDomain={bank.logoDomain} size={28} />
                        <div>
                          <div>{pickText(bank.name, locale)}</div>
                          <div className="mt-1 text-xs text-muted">{dict.bankDirectory.disclaimer}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href={`/${locale}/projects`}>{t.goToProjects}</Link>
          </Button>
          <Button asChild variant="outline">
            <a href="https://infokredit.uz/ru" target="_blank" rel="noopener noreferrer">
              {t.creditCheckButton}
            </a>
          </Button>
        </div>
      </div>
    </Shell>
  );
}
