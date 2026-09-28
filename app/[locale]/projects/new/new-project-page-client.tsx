"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import { Shell } from "@/components/layout/shell";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { NumberField } from "@/components/ui/number-input";
import { useI18n } from "@/i18n/provider";
import { findIndustry, INDUSTRIES, OTHER_SUB_INDUSTRY_ID } from "@/lib/data/industries";
import type { ProjectStage } from "@/lib/data/projects";
import { pickText } from "@/lib/i18n-text";
import { formatMoney } from "@/lib/utils";
import { createPublicProject, type CreatePublicProjectState } from "../actions";

const initialState: CreatePublicProjectState = undefined;

export function NewProjectPageClient({
  latestAnalysis,
}: {
  latestAnalysis: { score: number; label: string } | null;
}) {
  const { locale, dict } = useI18n();
  const t = dict.projectsNew;
  const router = useRouter();
  const boundCreate = createPublicProject.bind(null, locale);
  const [state, formAction, pending] = useActionState(boundCreate, initialState);

  const [title, setTitle] = useState("");
  const [industryId, setIndustryId] = useState(INDUSTRIES[0].id);
  const [subIndustryId, setSubIndustryId] = useState(INDUSTRIES[0].subIndustries[0]?.id ?? "");
  const [subIndustryOther, setSubIndustryOther] = useState("");
  const [region, setRegion] = useState("Ташкент");
  const [stage, setStage] = useState<ProjectStage>("GROWTH");
  const [amount, setAmount] = useState(500_000_000);
  const [description, setDescription] = useState("");
  const [attachScore, setAttachScore] = useState(latestAnalysis != null);
  const [hideContacts, setHideContacts] = useState(true);
  const [intent, setIntent] = useState<"publish" | "draft">("publish");

  const selectedIndustry = findIndustry(industryId);
  const industryLabel = selectedIndustry ? pickText(selectedIndustry.name, locale) : "";

  useEffect(() => {
    if (state && "success" in state) {
      toast.success(state.isPublic ? t.toastPublished : t.toastDraftSaved);
      router.push(state.isPublic ? `/${locale}/projects/${state.id}` : `/${locale}/cabinet#projects`);
    } else if (state && "error" in state) {
      toast.error(t.toastFillRequired);
    }
  }, [state, locale, router, t]);

  const descPreview = description.trim() || t.descriptionLabel;
  const descTruncated = descPreview.length > 150 ? `${descPreview.slice(0, 147)}…` : descPreview;

  return (
    <Shell>
      <Toaster theme="dark" position="top-center" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-display text-3xl">{t.title}</h1>
        <p className="mt-2 text-muted">{t.subtitle}</p>

        <div className="mt-8 flex flex-col gap-8 lg:flex-row">
          <Card className="flex-1">
            <form
              action={formAction}
              onSubmit={() => {
                /* intent записан в скрытом инпуте перед сабмитом кнопками ниже */
              }}
              className="space-y-4"
            >
              <label className="block text-sm">
                <span className="mb-1 block text-muted">{t.titleLabel}</span>
                <Input name="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-muted">{t.ownerLabel}</span>
                <Input name="owner" required />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-muted">{t.ownerContactLabel}</span>
                <Input name="ownerContact" required />
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
                      setSubIndustryOther("");
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
                    <option value={OTHER_SUB_INDUSTRY_ID}>{t.subIndustryOtherOption}</option>
                  </select>
                </label>
              </div>
              {subIndustryId === OTHER_SUB_INDUSTRY_ID ? (
                <label className="block text-sm">
                  <span className="mb-1 block text-muted">{t.subIndustryOtherPlaceholder}</span>
                  <Input
                    name="subIndustryOther"
                    value={subIndustryOther}
                    onChange={(e) => setSubIndustryOther(e.target.value)}
                    placeholder={t.subIndustryOtherPlaceholder}
                    required
                  />
                </label>
              ) : null}
              <label className="block text-sm">
                <span className="mb-1 block text-muted">{t.regionLabel}</span>
                <Input name="region" value={region} onChange={(e) => setRegion(e.target.value)} />
              </label>

              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted">{t.stagePillLabel}</span>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(dict.projectStages) as ProjectStage[]).map((k) => {
                    const active = k === stage;
                    return (
                      <button
                        key={k}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setStage(k)}
                        className={`h-11 rounded-full px-4 text-sm font-medium transition-colors ${
                          active
                            ? "bg-primary text-primary-fg"
                            : "border border-line text-fg hover:border-primary/50"
                        }`}
                      >
                        {dict.projectStages[k]}
                      </button>
                    );
                  })}
                </div>
                <input type="hidden" name="stage" value={stage} />
              </div>

              <label className="block text-sm">
                <span className="mb-1 block text-muted">{t.amountLabel}</span>
                <NumberField value={amount} onValueChange={(n) => setAmount(n || 0)} />
                <input type="hidden" name="amount" value={amount || ""} />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-muted">{t.descriptionLabel}</span>
                <Textarea
                  name="description"
                  rows={5}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>

              <div className="flex flex-col gap-3 rounded-2xl bg-raised p-5">
                <label className="flex items-start gap-3 text-sm leading-relaxed">
                  <input
                    type="checkbox"
                    name="attachScore"
                    checked={attachScore}
                    disabled={!latestAnalysis}
                    onChange={(e) => setAttachScore(e.target.checked)}
                    className="mt-0.5 size-5 accent-primary"
                  />
                  <span>
                    {t.attachScoreLabel}
                    {latestAnalysis ? (
                      <span className="text-muted"> ({t.attachScoreHint(latestAnalysis.label, latestAnalysis.score)})</span>
                    ) : (
                      <span className="mt-1 block text-xs text-muted">{t.attachScoreNoAnalysis}</span>
                    )}
                  </span>
                </label>
                <label className="flex items-start gap-3 text-sm leading-relaxed">
                  <input
                    type="checkbox"
                    name="hideContacts"
                    checked={hideContacts}
                    onChange={(e) => setHideContacts(e.target.checked)}
                    className="mt-0.5 size-5 accent-primary"
                  />
                  <span>{t.hideContactsLabel}</span>
                </label>
              </div>

              {state && "error" in state ? <p className="text-sm text-danger">{t.toastFillRequired}</p> : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  name="intent"
                  value="publish"
                  disabled={pending}
                  onClick={() => setIntent("publish")}
                  className="inline-flex h-14 items-center justify-center rounded-2xl bg-primary px-8 text-base font-semibold text-primary-fg transition-all hover:brightness-110 disabled:pointer-events-none disabled:opacity-40"
                >
                  {pending && intent === "publish" ? t.publishing : t.submit}
                </button>
                <button
                  type="submit"
                  name="intent"
                  value="draft"
                  disabled={pending}
                  onClick={() => setIntent("draft")}
                  className="inline-flex h-14 items-center justify-center rounded-2xl border border-line px-7 text-base font-medium text-fg transition-colors hover:bg-line disabled:pointer-events-none disabled:opacity-40"
                >
                  {pending && intent === "draft" ? t.savingDraft : t.draftCta}
                </button>
              </div>
            </form>
          </Card>

          <div className="flex w-full flex-col gap-3 lg:w-[380px] lg:shrink-0">
            <p className="text-sm text-muted">{t.previewHeading}</p>
            <div className="flex flex-col gap-4 rounded-3xl border border-line/60 bg-surface p-6">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[rgba(90,169,230,0.15)] px-3 py-1.5 text-[13px] text-[#9CCBF0]">
                  {industryLabel}
                </span>
                <span className="rounded-full bg-raised px-3 py-1.5 text-[13px] text-muted">{region}</span>
                <span className="rounded-full bg-raised px-3 py-1.5 text-[13px] text-muted">{dict.projectStages[stage]}</span>
              </div>
              <div className="text-xl font-semibold leading-snug">{title.trim() || t.titleLabel}</div>
              <p className="text-sm leading-relaxed text-muted">{descTruncated}</p>
              {attachScore && latestAnalysis ? (
                <div className="flex items-center gap-3 rounded-2xl bg-inset p-3.5">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full border-4 border-primary text-base font-bold">
                    {latestAnalysis.score}
                  </span>
                  <p className="text-sm leading-snug text-muted">{t.previewScoringNote}</p>
                </div>
              ) : null}
              <div className="mt-1 flex items-end justify-between">
                <div>
                  <p className="text-xs text-muted">{t.amountLabel}</p>
                  <p className="font-display text-2xl font-semibold">{formatMoney(amount, locale)}</p>
                </div>
                <span className="flex h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-fg">
                  {t.previewContactCta}
                </span>
              </div>
            </div>
            <div className="rounded-2xl border border-[rgba(90,169,230,0.25)] bg-[rgba(90,169,230,0.08)] p-4 text-sm leading-relaxed text-[#B7D7F2]">
              {t.previewNote}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
