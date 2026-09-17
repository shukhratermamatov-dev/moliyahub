"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast, Toaster } from "sonner";
import { AnalysisPanel } from "@/components/finance/analysis-panel";
import { VarianceDashboard } from "@/components/finance/variance-dashboard";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumberField } from "@/components/ui/number-input";
import { useI18n } from "@/i18n/provider";
import { requestAiAdvice } from "@/lib/ai/analyze";
import { computeSubtotals, deriveAggregates } from "@/lib/finance/aggregate";
import { buildRuleAdvice } from "@/lib/finance/advice";
import { computeFrozenAssets, computeMarginBridge, computeRevenueSafetyMargin } from "@/lib/finance/insights";
import { calculateRatios } from "@/lib/finance/ratios";
import {
  DEMO_FINANCE_DATA,
  EMPTY_FINANCE_DATA,
  FINANCE_GROUPS,
  WEAK_FINANCE_DATA,
  type AiAdvice,
  type FinanceData,
  type FinanceFieldKey,
  type FinanceGroupKey,
  type FinancePeriod,
} from "@/lib/finance/types";
import { computeVariance } from "@/lib/finance/variance";
import { INDUSTRIES } from "@/lib/data/industries";
import { REGIONS } from "@/lib/data/regions";
import { pickText } from "@/lib/i18n-text";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/utils";
import { saveAnalysisAction } from "./actions";

const BALANCE_GROUPS: FinanceGroupKey[] = [
  "longTermAssets",
  "currentAssets",
  "equity",
  "longTermLiabilities",
  "currentLiabilities",
];

const selectClass = "h-11 w-full rounded-xl bg-raised px-3 text-sm";

function groupFields(key: FinanceGroupKey): FinanceFieldKey[] {
  return FINANCE_GROUPS.find((g) => g.key === key)?.fields ?? [];
}

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 16 }, (_, i) => CURRENT_YEAR - i);

type ComputedPeriod = {
  year: number;
  data: FinanceData;
  aggregate: ReturnType<typeof deriveAggregates>;
  subtotals: ReturnType<typeof computeSubtotals>;
  ratios: ReturnType<typeof calculateRatios>;
};

// Один блок «Баланс + ОПУ» для одного отчётного периода — используется дважды
// (период 1 всегда, период 2 — если пользователь его добавил), чтобы не
// дублировать разметку полей.
function PeriodFieldsCard({
  periodIndex,
  period,
  yearLabel,
  removable,
  sideBySide,
  onYearChange,
  onFieldChange,
  onRemove,
  removeLabel,
  dict,
  locale,
  t,
}: {
  periodIndex: number;
  period: ComputedPeriod;
  yearLabel: string;
  removable: boolean;
  sideBySide: boolean;
  onYearChange: (year: number) => void;
  onFieldChange: (key: FinanceFieldKey, n: number) => void;
  onRemove: () => void;
  removeLabel: string;
  dict: ReturnType<typeof useI18n>["dict"];
  locale: ReturnType<typeof useI18n>["locale"];
  t: ReturnType<typeof useI18n>["dict"]["analyze"];
}) {
  const balanceOk = Math.abs(period.subtotals.balanceDiff) < 1;

  const wrapperClass = sideBySide
    ? "rounded-xl border border-line/60 bg-raised/30 p-4"
    : periodIndex > 0
      ? "mt-8 border-t border-line/60 pt-6"
      : undefined;

  return (
    <div className={wrapperClass}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-muted">{yearLabel}</span>
          <select
            className={selectClass}
            value={period.year}
            onChange={(e) => onYearChange(Number(e.target.value))}
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        {removable ? (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            {removeLabel}
          </Button>
        ) : null}
      </div>

      <h2 className="mb-3 font-display text-xl">{t.balanceSectionTitle}</h2>
      {BALANCE_GROUPS.map((groupKey) => (
        <div key={groupKey} className="mb-5">
          <h3 className="mb-2 text-sm font-semibold text-gold">{dict.financeFields.groups[groupKey]}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {groupFields(groupKey).map((key) => (
              <label key={key} className="text-sm">
                <span className="mb-1 block text-muted">{dict.financeFields.labels[key]}</span>
                <NumberField allowNegative value={period.data[key]} onValueChange={(n) => onFieldChange(key, n)} />
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="mb-6 grid gap-2 rounded-xl bg-raised p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted">{dict.financeFields.totals.totalAssets}</span>
          <span className="tabular-nums">{formatMoney(period.subtotals.totalAssets, locale)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted">{dict.financeFields.totals.totalLiabilitiesAndEquity}</span>
          <span className="tabular-nums">{formatMoney(period.subtotals.totalLiabilitiesAndEquity, locale)}</span>
        </div>
        <div className={`mt-1 text-xs ${balanceOk ? "text-ok" : "text-danger"}`}>
          {balanceOk
            ? t.balanceOkLabel
            : `${t.balanceMismatchLabel} ${formatMoney(Math.abs(period.subtotals.balanceDiff), locale)}`}
        </div>
      </div>

      <h2 className="mb-3 font-display text-xl">{t.pnlSectionTitle}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {groupFields("pnl").map((key) => (
          <label key={key} className="text-sm">
            <span className="mb-1 block text-muted">{dict.financeFields.labels[key]}</span>
            <NumberField allowNegative value={period.data[key]} onValueChange={(n) => onFieldChange(key, n)} />
          </label>
        ))}
      </div>
      <div className="mt-4 grid gap-2 rounded-xl bg-raised p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted">{dict.financeFields.totals.grossProfit}</span>
          <span className="tabular-nums">{formatMoney(period.subtotals.grossProfit, locale)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted">{dict.financeFields.totals.operatingProfit}</span>
          <span className="tabular-nums">{formatMoney(period.subtotals.operatingProfit, locale)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted">{dict.financeFields.totals.profitBeforeTax}</span>
          <span className="tabular-nums">{formatMoney(period.subtotals.profitBeforeTax, locale)}</span>
        </div>
        <div className="flex items-center justify-between font-medium">
          <span>{dict.financeFields.totals.netProfit}</span>
          <span className="tabular-nums">{formatMoney(period.subtotals.netProfit, locale)}</span>
        </div>
      </div>
    </div>
  );
}

export function AnalyzePageClient() {
  const { locale, dict } = useI18n();
  const t = dict.analyze;
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState<string>(INDUSTRIES[0]?.id ?? "");
  const [region, setRegion] = useState<string>(REGIONS[0]?.id ?? "");
  const [periods, setPeriods] = useState<FinancePeriod[]>([{ year: CURRENT_YEAR, data: { ...DEMO_FINANCE_DATA } }]);
  const [advice, setAdvice] = useState<AiAdvice | null>(null);
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState<"xlsx" | "pdf" | null>(null);

  // Незалогиненные пользователи: periods/advice живут только в этом React-состоянии —
  // никакого localStorage/БД, всё исчезает при закрытии/обновлении страницы.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setLoggedIn(!!session?.user));
    return () => subscription.unsubscribe();
  }, []);

  const computedPeriods = useMemo<ComputedPeriod[]>(
    () =>
      periods.map((p) => {
        const aggregate = deriveAggregates(p.data);
        return {
          year: p.year,
          data: p.data,
          aggregate,
          subtotals: computeSubtotals(p.data),
          ratios: calculateRatios(aggregate),
        };
      }),
    [periods],
  );
  const primary = computedPeriods[0];
  const second = computedPeriods[1];
  const yearsConflict = periods.length === 2 && periods[0].year === periods[1].year;

  // Доп. срезы (маржа/замороженные активы/запас прочности) — считаются всегда
  // в коде, не ИИ, чтобы цифры на странице были точными и не зависели от
  // того, работает ли ИИ; ИИ и правила-фолбэк только комментируют их текстом.
  // Считаются на основном (первом) периоде — как и раньше, когда период был один.
  const marginBridge = useMemo(() => computeMarginBridge(primary.data), [primary.data]);
  const frozenAssets = useMemo(
    () => computeFrozenAssets(primary.data, primary.aggregate.totalAssets),
    [primary.data, primary.aggregate.totalAssets],
  );
  const safetyMargin = useMemo(() => computeRevenueSafetyMargin(primary.data), [primary.data]);

  const setPeriodField = (periodIndex: number, key: FinanceFieldKey, n: number) => {
    setPeriods((prev) =>
      prev.map((p, i) => (i === periodIndex ? { ...p, data: { ...p.data, [key]: Number.isFinite(n) ? n : 0 } } : p)),
    );
  };

  const setPeriodYear = (periodIndex: number, year: number) => {
    setPeriods((prev) => prev.map((p, i) => (i === periodIndex ? { ...p, year } : p)));
  };

  const addSecondPeriod = () => {
    setPeriods((prev) =>
      prev.length === 2 ? prev : [...prev, { year: prev[0].year - 1, data: { ...EMPTY_FINANCE_DATA } }],
    );
  };

  const removeSecondPeriod = () => {
    setPeriods((prev) => prev.slice(0, 1));
    setAdvice(null);
  };

  async function persist(nextAdvice: AiAdvice) {
    if (!loggedIn) return;
    const res = await saveAnalysisAction({
      companyName,
      industry,
      region,
      periods,
      ratios: primary.ratios,
      advice: nextAdvice,
    });
    if (res.ok) toast.success(t.savedNotice);
  }

  const runLocal = () => {
    if (yearsConflict) {
      toast.error(t.yearsMustDifferError);
      return;
    }
    const next = buildRuleAdvice(primary.aggregate, primary.ratios, dict, locale, primary.data);
    if (second) next.variance = { ...computeVariance(primary.ratios, second.ratios), narrative: "" };
    setAdvice(next);
    toast.success(t.toastCalculated);
    void persist(next);
  };

  const runAi = async () => {
    if (yearsConflict) {
      toast.error(t.yearsMustDifferError);
      return;
    }
    setLoading(true);
    try {
      const next = await requestAiAdvice({ periods, industry, region, locale });
      setAdvice(next);
      toast.success(next.source === "ai" ? t.toastAiReady : t.toastExpress);
      void persist(next);
    } catch {
      const next = buildRuleAdvice(primary.aggregate, primary.ratios, dict, locale, primary.data);
      if (second) next.variance = { ...computeVariance(primary.ratios, second.ratios), narrative: "" };
      setAdvice(next);
      toast.error(t.toastAiUnavailable);
    } finally {
      setLoading(false);
    }
  };

  const resetTo = (data: FinanceData) => {
    setPeriods((prev) => [{ ...prev[0], data: { ...data } }, ...prev.slice(1)]);
    setAdvice(null);
  };

  async function downloadBlob(url: string, body: unknown, filename: string) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("export_failed");
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  }

  const exportFile = async (kind: "xlsx" | "pdf") => {
    setExporting(kind);
    try {
      await downloadBlob(
        `/api/finance/export/${kind}`,
        {
          locale,
          industry,
          region,
          companyName,
          year: primary.year,
          data: primary.data,
          ratios: primary.ratios,
          advice,
          secondPeriod: second ? { year: second.year, data: second.data } : null,
        },
        `moliyahub-analysis.${kind}`,
      );
    } catch {
      toast.error(t.uploadError);
    } finally {
      setExporting(null);
    }
  };

  const onUploadFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/finance/import", { method: "POST", body: fd });
      if (!res.ok) throw new Error("bad_file");
      const json = (await res.json()) as {
        period1: Partial<FinanceData>;
        period2: Partial<FinanceData> | null;
      };
      // Один и тот же шаблон читается одинаково для 1 и 2 периодов: если в
      // файле нашлась колонка второго года (D) — заполняем существующий
      // второй период или заводим его (год по умолчанию — предыдущий год от
      // первого периода, как и при ручном добавлении кнопкой).
      setPeriods((prev) => {
        const next = [...prev];
        next[0] = { ...next[0], data: { ...next[0].data, ...json.period1 } };
        if (json.period2) {
          if (next.length === 2) {
            next[1] = { ...next[1], data: { ...next[1].data, ...json.period2 } };
          } else {
            next.push({ year: next[0].year - 1, data: { ...EMPTY_FINANCE_DATA, ...json.period2 } });
          }
        }
        return next;
      });
      setAdvice(null);
      toast.success(t.uploadSuccess);
    } catch {
      toast.error(t.uploadError);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Shell>
      <Toaster theme="dark" position="top-center" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-display text-3xl md:text-4xl">{t.title}</h1>
        <p className="mt-2 max-w-2xl text-muted">{t.subtitle}</p>

        {loggedIn === false ? (
          <div className="mt-4 rounded-xl bg-raised px-4 py-3 text-sm text-muted">{t.guestNotice}</div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <Button type="button" variant="subtle" onClick={() => resetTo(DEMO_FINANCE_DATA)}>
            {t.demoStrong}
          </Button>
          <Button type="button" variant="subtle" onClick={() => resetTo(WEAK_FINANCE_DATA)}>
            {t.demoWeak}
          </Button>
          <Button type="button" variant="ghost" onClick={() => resetTo(EMPTY_FINANCE_DATA)}>
            {t.clearForm}
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="outline" asChild>
            <a href={`/api/finance/template?locale=${locale}${second ? `&year2=${second.year}` : ""}`}>
              {t.downloadTemplate}
            </a>
          </Button>
          <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-raised px-4 text-sm font-medium text-fg shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition-colors hover:bg-line">
            {uploading ? t.uploadingExcel : t.uploadExcel}
            <input
              type="file"
              accept=".xlsx"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onUploadFile(file);
                e.target.value = "";
              }}
            />
          </label>
          <Button type="button" variant="outline" disabled={exporting !== null} onClick={() => exportFile("xlsx")}>
            {exporting === "xlsx" ? t.exportingFile : t.exportXlsx}
          </Button>
          <Button type="button" variant="outline" disabled={exporting !== null} onClick={() => exportFile("pdf")}>
            {exporting === "pdf" ? t.exportingFile : t.exportPdf}
          </Button>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <Card>
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm sm:col-span-2">
                <span className="mb-1 block text-muted">{t.companyNameLabel}</span>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted">{t.industryLabel}</span>
                <select className={selectClass} value={industry} onChange={(e) => setIndustry(e.target.value)}>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind.id} value={ind.id}>
                      {pickText(ind.name, locale)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted">{t.regionLabel}</span>
                <select className={selectClass} value={region} onChange={(e) => setRegion(e.target.value)}>
                  {REGIONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {pickText(r.name, locale)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className={second ? "grid gap-6 lg:grid-cols-2 lg:items-start" : undefined}>
              <PeriodFieldsCard
                periodIndex={0}
                period={primary}
                yearLabel={t.periodLabel.replace("{n}", "1") + " · " + t.reportingYearLabel}
                removable={false}
                sideBySide={!!second}
                onYearChange={(y) => setPeriodYear(0, y)}
                onFieldChange={(key, n) => setPeriodField(0, key, n)}
                onRemove={() => {}}
                removeLabel=""
                dict={dict}
                locale={locale}
                t={t}
              />

              {second ? (
                <PeriodFieldsCard
                  periodIndex={1}
                  period={second}
                  yearLabel={t.periodLabel.replace("{n}", "2") + " · " + t.reportingYearLabel}
                  removable
                  sideBySide
                  onYearChange={(y) => setPeriodYear(1, y)}
                  onFieldChange={(key, n) => setPeriodField(1, key, n)}
                  onRemove={removeSecondPeriod}
                  removeLabel={t.removeSecondYearLabel}
                  dict={dict}
                  locale={locale}
                  t={t}
                />
              ) : null}
            </div>

            {!second ? (
              <div className="mt-6">
                <Button type="button" variant="outline" onClick={addSecondPeriod}>
                  {t.addSecondYearLabel}
                </Button>
              </div>
            ) : null}

            {yearsConflict ? <p className="mt-4 text-sm text-danger">{t.yearsMustDifferError}</p> : null}

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button type="button" disabled={yearsConflict} onClick={runLocal}>
                {t.calcNow}
              </Button>
              <Button type="button" variant="gold" disabled={loading || yearsConflict} onClick={runAi}>
                {loading ? t.loadingAi : t.getAi}
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted">{t.aiHint}</p>
          </Card>

          <div>
            <AnalysisPanel
              ratios={primary.ratios}
              advice={advice}
              marginBridge={marginBridge}
              frozenAssets={frozenAssets}
              safetyMargin={safetyMargin}
            />

            {second && advice ? (
              <VarianceDashboard
                period1={{ year: primary.year, data: primary.data, subtotals: primary.subtotals, ratios: primary.ratios }}
                period2={{ year: second.year, data: second.data, subtotals: second.subtotals, ratios: second.ratios }}
                narrative={advice.variance?.narrative || undefined}
              />
            ) : null}

            <p className="mt-6 text-xs leading-relaxed text-muted">{t.disclaimer}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href={`/${locale}/financing`}>{t.compareLoans}</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href={`/${locale}/projects`}>{t.findInvestor}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
