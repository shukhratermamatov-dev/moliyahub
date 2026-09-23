"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { NumberField } from "@/components/ui/number-input";
import { useI18n } from "@/i18n/provider";
import { findIndustry, INDUSTRIES } from "@/lib/data/industries";
import type { ProjectStage } from "@/lib/data/projects";
import { pickText } from "@/lib/i18n-text";
import { createPublicProject, type CreatePublicProjectState } from "../actions";

const initialState: CreatePublicProjectState = undefined;

export function NewProjectPageClient() {
  const { locale, dict } = useI18n();
  const t = dict.projectsNew;
  const router = useRouter();
  const boundCreate = createPublicProject.bind(null, locale);
  const [state, formAction, pending] = useActionState(boundCreate, initialState);

  const [industryId, setIndustryId] = useState(INDUSTRIES[0].id);
  const [subIndustryId, setSubIndustryId] = useState(INDUSTRIES[0].subIndustries[0]?.id ?? "");
  const [stage, setStage] = useState<ProjectStage>("GROWTH");
  const [amount, setAmount] = useState(500_000_000);

  const selectedIndustry = findIndustry(industryId);

  useEffect(() => {
    if (state && "success" in state) {
      toast.success(t.toastPublished);
      router.push(`/${locale}/projects/${state.id}`);
    } else if (state && "error" in state) {
      toast.error(t.toastFillRequired);
    }
  }, [state, locale, router, t]);

  return (
    <Shell>
      <Toaster theme="dark" position="top-center" />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-display text-3xl">{t.title}</h1>
        <p className="mt-2 text-muted">{t.subtitle}</p>
        <Card className="mt-8">
          <form action={formAction} className="space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block text-muted">{t.titleLabel}</span>
              <Input name="title" required />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">{t.ownerLabel}</span>
              <Input name="owner" required />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-muted">{t.industryLabel}</span>
                <select
                  name="industryId"
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
                  name="subIndustryId"
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
              <span className="mb-1 block text-muted">{t.regionLabel}</span>
              <Input name="region" defaultValue="Ташкент" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-muted">{t.stageLabel}</span>
                <select
                  name="stage"
                  className="h-11 w-full rounded-xl bg-raised px-3 text-sm"
                  value={stage}
                  onChange={(e) => setStage(e.target.value as ProjectStage)}
                >
                  {(Object.keys(dict.projectStages) as ProjectStage[]).map((k) => (
                    <option key={k} value={k}>
                      {dict.projectStages[k]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted">{t.amountLabel}</span>
                <NumberField value={amount} onValueChange={(n) => setAmount(n || 0)} />
                <input type="hidden" name="amount" value={amount || ""} />
              </label>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">{t.descriptionLabel}</span>
              <Textarea name="description" rows={5} required />
            </label>
            {state && "error" in state ? (
              <p className="text-sm text-danger">{t.toastFillRequired}</p>
            ) : null}
            <Button type="submit" disabled={pending}>
              {pending ? t.publishing : t.submit}
            </Button>
          </form>
        </Card>
      </div>
    </Shell>
  );
}
