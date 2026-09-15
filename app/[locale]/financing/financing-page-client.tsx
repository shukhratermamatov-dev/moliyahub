"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumberField } from "@/components/ui/number-input";
import { useI18n } from "@/i18n/provider";
import { BankLogo } from "@/components/finance/bank-logo";
import { BANK_DIRECTORY, type BankCategory, type FinancingOffer, type FinancingType } from "@/lib/data/banks";
import { buildRepaymentSchedule, type RepaymentMethod } from "@/lib/finance/ratios";
import { applyRateOverrides, type RateOverrideMap } from "@/lib/finance/rate-overrides";
import { pickList, pickText } from "@/lib/i18n-text";
import { SITE_IMAGES } from "@/lib/site-images";
import { useVisibleOffers } from "@/lib/store";
import { formatMoney } from "@/lib/utils";
import type { BankOfferDto } from "@/app/api/finance/bank-offers/route";

// Кредиты, которые раньше показывались как иллюстративные примеры ставок —
// при наличии реальных данных с bank.uz они заменяются (см. useMemo ниже),
// при сбое скрейпа/fetch остаются как надёжный фолбэк.
const STATIC_BANK_LOAN_IDS = new Set([
  "nbu-invest",
  "asaka-oborot",
  "ipak-sme",
  "hamkor-agro",
  "kapital-express",
]);

const BANK_UZ_MAX_CARDS = 8;

const DATE_LOCALE: Record<string, string> = { ru: "ru-RU", uz: "uz-UZ", en: "en-US" };

function formatUpdatedDate(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleDateString(DATE_LOCALE[locale] ?? "ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

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
  const searchParams = useSearchParams();
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
  const [bankOffers, setBankOffers] = useState<BankOfferDto[]>([]);
  // Реальные ставки по бизнес-кредитам с bank.uz (см. lib/scrapers/bank-uz.ts,
  // обновляется раз в сутки фоновым cron). Тихо игнорируем ошибку — без этих
  // данных карточки банковских кредитов просто останутся иллюстративными.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/finance/bank-offers")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: BankOfferDto[]) => {
        if (!cancelled && Array.isArray(data)) setBankOffers(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // По каждому банку — одно предложение с минимальной опубликованной ставкой
  // (без ставки показывать в калькуляторе нечестно — такие предложения сюда
  // не попадают, но сами остаются видны в справочнике ниже).
  const bankUzOffers: FinancingOffer[] = useMemo(() => {
    const bestByBank = new Map<string, BankOfferDto>();
    for (const o of bankOffers) {
      if (!o.bankId || o.rateMin === null) continue;
      const existing = bestByBank.get(o.bankId);
      if (!existing || (existing.rateMin ?? Infinity) > o.rateMin) {
        bestByBank.set(o.bankId, o);
      }
    }

    return Array.from(bestByBank.entries())
      .sort(([, a], [, b]) => (a.rateMin ?? Infinity) - (b.rateMin ?? Infinity))
      .slice(0, BANK_UZ_MAX_CARDS)
      .map(([bankId, o]) => {
        const directoryEntry = BANK_DIRECTORY.find((b) => b.id === bankId);
        const termMonths = o.termYears ? Math.round(o.termYears * 12) : 12;
        return {
          id: `bankuz-${bankId}`,
          bank: directoryEntry?.name ?? { ru: o.bankNameRaw, uz: o.bankNameRaw, en: o.bankNameRaw },
          type: "BANK_LOAN",
          title: { ru: o.productName, uz: o.productName, en: o.productName },
          rateMin: o.rateMin ?? 0,
          rateMax: o.rateMax ?? o.rateMin ?? 0,
          termMin: termMonths,
          termMax: termMonths,
          minAmount: 0,
          maxAmount: o.amountMax ?? 0,
          // Намеренно пусто — у bank.uz нет структурированного назначения
          // кредита, не выдумываем теги.
          purpose: { ru: [], uz: [], en: [] },
          islamic: false,
          note: {
            ru: "По данным bank.uz",
            uz: "bank.uz maʼlumotlariga koʻra",
            en: "Based on bank.uz data",
          },
          logoDomain: directoryEntry?.logoDomain,
          sourceUrl: o.sourceUrl,
          amountCurrency: o.amountCurrency ?? "UZS",
        } satisfies FinancingOffer;
      });
  }, [bankOffers]);

  const bankUzUpdatedAt = useMemo(() => {
    if (bankOffers.length === 0) return null;
    return bankOffers.reduce((max, o) => (o.scrapedAt > max ? o.scrapedAt : max), bankOffers[0].scrapedAt);
  }, [bankOffers]);

  // По каждому банку из справочника — все сматченные предложения с bank.uz
  // (не только лучшее), для диапазона ставок и количества в разделе ниже.
  const bankUzByBankId = useMemo(() => {
    const map = new Map<string, BankOfferDto[]>();
    for (const o of bankOffers) {
      if (!o.bankId) continue;
      const arr = map.get(o.bankId);
      if (arr) arr.push(o);
      else map.set(o.bankId, [o]);
    }
    return map;
  }, [bankOffers]);

  const offers = useMemo(() => {
    const withOverrides = applyRateOverrides(rawOffers, rateOverrides);
    // Заменяем иллюстративные карточки банковских кредитов реальными только
    // если данные bank.uz действительно загрузились — иначе лучше показать
    // старые примеры, чем пустой раздел.
    if (bankUzOffers.length === 0) return withOverrides;
    return [
      ...withOverrides.filter((o) => !STATIC_BANK_LOAN_IDS.has(o.id)),
      ...bankUzOffers,
    ];
  }, [rawOffers, rateOverrides, bankUzOffers]);
  const [type, setType] = useState<(typeof FILTER_IDS)[number]>("ALL");
  const [amount, setAmount] = useState(500_000_000);
  const [months, setMonths] = useState(24);
  const [selected, setSelected] = useState<string | null>(null);
  // Диплинк с гида по исламскому финансированию (?type=ISLAMIC&offer=murabaha) —
  // открываем нужный фильтр и подсвечиваем конкретное предложение.
  useEffect(() => {
    const typeParam = searchParams.get("type");
    if (typeParam && (FILTER_IDS as string[]).includes(typeParam)) {
      setType(typeParam as (typeof FILTER_IDS)[number]);
    }
    const offerParam = searchParams.get("offer");
    if (offerParam) {
      setSelected(offerParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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

        {type === "ISLAMIC" ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-raised p-4">
            <p className="text-sm text-muted">{t.islamicGuideBanner.text}</p>
            <Button asChild variant="outline" size="sm">
              <Link href={`/${locale}/islamic-finance`}>{t.islamicGuideBanner.cta}</Link>
            </Button>
          </div>
        ) : null}

        {bankUzUpdatedAt ? (
          <p className="mt-3 text-xs text-muted">
            {t.bankUzUpdatedLabel(formatUpdatedDate(bankUzUpdatedAt, locale))} · {t.bankUzNote}
          </p>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {list.map((o) => {
            const purposeTags = pickList(o.purpose, locale);
            const rateLabel =
              o.rateMax === 0
                ? t.interestFree
                : o.rateMin === o.rateMax
                  ? `${o.rateMin}%`
                  : `${o.rateMin}–${o.rateMax}%`;
            const termLabel =
              o.termMin === o.termMax
                ? `${t.upToLabel} ${o.termMin} ${t.monthsShort}`
                : `${o.termMin}–${o.termMax} ${t.monthsShort}`;
            const currency = o.amountCurrency ?? "UZS";
            const amountLabel =
              o.maxAmount === 0
                ? t.amountUnknown
                : o.minAmount === 0
                  ? `${t.upToLabel} ${formatMoney(o.maxAmount, locale, currency)}`
                  : `${formatMoney(o.minAmount, locale, currency)} — ${formatMoney(o.maxAmount, locale, currency)}`;
            return (
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
                  {rateLabel} · {termLabel}
                </p>
                <p className="mt-1 text-sm text-muted">{amountLabel}</p>
                <p className="mt-2 text-sm text-muted">{pickText(o.note, locale)}</p>
                {purposeTags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {purposeTags.map((p) => (
                      <span key={p} className="rounded-full bg-raised px-2 py-0.5 text-xs text-muted">
                        {p}
                      </span>
                    ))}
                  </div>
                ) : null}
                {o.sourceUrl ? (
                  <a
                    href={o.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 inline-block text-xs text-primary hover:underline"
                  >
                    {t.viewOnBankUz}
                  </a>
                ) : null}
              </button>
            );
          })}
        </div>

        <Card className="mt-10">
          <h2 className="font-display text-xl">{dict.bankDirectory.heading}</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">{dict.bankDirectory.subtitle}</p>
          {bankUzUpdatedAt ? (
            <p className="mt-1 text-xs text-muted">
              {t.bankUzUpdatedLabel(formatUpdatedDate(bankUzUpdatedAt, locale))}
            </p>
          ) : null}
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
                    {banks.map((bank) => {
                      const bankOffersForBank = bankUzByBankId.get(bank.id);
                      const rates = bankOffersForBank
                        ?.map((o) => o.rateMin)
                        .filter((r): r is number => r !== null);
                      const rateMaxes = bankOffersForBank
                        ?.map((o) => o.rateMax)
                        .filter((r): r is number => r !== null);
                      const rateMin = rates && rates.length > 0 ? Math.min(...rates) : null;
                      const rateMax = rateMaxes && rateMaxes.length > 0 ? Math.max(...rateMaxes) : null;
                      const sourceUrl = bankOffersForBank?.[0]?.sourceUrl;
                      return (
                        <div
                          key={bank.id}
                          className="flex items-start gap-3 rounded-xl bg-raised p-3 text-sm shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
                        >
                          <BankLogo name={pickText(bank.name, locale)} logoDomain={bank.logoDomain} size={28} />
                          <div>
                            <div>{pickText(bank.name, locale)}</div>
                            {bankOffersForBank && bankOffersForBank.length > 0 ? (
                              <div className="mt-1 text-xs text-muted">
                                {rateMin !== null
                                  ? rateMin === rateMax
                                    ? `${rateMin}%`
                                    : `${rateMin}–${rateMax}%`
                                  : dict.bankDirectory.disclaimer}
                                {" · "}
                                {dict.bankDirectory.offersCountLabel(bankOffersForBank.length)}
                                {sourceUrl ? (
                                  <>
                                    {" · "}
                                    <a
                                      href={sourceUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline"
                                    >
                                      {t.viewOnBankUz}
                                    </a>
                                  </>
                                ) : null}
                              </div>
                            ) : (
                              <div className="mt-1 text-xs text-muted">{dict.bankDirectory.disclaimer}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
