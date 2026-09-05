"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast, Toaster } from "sonner";
import { AnalysisPanel } from "@/components/finance/analysis-panel";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/provider";
import { requestAiAdvice } from "@/lib/ai/analyze";
import { computeSubtotals, deriveAggregates } from "@/lib/finance/aggregate";
import { buildRuleAdvice } from "@/lib/finance/advice";
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
} from "@/lib/finance/types";
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

function groupFields(key: FinanceGroupKey): FinanceFieldKey[] {
  return FINANCE_GROUPS.find((g) => g.key === key)?.fields ?? [];
}

export function AnalyzePageClient() {
  const { locale, dict } = useI18n();
  const t = dict.analyze;
  const [form, setForm] = useState<FinanceData>({ ...DEMO_FINANCE_DATA });
  const [industry, setIndustry] = useState("Текстиль");
  const [region, setRegion] = useState("Навоийская область");
  const [advice, setAdvice] = useState<AiAdvice | null>(null);
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState<"xlsx" | "pdf" | null>(null);

  // Незалогиненные пользователи: form/advice живут только в этом React-состоянии —
  // никакого localStorage/БД, всё исчезает при закрытии/обновлении страницы.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setLoggedIn(!!session?.user));
    return () => subscription.unsubscribe();
  }, []);

  const aggregate = useMemo(() => deriveAggregates(form), [form]);
  const subtotals = useMemo(() => computeSubtotals(form), [form]);
  const ratios = useMemo(() => calculateRatios(aggregate), [aggregate]);
  const balanceOk = Math.abs(subtotals.balanceDiff) < 1;

  const setField = (key: FinanceFieldKey, raw: string) => {
    const n = Number(raw.replace(/\s/g, "").replace(",", "."));
    setForm((prev) => ({ ...prev, [key]: Number.isFinite(n) ? n : 0 }));
  };

  async function persist(nextAdvice: AiAdvice) {
    if (!loggedIn) return;
    const res = await saveAnalysisAction({ industry, region, data: form, ratios, advice: nextAdvice });
    if (res.ok) toast.success(t.savedNotice);
  }

  const runLocal = () => {
    const next = buildRuleAdvice(aggregate, ratios, dict, locale);
    setAdvice(next);
    toast.success(t.toastCalculated);
    void persist(next);
  };

  const runAi = async () => {
    setLoading(true);
    try {
      const next = await requestAiAdvice({ data: form, industry, region, locale });
      setAdvice(next);
      toast.success(next.source === "ai" ? t.toastAiReady : t.toastExpress);
      void persist(next);
    } catch {
      const next = buildRuleAdvice(aggregate, ratios, dict, locale);
      setAdvice(next);
      toast.error(t.toastAiUnavailable);
    } finally {
      setLoading(false);
    }
  };

  const resetTo = (data: FinanceData) => {
    setForm({ ...data });
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
        { locale, industry, region, data: form, ratios, advice },
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
      const json = (await res.json()) as Partial<FinanceData>;
      setForm((prev) => ({ ...prev, ...json }));
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
            <a href={`/api/finance/template?locale=${locale}`}>{t.downloadTemplate}</a>
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
              <label className="text-sm">
                <span className="mb-1 block text-muted">{t.industryLabel}</span>
                <Input value={industry} onChange={(e) => setIndustry(e.target.value)} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted">{t.regionLabel}</span>
                <Input value={region} onChange={(e) => setRegion(e.target.value)} />
              </label>
            </div>

            <h2 className="mb-3 font-display text-xl">{t.balanceSectionTitle}</h2>
            {BALANCE_GROUPS.map((groupKey) => (
              <div key={groupKey} className="mb-5">
                <h3 className="mb-2 text-sm font-semibold text-gold">{dict.financeFields.groups[groupKey]}</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {groupFields(groupKey).map((key) => (
                    <label key={key} className="text-sm">
                      <span className="mb-1 block text-muted">{dict.financeFields.labels[key]}</span>
                      <Input type="number" value={form[key]} onChange={(e) => setField(key, e.target.value)} />
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div className="mb-6 grid gap-2 rounded-xl bg-raised p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">{dict.financeFields.totals.totalAssets}</span>
                <span className="tabular-nums">{formatMoney(subtotals.totalAssets, locale)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">{dict.financeFields.totals.totalLiabilitiesAndEquity}</span>
                <span className="tabular-nums">{formatMoney(subtotals.totalLiabilitiesAndEquity, locale)}</span>
              </div>
              <div className={`mt-1 text-xs ${balanceOk ? "text-ok" : "text-danger"}`}>
                {balanceOk
                  ? t.balanceOkLabel
                  : `${t.balanceMismatchLabel} ${formatMoney(Math.abs(subtotals.balanceDiff), locale)}`}
              </div>
            </div>

            <h2 className="mb-3 font-display text-xl">{t.pnlSectionTitle}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {groupFields("pnl").map((key) => (
                <label key={key} className="text-sm">
                  <span className="mb-1 block text-muted">{dict.financeFields.labels[key]}</span>
                  <Input type="number" value={form[key]} onChange={(e) => setField(key, e.target.value)} />
                </label>
              ))}
            </div>
            <div className="mt-4 grid gap-2 rounded-xl bg-raised p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">{dict.financeFields.totals.grossProfit}</span>
                <span className="tabular-nums">{formatMoney(subtotals.grossProfit, locale)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">{dict.financeFields.totals.operatingProfit}</span>
                <span className="tabular-nums">{formatMoney(subtotals.operatingProfit, locale)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">{dict.financeFields.totals.profitBeforeTax}</span>
                <span className="tabular-nums">{formatMoney(subtotals.profitBeforeTax, locale)}</span>
              </div>
              <div className="flex items-center justify-between font-medium">
                <span>{dict.financeFields.totals.netProfit}</span>
                <span className="tabular-nums">{formatMoney(subtotals.netProfit, locale)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" onClick={runLocal}>
                {t.calcNow}
              </Button>
              <Button type="button" variant="gold" disabled={loading} onClick={runAi}>
                {loading ? t.loadingAi : t.getAi}
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted">{t.aiHint}</p>
          </Card>

          <div>
            <AnalysisPanel ratios={ratios} advice={advice} />
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
