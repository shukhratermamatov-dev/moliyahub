"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { toast, Toaster } from "sonner";
import { NumberField } from "@/components/ui/number-input";
import { AnalysisPanel } from "@/components/finance/analysis-panel";
import { VarianceDashboard } from "@/components/finance/variance-dashboard";
import { PlanPanel } from "@/components/business-plan/plan-panel";
import { useI18n } from "@/i18n/provider";
import { computeSubtotals, deriveAggregates } from "@/lib/finance/aggregate";
import { computeFrozenAssets, computeMarginBridge, computeRevenueSafetyMargin } from "@/lib/finance/insights";
import { calculateRatios } from "@/lib/finance/ratios";
import type { AiAdvice, FinanceData, FinancePeriod, FinancialRatios } from "@/lib/finance/types";
import type { BusinessPlan } from "@/lib/business-plan/types";
import { findIndustry } from "@/lib/data/industries";
import { findRegion } from "@/lib/data/regions";
import { pickText } from "@/lib/i18n-text";
import { formatMoney, formatPct, formatRatio } from "@/lib/utils";
import { signOut } from "../login/actions";
import { addProject, deleteAnalysis, deleteBusinessPlan, deleteProject, type ProjectFormState } from "./actions";

export type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  region: string | null;
  amount: number | string | null;
  stage: string;
  is_public: boolean;
  created_at: string;
};

export type ApplicationRow = {
  id: string;
  project_id: string;
  applicant_name: string;
  applicant_contact: string;
  message: string | null;
  created_at: string;
};

export type AnalysisRow = {
  id: string;
  companyName: string | null;
  industry: string | null;
  region: string | null;
  data: FinanceData | null;
  ratios: FinancialRatios | null;
  advice: AiAdvice | null;
  periods: FinancePeriod[] | null;
  created_at: string;
};

export type BusinessPlanRow = {
  id: string;
  industry_id: string | null;
  sub_industry_id: string | null;
  project_name: string;
  idea: string | null;
  data: BusinessPlan | null;
  created_at: string;
};

const initialState: ProjectFormState = undefined;

const inputClass =
  "h-10 w-full rounded-lg bg-raised px-3 text-sm text-fg shadow-[0_0_0_1px_rgba(255,255,255,0.08)] focus:outline-none focus:ring-2 focus:ring-primary/50";

const COMPARE_ROWS: { key: keyof FinancialRatios; kind: "ratio" | "pct" | "money" | "score" }[] = [
  { key: "score", kind: "score" },
  { key: "currentRatio", kind: "ratio" },
  { key: "roa", kind: "pct" },
  { key: "roe", kind: "pct" },
  { key: "autonomyRatio", kind: "pct" },
  { key: "debtRatio", kind: "pct" },
  { key: "workingCapital", kind: "money" },
];

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

export function CabinetClient({
  email,
  projects,
  applications,
  analyses,
  businessPlans,
}: {
  email: string;
  projects: ProjectRow[];
  applications: ApplicationRow[];
  analyses: AnalysisRow[];
  businessPlans: BusinessPlanRow[];
}) {
  const { locale, dict } = useI18n();
  const boundAddProject = addProject.bind(null, locale);
  const [state, formAction, pending] = useActionState(boundAddProject, initialState);
  const [projectAmount, setProjectAmount] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [exportingPlanId, setExportingPlanId] = useState<string | null>(null);
  const [exportingAnalysisId, setExportingAnalysisId] = useState<string | null>(null);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const applicationsByProject = useMemo(() => {
    const map = new Map<string, ApplicationRow[]>();
    for (const a of applications) {
      const list = map.get(a.project_id);
      if (list) list.push(a);
      else map.set(a.project_id, [a]);
    }
    return map;
  }, [applications]);

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const comparePair = useMemo(() => {
    if (selected.length !== 2) return null;
    const byId = new Map(analyses.map((a) => [a.id, a]));
    const a = byId.get(selected[0]);
    const b = byId.get(selected[1]);
    if (!a || !b || !a.ratios || !b.ratios) return null;
    // Раньше/позже — по дате, независимо от порядка выбора.
    const [earlier, later] = new Date(a.created_at) <= new Date(b.created_at) ? [a, b] : [b, a];
    return { earlier, later };
  }, [selected, analyses]);

  function formatByKind(value: number | null | undefined, kind: "ratio" | "pct" | "money" | "score") {
    if (value == null) return "—";
    if (kind === "pct") return formatPct(value);
    if (kind === "money") return formatMoney(value, locale);
    if (kind === "score") return `${value} / 100`;
    return formatRatio(value);
  }

  // Отрасль/регион теперь хранятся как id из справочников (lib/data/industries,
  // lib/data/regions) — резолвим в подпись на нужной локали. У старых записей
  // (до этого расширения) это был свободный текст, который не найдётся в
  // справочнике — тогда просто показываем как есть, ничего не теряем.
  function resolveIndustryLabel(id: string | null): string {
    if (!id) return "—";
    return findIndustry(id) ? pickText(findIndustry(id)!.name, locale) : id;
  }
  function resolveRegionLabel(id: string | null): string {
    if (!id) return "—";
    return findRegion(id) ? pickText(findRegion(id)!.name, locale) : id;
  }

  // "Сохранить" для заявок инвесторов — простой CSV в браузере, без похода
  // на сервер: данных немного (имя/контакт/дата/сообщение), а
  // Excel/Sheets/Numbers открывают CSV с BOM без проблем с кириллицей.
  function saveApplicationsToComputer(projectName: string, apps: ApplicationRow[]) {
    const header = ["Имя", "Контакт", "Дата", "Сообщение"];
    const rows = apps.map((a) => [
      a.applicant_name,
      a.applicant_contact,
      new Date(a.created_at).toLocaleString(locale === "ru" ? "ru-RU" : locale === "uz" ? "uz-UZ" : "en-US"),
      a.message ?? "",
    ]);
    const escapeCell = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((r) => r.map(escapeCell).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeName = projectName.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "") || "project";
    link.download = `${safeName}-applications.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const exportPlan = async (row: BusinessPlanRow, kind: "xlsx" | "pdf") => {
    if (!row.data) return;
    setExportingPlanId(`${row.id}:${kind}`);
    try {
      await downloadBlob(`/api/business-plan/export/${kind}`, { plan: row.data }, `business-plan.${kind}`);
    } catch {
      toast.error(dict.cabinet.exportError);
    } finally {
      setExportingPlanId(null);
    }
  };

  // Экспорт сохранённого анализа из кабинета — тот же API-роут и та же форма
  // payload, что и на /analyze (app/[locale]/analyze/analyze-page-client.tsx
  // exportFile), просто данные берём не из локального state формы, а из уже
  // сохранённой строки analyses. industry/region передаём как есть (id из
  // справочника или — для старых записей — свободный текст): сам API уже
  // умеет резолвить оба варианта в подпись (см. app/api/finance/export/*).
  const exportAnalysis = async (row: AnalysisRow, kind: "xlsx" | "pdf") => {
    const primaryData = row.periods?.[0]?.data ?? row.data;
    if (!primaryData || !row.ratios) return;
    const primaryYear = row.periods?.[0]?.year;
    const secondPeriod = row.periods && row.periods.length === 2 ? row.periods[1] : null;
    setExportingAnalysisId(`${row.id}:${kind}`);
    try {
      await downloadBlob(
        `/api/finance/export/${kind}`,
        {
          locale,
          industry: row.industry ?? "",
          region: row.region ?? "",
          companyName: row.companyName ?? undefined,
          year: primaryYear,
          data: primaryData,
          ratios: row.ratios,
          advice: row.advice,
          secondPeriod,
        },
        `moliyahub-analysis.${kind}`,
      );
    } catch {
      toast.error(dict.cabinet.exportError);
    } finally {
      setExportingAnalysisId(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Toaster theme="dark" position="top-center" />
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-6">
        <div>
          <h1 className="font-display text-2xl">{dict.cabinet.title}</h1>
          <p className="mt-1 text-sm text-muted">{email}</p>
        </div>
        <form action={signOut.bind(null, locale)}>
          <button
            type="submit"
            className="rounded-lg bg-raised px-4 py-2 text-sm text-fg transition-colors hover:bg-line"
          >
            {dict.cabinet.logout}
          </button>
        </form>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-lg">{dict.cabinet.myProjects}</h2>

        {projects.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{dict.cabinet.noProjects}</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {projects.map((p) => {
              const apps = applicationsByProject.get(p.id) ?? [];
              const isProjectExpanded = expandedProjectId === p.id;
              return (
                <li
                  key={p.id}
                  className="rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{p.name}</p>
                        {p.is_public ? (
                          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] text-primary">
                            {dict.cabinet.publicBadge}
                          </span>
                        ) : null}
                      </div>
                      {p.description ? (
                        <p className="mt-1 text-sm text-muted">{p.description}</p>
                      ) : null}
                      <p className="mt-2 text-xs text-muted">
                        {[
                          p.region,
                          p.amount != null ? formatMoney(Number(p.amount), locale) : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <form action={deleteProject.bind(null, locale, p.id)}>
                      <button
                        type="submit"
                        className="text-xs text-muted transition-colors hover:text-danger"
                      >
                        {dict.cabinet.deleteProject}
                      </button>
                    </form>
                  </div>

                  {p.is_public ? (
                    <div className="mt-3 border-t border-line/60 pt-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm text-muted">
                          {dict.cabinet.applicationsHeading} ({apps.length})
                        </p>
                        {apps.length > 0 ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="text-xs text-muted transition-colors hover:text-fg"
                              onClick={() => setExpandedProjectId(isProjectExpanded ? null : p.id)}
                            >
                              {isProjectExpanded ? dict.cabinet.hideApplications : dict.cabinet.viewApplications}
                            </button>
                            <button
                              type="button"
                              className="text-xs text-muted transition-colors hover:text-fg"
                              onClick={() => saveApplicationsToComputer(p.name, apps)}
                            >
                              {dict.cabinet.saveApplications}
                            </button>
                          </div>
                        ) : null}
                      </div>

                      {apps.length === 0 ? (
                        <p className="mt-2 text-xs text-muted">{dict.cabinet.noApplicationsYet}</p>
                      ) : null}

                      {isProjectExpanded && apps.length > 0 ? (
                        <ul className="mt-3 flex flex-col gap-2">
                          {apps.map((a) => (
                            <li
                              key={a.id}
                              className="rounded-xl bg-raised p-3 text-sm"
                            >
                              <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <span className="font-medium">{a.applicant_name}</span>
                                <span className="text-xs text-muted">
                                  {new Date(a.created_at).toLocaleString(locale === "ru" ? "ru-RU" : locale === "uz" ? "uz-UZ" : "en-US")}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-primary">{a.applicant_contact}</p>
                              {a.message ? (
                                <p className="mt-1 text-xs text-muted">{a.message}</p>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-8 rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]">
        <h2 className="font-display text-lg">{dict.cabinet.newProjectTitle}</h2>
        <form action={formAction} className="mt-4 flex flex-col gap-3">
          <label className="block text-sm">
            <span className="mb-1 block text-muted">{dict.cabinet.projectNameLabel}</span>
            <input type="text" name="name" required className={inputClass} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted">{dict.cabinet.projectDescriptionLabel}</span>
            <textarea name="description" rows={2} className={`${inputClass} h-auto py-2`} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1 block text-muted">{dict.cabinet.projectRegionLabel}</span>
              <input type="text" name="region" className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">{dict.cabinet.projectAmountLabel}</span>
              <NumberField value={projectAmount} onValueChange={setProjectAmount} className={inputClass} />
              <input type="hidden" name="amount" value={projectAmount || ""} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">{dict.cabinet.projectStageLabel}</span>
              <select name="stage" defaultValue="IDEA" className={inputClass}>
                {(Object.keys(dict.projectStages) as (keyof typeof dict.projectStages)[]).map((key) => (
                  <option key={key} value={key}>
                    {dict.projectStages[key]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {state?.error ? <p className="text-sm text-danger">{state.error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="mt-1 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-fg transition-all hover:brightness-110 disabled:pointer-events-none disabled:opacity-40"
          >
            {pending ? dict.cabinet.addingProject : dict.cabinet.addProject}
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg">{dict.cabinet.myAnalyses}</h2>

        {analyses.length === 0 ? (
          <div className="mt-3">
            <p className="text-sm text-muted">{dict.cabinet.noAnalyses}</p>
            <Link
              href={`/${locale}/analyze`}
              className="mt-2 inline-block text-sm text-primary underline-offset-4 hover:underline"
            >
              {dict.cabinet.goToAnalyze}
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-2 text-xs text-muted">{dict.cabinet.selectToCompare}</p>
            <ul className="mt-3 flex flex-col gap-3">
              {analyses.map((a) => {
                const hasTwoPeriods = (a.periods?.length ?? 0) === 2;
                const isExpanded = expandedId === a.id;
                const primaryData = a.periods?.[0]?.data ?? a.data;
                return (
                  <li
                    key={a.id}
                    className="rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 size-4"
                        checked={selected.includes(a.id)}
                        onChange={() => toggleSelected(a.id)}
                      />
                      <button
                        type="button"
                        className="flex-1 text-left"
                        onClick={() => setExpandedId(isExpanded ? null : a.id)}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium">
                            {a.companyName || `${resolveIndustryLabel(a.industry)} · ${resolveRegionLabel(a.region)}`}
                          </p>
                          <span className="font-display text-lg tabular-nums">
                            {a.ratios ? `${a.ratios.score} / 100` : "—"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted">
                          {a.companyName ? `${resolveIndustryLabel(a.industry)} · ${resolveRegionLabel(a.region)} · ` : ""}
                          {new Date(a.created_at).toLocaleString(locale === "ru" ? "ru-RU" : locale === "uz" ? "uz-UZ" : "en-US")}
                        </p>
                      </button>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <button
                          type="button"
                          className="text-xs text-muted transition-colors hover:text-fg"
                          onClick={() => setExpandedId(isExpanded ? null : a.id)}
                        >
                          {isExpanded ? dict.cabinet.hideAnalysis : dict.cabinet.viewAnalysis}
                        </button>
                        <form action={deleteAnalysis.bind(null, locale, a.id)}>
                          <button
                            type="submit"
                            className="text-xs text-muted transition-colors hover:text-danger"
                          >
                            {dict.cabinet.deleteAnalysis}
                          </button>
                        </form>
                      </div>
                    </div>

                    {isExpanded ? (
                      <div className="mt-4 border-t border-line/60 pt-4">
                        {hasTwoPeriods && a.periods ? (
                          <VarianceDashboard
                            period1={{
                              year: a.periods[0].year,
                              data: a.periods[0].data,
                              subtotals: computeSubtotals(a.periods[0].data),
                              ratios: calculateRatios(deriveAggregates(a.periods[0].data)),
                            }}
                            period2={{
                              year: a.periods[1].year,
                              data: a.periods[1].data,
                              subtotals: computeSubtotals(a.periods[1].data),
                              ratios: calculateRatios(deriveAggregates(a.periods[1].data)),
                            }}
                            narrative={a.advice?.variance?.narrative || undefined}
                          />
                        ) : primaryData && a.ratios ? (
                          <AnalysisPanel
                            ratios={a.ratios}
                            advice={a.advice}
                            marginBridge={computeMarginBridge(primaryData)}
                            frozenAssets={computeFrozenAssets(primaryData, deriveAggregates(primaryData).totalAssets)}
                            safetyMargin={computeRevenueSafetyMargin(primaryData)}
                          />
                        ) : (
                          <p className="text-xs text-muted">{dict.cabinet.noDataToShow}</p>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={exportingAnalysisId !== null}
                            onClick={() => exportAnalysis(a, "xlsx")}
                            className="rounded-lg bg-raised px-3 py-1.5 text-xs text-fg transition-colors hover:bg-line disabled:opacity-40"
                          >
                            {exportingAnalysisId === `${a.id}:xlsx` ? dict.analyze.exportingFile : dict.analyze.exportXlsx}
                          </button>
                          <button
                            type="button"
                            disabled={exportingAnalysisId !== null}
                            onClick={() => exportAnalysis(a, "pdf")}
                            className="rounded-lg bg-raised px-3 py-1.5 text-xs text-fg transition-colors hover:bg-line disabled:opacity-40"
                          >
                            {exportingAnalysisId === `${a.id}:pdf` ? dict.analyze.exportingFile : dict.analyze.exportPdf}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-muted">{dict.analyze.disclaimer}</p>

            {comparePair ? (
              <div className="mt-6 rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]">
                <h3 className="font-display text-lg">{dict.cabinet.compareTitle}</h3>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[420px] text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted">
                        <th className="pb-2 pr-3 font-normal">{dict.cabinet.compareMetric}</th>
                        <th className="pb-2 pr-3 font-normal">{dict.cabinet.compareEarlier}</th>
                        <th className="pb-2 pr-3 font-normal">{dict.cabinet.compareLater}</th>
                        <th className="pb-2 font-normal">{dict.cabinet.compareDelta}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {COMPARE_ROWS.map(({ key, kind }) => {
                        const before = comparePair.earlier.ratios?.[key] as number | null | undefined;
                        const after = comparePair.later.ratios?.[key] as number | null | undefined;
                        const delta = typeof before === "number" && typeof after === "number" ? after - before : null;
                        return (
                          <tr key={key} className="border-t border-line">
                            <td className="py-2 pr-3 text-muted">{key === "score" ? dict.cabinet.scoreLabel : dict.panel.ratioRows[key as keyof typeof dict.panel.ratioRows]}</td>
                            <td className="py-2 pr-3 tabular-nums">{formatByKind(before, kind)}</td>
                            <td className="py-2 pr-3 tabular-nums">{formatByKind(after, kind)}</td>
                            <td
                              className={`py-2 tabular-nums ${
                                delta == null ? "text-muted" : delta > 0 ? "text-ok" : delta < 0 ? "text-danger" : "text-muted"
                              }`}
                            >
                              {delta == null ? "—" : `${delta > 0 ? "+" : ""}${formatByKind(delta, kind === "score" ? "score" : kind)}`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg">{dict.cabinet.myBusinessPlans}</h2>

        {businessPlans.length === 0 ? (
          <div className="mt-3">
            <p className="text-sm text-muted">{dict.cabinet.noBusinessPlans}</p>
            <Link
              href={`/${locale}/business-plan-ai`}
              className="mt-2 inline-block text-sm text-primary underline-offset-4 hover:underline"
            >
              {dict.cabinet.goToBusinessPlanAi}
            </Link>
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {businessPlans.map((bp) => {
              const isPlanExpanded = expandedPlanId === bp.id;
              return (
                <li
                  key={bp.id}
                  className="rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{bp.project_name}</p>
                      <p className="mt-1 text-xs text-muted">
                        {new Date(bp.created_at).toLocaleString(locale === "ru" ? "ru-RU" : locale === "uz" ? "uz-UZ" : "en-US")}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <button
                        type="button"
                        className="text-xs text-muted transition-colors hover:text-fg"
                        onClick={() => setExpandedPlanId(isPlanExpanded ? null : bp.id)}
                      >
                        {isPlanExpanded ? dict.cabinet.hideBusinessPlan : dict.cabinet.viewBusinessPlan}
                      </button>
                      <form action={deleteBusinessPlan.bind(null, locale, bp.id)}>
                        <button
                          type="submit"
                          className="text-xs text-muted transition-colors hover:text-danger"
                        >
                          {dict.cabinet.deleteBusinessPlan}
                        </button>
                      </form>
                    </div>
                  </div>

                  {isPlanExpanded ? (
                    <div className="mt-4 border-t border-line/60 pt-4">
                      {bp.data ? (
                        <PlanPanel plan={bp.data} />
                      ) : (
                        <p className="text-xs text-muted">{dict.cabinet.noDataToShow}</p>
                      )}
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={exportingPlanId !== null}
                      onClick={() => exportPlan(bp, "xlsx")}
                      className="rounded-lg bg-raised px-3 py-1.5 text-xs text-fg transition-colors hover:bg-line disabled:opacity-40"
                    >
                      {dict.businessPlanAi.exportXlsx}
                    </button>
                    <button
                      type="button"
                      disabled={exportingPlanId !== null}
                      onClick={() => exportPlan(bp, "pdf")}
                      className="rounded-lg bg-raised px-3 py-1.5 text-xs text-fg transition-colors hover:bg-line disabled:opacity-40"
                    >
                      {dict.businessPlanAi.exportPdf}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
