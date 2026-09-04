"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast, Toaster } from "sonner";
import { AnalysisPanel } from "@/components/finance/analysis-panel";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

export default function AnalyzePage() {
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
    const next = buildRuleAdvice(form, ratios);
    setAdvice(next);
    saveAnalysis({ industry, region, data: form, ratios, advice: next });
    toast.success("Показатели посчитаны");
  };

  const runAi = async () => {
    setLoading(true);
    try {
      const next = await requestAiAdvice({ data: form, industry, region });
      setAdvice(next);
      saveAnalysis({ industry, region, data: form, ratios, advice: next });
      toast.success(next.source === "ai" ? "ИИ-анализ готов" : "Показан экспресс-анализ");
    } catch {
      const next = buildRuleAdvice(form, ratios);
      setAdvice(next);
      toast.error("ИИ недоступен, показан локальный разбор");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell>
      <Toaster theme="dark" position="top-center" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-display text-3xl md:text-4xl">Финансовый анализ</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Суммы в сумах. Можно подставить демо-компанию и сразу увидеть скоринг, а затем запросить
          рекомендации.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button type="button" variant="subtle" onClick={() => setForm({ ...DEMO_FINANCE })}>
            Демо: устойчивая компания
          </Button>
          <Button type="button" variant="subtle" onClick={() => setForm({ ...WEAK_FINANCE })}>
            Демо: слабая компания
          </Button>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <Card>
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-muted">Отрасль</span>
                <Input value={industry} onChange={(e) => setIndustry(e.target.value)} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted">Регион</span>
                <Input value={region} onChange={(e) => setRegion(e.target.value)} />
              </label>
            </div>
            {(["Баланс", "ОПУ"] as const).map((group) => (
              <div key={group} className="mb-6">
                <h2 className="mb-3 font-display text-xl">{group}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {FINANCE_FIELDS.filter((f) => f.group === group).map((f) => (
                    <label key={f.key} className="text-sm">
                      <span className="mb-1 block text-muted">{f.label}</span>
                      <Input
                        type="number"
                        value={form[f.key]}
                        onChange={(e) => setField(f.key, e.target.value)}
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" onClick={runLocal}>
                Посчитать сейчас
              </Button>
              <Button type="button" variant="gold" disabled={loading} onClick={runAi}>
                {loading ? "Готовим анализ…" : "Получить ИИ-анализ"}
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted">
              ИИ вызывается только по кнопке. Если сервис недоступен, сработает локальный разбор.
            </p>
          </Card>

          <div>
            <AnalysisPanel ratios={ratios} advice={advice} />
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href="/financing">Сравнить кредиты</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/projects">Найти инвестора</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
