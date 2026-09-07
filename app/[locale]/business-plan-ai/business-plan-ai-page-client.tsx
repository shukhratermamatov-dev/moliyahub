"use client";

import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import { PlanPanel } from "@/components/business-plan/plan-panel";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { NumberField } from "@/components/ui/number-input";
import { useI18n } from "@/i18n/provider";
import { generateBusinessPlan } from "@/lib/ai/business-plan";
import type { BusinessPlan, BusinessPlanInput, BusinessPlanStage } from "@/lib/business-plan/types";
import { findIndustry, INDUSTRIES } from "@/lib/data/industries";
import { pickText } from "@/lib/i18n-text";
import { createClient } from "@/lib/supabase/client";
import { saveBusinessPlanAction } from "./actions";

export function BusinessPlanAiPageClient() {
  const { locale, dict } = useI18n();
  const t = dict.businessPlanAi;

  const [industryId, setIndustryId] = useState(INDUSTRIES[0].id);
  const [subIndustryId, setSubIndustryId] = useState(INDUSTRIES[0].subIndustries[0]?.id ?? "");
  const [projectName, setProjectName] = useState("");
  const [idea, setIdea] = useState("");
  const [region, setRegion] = useState("");
  const [investmentAmount, setInvestmentAmount] = useState(100_000_000);
  const [stage, setStage] = useState<BusinessPlanStage>("MVP");
  const [teamSize, setTeamSize] = useState("");
  const [timeframeMonths, setTimeframeMonths] = useState(0);

  const [plan, setPlan] = useState<BusinessPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState<"xlsx" | "pdf" | null>(null);

  // Гость: план живёт только в этом React-состоянии, без localStorage/БД,
  // ровно как форма анализа на /analyze — исчезает при закрытии страницы.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setLoggedIn(!!session?.user));
    return () => subscription.unsubscribe();
  }, []);

  const selectedIndustry = findIndustry(industryId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !idea.trim()) {
      toast.error(t.toastFillRequired);
      return;
    }
    setLoading(true);
    setSaved(false);
    try {
      const input: BusinessPlanInput = {
        industryId,
        subIndustryId: subIndustryId || undefined,
        projectName: projectName.trim(),
        idea: idea.trim(),
        region: region.trim(),
        investmentAmount,
        stage,
        teamSize: teamSize.trim() || undefined,
        timeframeMonths: timeframeMonths > 0 ? timeframeMonths : undefined,
      };
      const res = await generateBusinessPlan(input, locale);
      if (res.ok) {
        setPlan(res.plan);
        toast.success(t.toastReady);
      } else {
        toast.error(res.error === "not_configured" ? t.errorNotConfigured : t.errorGeneration);
      }
    } catch {
      toast.error(t.errorGeneration);
    } finally {
      setLoading(false);
    }
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
    if (!plan) return;
    setExporting(kind);
    try {
      await downloadBlob(`/api/business-plan/export/${kind}`, { plan }, `business-plan.${kind}`);
    } catch {
      toast.error(t.errorGeneration);
    } finally {
      setExporting(null);
    }
  };

  const saveToCabinet = async () => {
    if (!plan) return;
    setSaving(true);
    try {
      const res = await saveBusinessPlanAction({
        industryId,
        subIndustryId: subIndustryId || undefined,
        projectName: plan.projectName,
        idea: plan.idea,
        plan,
      });
      if (res.ok) {
        setSaved(true);
        toast.success(t.savedNotice);
      } else {
        toast.error(t.errorGeneration);
      }
    } finally {
      setSaving(false);
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

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <Card>
            <h2 className="mb-4 font-display text-xl">{t.formHeading}</h2>
            <form onSubmit={submit} className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block text-muted">{t.industryLabel}</span>
                  <select
                    className="h-11 w-full rounded-xl bg-raised px-3 text-sm"
                    value={industryId}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      setIndustryId(nextId);
                      setSubIndustryId(findIndustry(nextId)?.subIndustries[0]?.id ?? "");
                    }}
                  >
                    {INDUSTRIES.map((ind) => (
                      <option key={ind.id} value={ind.id}>
                        {pickText(ind.name, locale)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-muted">{t.subIndustryLabel}</span>
                  <select
                    className="h-11 w-full rounded-xl bg-raised px-3 text-sm"
                    value={subIndustryId}
                    onChange={(e) => setSubIndustryId(e.target.value)}
                  >
                    {selectedIndustry?.subIndustries.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {pickText(sub.name, locale)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block text-sm">
                <span className="mb-1 block text-muted">{t.projectNameLabel}</span>
                <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-muted">{t.ideaLabel}</span>
                <Textarea
                  rows={4}
                  placeholder={t.ideaPlaceholder}
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block text-muted">{t.regionLabel}</span>
                  <Input value={region} onChange={(e) => setRegion(e.target.value)} />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-muted">{t.investmentLabel}</span>
                  <NumberField value={investmentAmount} onValueChange={setInvestmentAmount} />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block text-muted">{t.stageLabel}</span>
                  <select
                    className="h-11 w-full rounded-xl bg-raised px-3 text-sm"
                    value={stage}
                    onChange={(e) => setStage(e.target.value as BusinessPlanStage)}
                  >
                    {(Object.keys(dict.projectStages) as BusinessPlanStage[]).map((k) => (
                      <option key={k} value={k}>
                        {dict.projectStages[k]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-muted">{t.timeframeLabel}</span>
                  <NumberField value={timeframeMonths} onValueChange={setTimeframeMonths} />
                </label>
              </div>

              <label className="block text-sm">
                <span className="mb-1 block text-muted">{t.teamSizeLabel}</span>
                <Input
                  placeholder={t.teamSizePlaceholder}
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                />
              </label>

              <Button type="submit" variant="gold" disabled={loading} className="mt-1">
                {loading ? t.generating : t.submit}
              </Button>
              {loading ? <p className="text-xs text-muted">{t.generating}</p> : null}
            </form>
          </Card>

          <div>
            {plan ? (
              <>
                <div className="mb-4 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" disabled={exporting !== null} onClick={() => exportFile("xlsx")}>
                    {exporting === "xlsx" ? t.exportingFile : t.exportXlsx}
                  </Button>
                  <Button type="button" variant="outline" disabled={exporting !== null} onClick={() => exportFile("pdf")}>
                    {exporting === "pdf" ? t.exportingFile : t.exportPdf}
                  </Button>
                  {loggedIn ? (
                    <Button type="button" variant="subtle" disabled={saving || saved} onClick={saveToCabinet}>
                      {saving ? t.saving : saved ? t.savedNotice : t.saveToCabinet}
                    </Button>
                  ) : null}
                  <Button type="button" variant="ghost" onClick={() => setPlan(null)}>
                    {t.newPlan}
                  </Button>
                </div>
                <PlanPanel plan={plan} />
              </>
            ) : (
              <Card className="flex h-full min-h-[240px] items-center justify-center text-center text-sm text-muted">
                {t.subtitle}
              </Card>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
