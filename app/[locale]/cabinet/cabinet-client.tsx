"use client";

import { useActionState } from "react";
import { useI18n } from "@/i18n/provider";
import { formatMoney } from "@/lib/utils";
import { signOut } from "../login/actions";
import { addProject, deleteProject, type ProjectFormState } from "./actions";

export type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  region: string | null;
  amount: number | string | null;
  stage: string;
  created_at: string;
};

const initialState: ProjectFormState = undefined;

const inputClass =
  "h-10 w-full rounded-lg bg-raised px-3 text-sm text-fg shadow-[0_0_0_1px_rgba(255,255,255,0.08)] focus:outline-none focus:ring-2 focus:ring-primary/50";

export function CabinetClient({ email, projects }: { email: string; projects: ProjectRow[] }) {
  const { locale, dict } = useI18n();
  const boundAddProject = addProject.bind(null, locale);
  const [state, formAction, pending] = useActionState(boundAddProject, initialState);

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
              <input type="number" name="amount" min={0} className={inputClass} />
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
    </div>
  );
}
