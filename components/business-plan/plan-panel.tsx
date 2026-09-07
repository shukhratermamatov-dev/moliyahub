"use client";

import { Card } from "@/components/ui/card";
import type { Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/provider";
import type { BusinessPlan, BusinessPlanFinancialLine } from "@/lib/business-plan/types";
import { formatMoney } from "@/lib/utils";

function Section({ heading, body }: { heading: string; body: string }) {
  if (!body) return null;
  return (
    <div className="mb-5">
      <h3 className="mb-1.5 text-sm font-semibold text-gold">{heading}</h3>
      <p className="whitespace-pre-line text-sm leading-relaxed text-fg/90">{body}</p>
    </div>
  );
}

function LineTable({
  heading,
  lines,
  locale,
}: {
  heading: string;
  lines: BusinessPlanFinancialLine[];
  locale: Locale;
}) {
  if (lines.length === 0) return null;
  const total = lines.reduce((s, l) => s + l.amount, 0);
  return (
    <div className="mb-4">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{heading}</h4>
      <div className="overflow-hidden rounded-xl bg-raised">
        <table className="w-full text-sm">
          <tbody>
            {lines.map((l, i) => (
              <tr key={`${l.label}-${i}`} className="border-b border-line/60 last:border-0">
                <td className="px-3 py-2 text-fg/90">
                  {l.label}
                  {l.note ? <span className="ml-1 text-xs text-muted">({l.note})</span> : null}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{formatMoney(l.amount, locale)}</td>
              </tr>
            ))}
            <tr className="bg-surface font-semibold">
              <td className="px-3 py-2">Итого</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatMoney(total, locale)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PlanPanel({ plan }: { plan: BusinessPlan }) {
  const { locale, dict } = useI18n();
  const t = dict.businessPlanAi;

  const revenueTotal = plan.financials.monthlyRevenue.reduce((s, l) => s + l.amount, 0);
  const costsTotal = plan.financials.monthlyCosts.reduce((s, l) => s + l.amount, 0);
  const monthlyProfit = revenueTotal - costsTotal;

  return (
    <Card>
      <div className="mb-1 text-xs text-gold">
        {plan.subIndustryLabel ? `${plan.industryLabel} · ${plan.subIndustryLabel}` : plan.industryLabel}
        {plan.region ? ` · ${plan.region}` : ""}
      </div>
      <h2 className="mb-4 font-display text-2xl">
        {t.resultTitlePrefix} {plan.projectName}
      </h2>

      <Section heading={t.summaryHeading} body={plan.executiveSummary} />
      <Section heading={t.companyHeading} body={plan.companyDescription} />
      <Section heading={t.marketUzHeading} body={plan.marketAnalysisUzbekistan} />

      {plan.marketAnalysisForeign.length > 0 ? (
        <div className="mb-5">
          <h3 className="mb-2 text-sm font-semibold text-gold">{t.marketForeignHeading}</h3>
          <div className="flex flex-col gap-3">
            {plan.marketAnalysisForeign.map((m, i) => (
              <div key={`${m.country}-${i}`} className="rounded-xl bg-raised p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{m.country}</p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-fg/90">{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <Section heading={t.marketingHeading} body={plan.marketing} />
      <Section heading={t.operationsHeading} body={plan.operations} />
      <Section heading={t.organizationHeading} body={plan.organization} />
      <Section heading={t.risksHeading} body={plan.risks} />

      <div className="mt-6 border-t border-line pt-5">
        <h3 className="mb-1.5 text-sm font-semibold text-gold">{t.financialsHeading}</h3>
        <p className="mb-4 text-xs leading-relaxed text-muted">{t.financialsDisclaimer}</p>

        <div className="mb-4 flex items-center justify-between rounded-xl bg-surface px-3 py-2.5 text-sm shadow-[0_0_0_1px_rgba(255,255,255,0.07)]">
          <span className="text-muted">{dict.projectsNew.amountLabel}</span>
          <span className="font-semibold tabular-nums">{formatMoney(plan.financials.initialInvestment, locale)}</span>
        </div>

        <LineTable heading={t.startupCostsLabel} lines={plan.financials.startupCosts} locale={locale} />
        <LineTable heading={t.monthlyRevenueLabel} lines={plan.financials.monthlyRevenue} locale={locale} />
        <LineTable heading={t.monthlyCostsLabel} lines={plan.financials.monthlyCosts} locale={locale} />

        <div className="mb-4 grid gap-2 rounded-xl bg-raised p-4 text-sm">
          <div className="flex items-center justify-between font-medium">
            <span>{t.profitLabel}</span>
            <span className="tabular-nums">{formatMoney(monthlyProfit, locale)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">{t.breakEvenLabel}</span>
            <span className="tabular-nums">
              {plan.financials.breakEvenMonths} {t.monthsShort}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">{t.paybackLabel}</span>
            <span className="tabular-nums">
              {plan.financials.paybackMonths} {t.monthsShort}
            </span>
          </div>
        </div>

        {plan.financials.assumptions ? (
          <div className="mb-2">
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{t.assumptionsLabel}</h4>
            <p className="whitespace-pre-line text-sm leading-relaxed text-fg/90">{plan.financials.assumptions}</p>
          </div>
        ) : null}
      </div>

      {plan.sources.length > 0 ? (
        <div className="mt-6 border-t border-line pt-5">
          <h3 className="mb-2 text-sm font-semibold text-gold">{t.sourcesHeading}</h3>
          <ul className="flex flex-col gap-1.5">
            {plan.sources.map((s, i) => (
              <li key={`${s.url}-${i}`} className="text-xs">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
