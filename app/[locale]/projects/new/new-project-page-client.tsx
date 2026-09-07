"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast, Toaster } from "sonner";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { NumberField } from "@/components/ui/number-input";
import { useI18n } from "@/i18n/provider";
import { findIndustry, INDUSTRIES } from "@/lib/data/industries";
import type { ProjectStage } from "@/lib/data/projects";
import { pickText, sameForAllLocales } from "@/lib/i18n-text";
import { useHubStore } from "@/lib/store";

export function NewProjectPageClient() {
  const { locale, dict } = useI18n();
  const t = dict.projectsNew;
  const router = useRouter();
  const addProject = useHubStore((s) => s.addProject);
  const [title, setTitle] = useState("");
  const [industryId, setIndustryId] = useState(INDUSTRIES[0].id);
  const [subIndustryId, setSubIndustryId] = useState(INDUSTRIES[0].subIndustries[0]?.id ?? "");
  const [stage, setStage] = useState<ProjectStage>("GROWTH");
  const [amount, setAmount] = useState(500_000_000);
  const [region, setRegion] = useState("Ташкент");
  const [owner, setOwner] = useState("");
  const [description, setDescription] = useState("");

  const selectedIndustry = findIndustry(industryId);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !owner.trim()) {
      toast.error(t.toastFillRequired);
      return;
    }
    // Форма не спрашивает язык — публикатор пишет на одном языке, поэтому
    // показываем введённый текст как есть на всех локалях, а не переводим
    // его машинно. Отрасль/подотрасль — не текст, а id из общего справочника
    // lib/data/industries.ts, поэтому переводится сама вместе с интерфейсом.
    const id = addProject({
      title: sameForAllLocales(title),
      industryId,
      subIndustryId: subIndustryId || undefined,
      stage,
      amount,
      region: sameForAllLocales(region),
      owner: sameForAllLocales(owner),
      description: sameForAllLocales(description),
    });
    toast.success(t.toastPublished);
    router.push(`/${locale}/projects/${id}`);
  };

  return (
    <Shell>
      <Toaster theme="dark" position="top-center" />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-display text-3xl">{t.title}</h1>
        <p className="mt-2 text-muted">{t.subtitle}</p>
        <Card className="mt-8">
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block text-muted">{t.titleLabel}</span>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">{t.ownerLabel}</span>
              <Input value={owner} onChange={(e) => setOwner(e.target.value)} />
            </label>
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
              <span className="mb-1 block text-muted">{t.regionLabel}</span>
              <Input value={region} onChange={(e) => setRegion(e.target.value)} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-muted">{t.stageLabel}</span>
                <select
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
              </label>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">{t.descriptionLabel}</span>
              <Textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <Button type="submit">{t.submit}</Button>
          </form>
        </Card>
      </div>
    </Shell>
  );
}
