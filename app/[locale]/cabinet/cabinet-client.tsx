"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { NumberField } from "@/components/ui/number-input";
import { useI18n } from "@/i18n/provider";
import type { AiAdvice, FinanceData, FinancialRatios } from "@/lib/finance/types";
import { formatMoney, formatPct, formatRatio } from "@/lib/utils";
import { signOut } from "../login/actions";
import { addProject, deleteAnalysis, deleteProject, type ProjectFormState } from "./actions";

export type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  region: string | null;
  amount: number | string | null;
  stage: string;
  created_at: string;
};

export type AnalysisRow = {
  id: string;
  industry: string | null;
  region: string | null;
  data: FinanceData | null;
  ratios: FinancialRatios | null;
  advice: AiAdvice | null;
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

export function CabinetClient({
  email,
  projects,
  analyses,
}: {
  email: string;
  projects: ProjectRow[];
  analyses: AnalysisRow[];
}) {
  const { locale, dict } = useI18n();
  const boundAddProject = addProject.bind(null, locale);
  const [state, formAction, pending] = useActionState(boundAddProject, initialState);
  const [projectAmount, setProjectAmount] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
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
            {projects.map((p) => (
              <li
                key={p.id}
                className="rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{p.name}</p>
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
              </li>
            ))}
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
              {analyses.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start gap-3 rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]"
                >
                  <input
                    type="checkbox"
                    className="mt-1 size-4"
                    checked={selected.includes(a.id)}
                    onChange={() => toggleSelected(a.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">
                        {a.industry || "—"} · {a.region || "—"}
                      </p>
                      <span className="font-display text-lg tabular-nums">
                        {a.ratios ? `${a.ratios.score} / 100` : "—"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {new Date(a.created_at).toLocaleString(locale === "ru" ? "ru-RU" : locale === "uz" ? "uz-UZ" : "en-US")}
                    </p>
                  </div>
                  <form action={deleteAnalysis.bind(null, locale, a.id)}>
                    <button
                      type="submit"
                      className="text-xs text-muted transition-colors hover:text-danger"
                    >
                      {dict.cabinet.deleteAnalysis}
                    </button>
                  </form>
                </li>
              ))}
            </ul>

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
    </div>
  );
}
