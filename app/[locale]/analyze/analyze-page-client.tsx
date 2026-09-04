"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast, Toaster } from "sonner";
import { AnalysisPanel } from "@/components/finance/analysis-panel";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/provider";
import { requestAiAdvice } from "@/lib/ai/analyze";
import { buildRuleAdvice } from "@/lib/finance/advice";
import { calculateRatios } from "@/lib/finance/ratios";
import {
  DEMO_FINANCE,
  FINANCE_FIELDS,
  WEAK_FINANCE,
  type AiAdvice,
  type MinimalFinanceData,
} from "@/lib/finance/types";
import { useHubStore } from "@/lib/store";

export function AnalyzePageClient() {
  const { locale, dict } = useI18n();
  const t = dict.analyze;
  const [form, setForm] = useState<MinimalFinanceData>({ ...DEMO_FINANCE });
  const [industry, setIndustry] = useState("Текстиль");
  const [region, setRegion] = useState("Навоийская область");
  const [advice, setAdvice] = useState<AiAdvice | null>(null);
  const [loading, setLoading] = useState(false);
  const saveAnalysis = useHubStore((s) => s.saveAnalysis);

  const ratios = useMemo(() => calculateRatios(form), [form]);

  const setField = (key: keyof MinimalFinanceData, raw: string) => {
    const n = Number(raw.replace(/\s/g, "").replace(",", "."));
    setForm((prev) => ({ ...prev, [key]: Number.isFinite(n) ? n : 0 }));
  };

  const runLocal = () => {
    const next = buildRuleAdvice(form, ratios, dict, locale);
    setAdvice(next);
    saveAnalysis({ industry, region, data: form, ratios, advice: next });
    toast.success(t.toastCalculated);
  };

  const runAi = async () => {
    setLoading(true);
    try {
      const next = await requestAiAdvice({ data: form, industry, region, locale });
      setAdvice(next);
      saveAnalysis({ industry, region, data: form, ratios, advice: next });
      toast.success(next.source === "ai" ? t.toastAiReady : t.toastExpress);
    } catch {
      const next = buildRuleAdvice(form, ratios, dict, locale);
      setAdvice(next);
      toast.error(t.toastAiUnavailable);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell>
      <Toaster theme="dark" position="top-center" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-display text-3xl md:text-4xl">{t.title}</h1>
        <p className="mt-2 max-w-2xl text-muted">{t.subtitle}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button type="button" variant="subtle" onClick={() => setForm({ ...DEMO_FINANCE })}>
            {t.demoStrong}
          </Button>
          <Button type="button" variant="subtle" onClick={() => setForm({ ...WEAK_FINANCE })}>
            {t.demoWeak}
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
            {(["balance", "pnl"] as const).map((groupKey) => (
              <div key={groupKey} className="mb-6">
                <h2 className="mb-3 font-display text-xl">{dict.financeFields.groups[groupKey]}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {FINANCE_FIELDS.filter((f) => (groupKey === "balance" ? f.group === "Баланс" : f.group === "ОПУ")).map(
                    (f) => (
                      <label key={f.key} className="text-sm">
                        <span className="mb-1 block text-muted">{dict.financeFields.labels[f.key]}</span>
                        <Input
                          type="number"
                          value={form[f.key]}
                          onChange={(e) => setField(f.key, e.target.value)}
                        />
                      </label>
                    ),
                  )}
                </div>
              </div>
            ))}
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
