"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BankLogo } from "@/components/finance/bank-logo";
import { Card } from "@/components/ui/card";
import type { Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/provider";
import { BANK_DIRECTORY, OFFERS, type FinancingType } from "@/lib/data/banks";
import { pickText } from "@/lib/i18n-text";
import type { BankOfferDto } from "@/app/api/finance/bank-offers/route";

const PICK_TYPES: FinancingType[] = ["BANK_LOAN", "ISLAMIC", "LEASING"];
const PICKS_PER_TYPE = 3;

type Pick = {
  id: string;
  bankName: string;
  rateMin: number;
  rateMax: number;
  logoDomain?: string;
};

// Лёгкий, самостоятельный виджет-подборка «Предложения с наиболее низкой
// ставкой» под результатами финансового анализа — отдельно по кредитам,
// исламскому финансированию и лизингу (по запросу пользователя). Намеренно
// не переиспользует полную логику /financing (админские rate-overrides и
// т.д.) — это превью с ссылкой на полный калькулятор, а не сам калькулятор,
// поэтому дублирование минимальной части логики (лучшая ставка по банку с
// bank.uz) безопаснее, чем рефакторинг уже работающей страницы «Финансирование».
export function FinancingPicks({ locale }: { locale: Locale }) {
  const { dict } = useI18n();
  const t = dict.financingPicks;
  const [bankOffers, setBankOffers] = useState<BankOfferDto[]>([]);

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

  // Лучшая (минимальная) реальная ставка по каждому банку из bank.uz —
  // та же идея, что и в financing-page-client.tsx, но без учёта rate-overrides.
  const bankUzPicks: Pick[] = useMemo(() => {
    const bestByBank = new Map<string, BankOfferDto>();
    for (const o of bankOffers) {
      if (!o.bankId || o.rateMin === null) continue;
      const existing = bestByBank.get(o.bankId);
      if (!existing || (existing.rateMin ?? Infinity) > o.rateMin) {
        bestByBank.set(o.bankId, o);
      }
    }
    return Array.from(bestByBank.entries()).map(([bankId, o]) => {
      const directoryEntry = BANK_DIRECTORY.find((b) => b.id === bankId);
      return {
        id: `bankuz-${bankId}`,
        bankName: directoryEntry ? pickText(directoryEntry.name, locale) : o.bankNameRaw,
        rateMin: o.rateMin ?? 0,
        rateMax: o.rateMax ?? o.rateMin ?? 0,
        logoDomain: directoryEntry?.logoDomain,
      };
    });
  }, [bankOffers, locale]);

  const picksByType = useMemo(() => {
    const result: Record<FinancingType, Pick[]> = {
      BANK_LOAN: [],
      ISLAMIC: [],
      LEASING: [],
      VENTURE: [],
      CROWDFUNDING: [],
      GRANT: [],
    };
    for (const type of PICK_TYPES) {
      const pool: Pick[] =
        type === "BANK_LOAN" && bankUzPicks.length > 0
          ? bankUzPicks
          : OFFERS.filter((o) => o.type === type).map((o) => ({
              id: o.id,
              bankName: pickText(o.bank, locale),
              rateMin: o.rateMin,
              rateMax: o.rateMax,
              logoDomain: o.logoDomain,
            }));
      result[type] = [...pool].sort((a, b) => a.rateMin - b.rateMin).slice(0, PICKS_PER_TYPE);
    }
    return result;
  }, [bankUzPicks, locale]);

  const hasAnyPicks = PICK_TYPES.some((type) => picksByType[type].length > 0);
  if (!hasAnyPicks) return null;

  return (
    <Card className="space-y-4">
      <div>
        <h3 className="font-display text-lg">{t.heading}</h3>
        <p className="mt-1 text-sm text-muted">{t.subtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {PICK_TYPES.map((type) =>
          picksByType[type].length > 0 ? (
            <div key={type} className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-gold">
                {dict.financingTypes[type]}
              </div>
              <div className="space-y-2">
                {picksByType[type].map((pick) => (
                  <div key={pick.id} className="flex items-center gap-2 rounded-xl bg-raised px-3 py-2 text-sm">
                    <BankLogo name={pick.bankName} logoDomain={pick.logoDomain} size={24} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{pick.bankName}</div>
                      <div className="tabular-nums text-xs text-muted">
                        {pick.rateMin === pick.rateMax
                          ? `${pick.rateMin}${t.rateSuffix}`
                          : `${pick.rateMin}–${pick.rateMax}${t.rateSuffix}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href={`/${locale}/financing?type=${type}`}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                {t.detailsLink}
                <ArrowRight className="size-3" aria-hidden="true" />
              </Link>
            </div>
          ) : null,
        )}
      </div>
    </Card>
  );
}
