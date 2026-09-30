"use client";

import Link from "next/link";
import { useActionState, useCallback, useEffect, useMemo, useState } from "react";
import { toast, Toaster } from "sonner";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { useI18n } from "@/i18n/provider";
import { findIndustry, resolveSubIndustryLabel } from "@/lib/data/industries";
import type { Project, ProjectStage } from "@/lib/data/projects";
import { pickText } from "@/lib/i18n-text";
import { useAllProjects, useHubStore } from "@/lib/store";
import { formatMoney } from "@/lib/utils";
import { submitApplication, type SubmitApplicationState } from "../actions";

const initialApplicationState: SubmitApplicationState = undefined;

type DbApplicationStatus = "pending" | "approved" | "declined";

function ownerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
  return letters.join("") || "??";
}

export function ProjectDetailClient({ id, dbProject }: { id: string; dbProject: Project | null }) {
  const { locale, dict } = useI18n();
  const t = dict.projectDetail;
  const localProjects = useAllProjects();
  const project = localProjects.find((p) => p.id === id) ?? dbProject ?? undefined;
  const isDbProject = project?.source === "supabase";

  const addApplication = useHubStore((s) => s.addApplication);
  const allApplications = useHubStore((s) => s.applications);
  const applications = useMemo(
    () => allApplications.filter((a) => a.projectId === id),
    [allApplications, id],
  );
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const boundSubmitApplication = submitApplication.bind(null, project?.id ?? "");
  const [appState, appFormAction, appPending] = useActionState(
    boundSubmitApplication,
    initialApplicationState,
  );

  // Заявки инвесторов на проекты из Supabase хранятся на сервере (RLS —
  // видит только владелец), а у инвестора аккаунта нет, поэтому единственный
  // способ вернуться и проверить, одобрил ли автор контакты — запомнить id
  // своей заявки в localStorage браузера и периодически спрашивать его
  // статус через /api/applications/[id] (см. этот роут — отдаёт контакт
  // автора только когда status === "approved").
  const storageKey = project ? `moliyahub-application-${project.id}` : null;
  const [dbApplicationId, setDbApplicationId] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<DbApplicationStatus | null>(null);
  const [dbOwnerContact, setDbOwnerContact] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const refreshStatus = useCallback(async (applicationId: string) => {
    setCheckingStatus(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}`);
      if (!res.ok) {
        // Заявку не нашли (например, удалена) — сбрасываем локальный след.
        if (storageKey) window.localStorage.removeItem(storageKey);
        setDbApplicationId(null);
        setDbStatus(null);
        setDbOwnerContact(null);
        return;
      }
      const json = (await res.json()) as { status: DbApplicationStatus; ownerContact: string | null };
      setDbStatus(json.status);
      setDbOwnerContact(json.ownerContact);
    } catch {
      // Сеть недоступна — оставляем как было, просто не обновляем.
    } finally {
      setCheckingStatus(false);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!isDbProject || !storageKey) return;
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      setDbApplicationId(stored);
      void refreshStatus(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDbProject, storageKey]);

  useEffect(() => {
    if (appState && "success" in appState && storageKey) {
      window.localStorage.setItem(storageKey, appState.id);
      setDbApplicationId(appState.id);
      setDbStatus("pending");
      setDbOwnerContact(null);
      toast.success(t.toastSent);
    } else if (appState && "error" in appState) {
      toast.error(appState.error === "fill_required" ? t.toastFillRequired : t.toastGenericError);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState]);

  const resetApplication = () => {
    if (storageKey) window.localStorage.removeItem(storageKey);
    setDbApplicationId(null);
    setDbStatus(null);
    setDbOwnerContact(null);
  };

  if (!project) {
    return (
      <Shell>
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="font-display text-3xl">{t.notFoundTitle}</h1>
          <Button asChild className="mt-6">
            <Link href={`/${locale}/projects`}>{t.backToCatalog}</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  const sendLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      toast.error(t.toastFillRequired);
      return;
    }
    addApplication({ projectId: id, name, message });
    setMessage("");
    toast.success(t.toastSent);
  };

  const industryLabel = findIndustry(project.industryId) ? pickText(findIndustry(project.industryId)!.name, locale) : "";
  const subLabel = resolveSubIndustryLabel(project.industryId, project.subIndustryId, project.subIndustryOther, locale);
  const dateLocale = locale === "ru" ? "ru-RU" : locale === "uz" ? "uz-UZ" : "en-US";
  const publishedDate = project.createdAt ? new Date(project.createdAt).toLocaleDateString(dateLocale) : null;
  const ownerName = pickText(project.owner, locale);
  const ownerYear = project.createdAt ? new Date(project.createdAt).getFullYear() : null;

  return (
    <Shell>
      <Toaster theme="dark" position="top-center" />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Link href={`/${locale}/projects`} className="text-sm text-muted hover:text-fg">
          {t.backLink}
        </Link>

        <div className="mt-6 flex flex-wrap gap-2">
          <span className="rounded-full bg-[rgba(90,169,230,0.15)] px-3 py-1.5 text-[13px] text-[#9CCBF0]">
            {industryLabel}
            {subLabel ? ` · ${subLabel}` : ""}
          </span>
          <span className="rounded-full bg-raised px-3 py-1.5 text-[13px] text-muted">{pickText(project.region, locale)}</span>
          <span className="rounded-full bg-raised px-3 py-1.5 text-[13px] text-muted">{dict.projectStages[project.stage as ProjectStage]}</span>
          {project.attachedScore != null ? (
            <span className="rounded-full bg-ok/15 px-3 py-1.5 text-[13px] text-ok">{t.scoringConfirmedBadge}</span>
          ) : null}
        </div>

        <h1 className="mt-4 font-display text-4xl">{pickText(project.title, locale)}</h1>
        <p className="mt-2 text-muted">
          {ownerName}
          {publishedDate ? ` · ${t.publishedOn(publishedDate)}` : ""}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-md">
          <div className="rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]">
            <p className="text-xs text-muted">{t.amountStatLabel}</p>
            <p className="mt-1.5 font-display text-xl font-semibold">{formatMoney(project.amount, locale)}</p>
          </div>
          {project.attachedScore != null ? (
            <div className="rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]">
              <p className="text-xs text-muted">{t.scoreStatLabel}</p>
              <p className="mt-1.5 font-display text-xl font-semibold">{project.attachedScore} / 100</p>
            </div>
          ) : null}
        </div>

        <div className="mt-10 flex flex-col gap-10 lg:flex-row">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl">{t.aboutHeading}</h2>
            <p className="mt-3 leading-relaxed">{pickText(project.description, locale)}</p>
            {project.raisedHint ? (
              <p className="mt-4 text-sm text-gold">{pickText(project.raisedHint, locale)}</p>
            ) : null}

            {!isDbProject && applications.length > 0 ? (
              <div className="mt-8 space-y-3">
                <h3 className="font-display text-lg">{t.receivedApplications}</h3>
                {applications.map((a) => (
                  <Card key={a.id}>
                    <div className="font-medium">{a.name}</div>
                    <p className="mt-1 text-sm text-muted">{a.message}</p>
                  </Card>
                ))}
              </div>
            ) : null}
          </div>

          <aside className="w-full shrink-0 lg:w-[380px]">
            <div className="rounded-3xl border border-line/60 bg-surface p-6">
              <div className="flex items-center gap-3.5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#1E3A48] text-[17px] font-semibold">
                  {ownerInitials(ownerName)}
                </span>
                <div>
                  <p className="font-medium">{ownerName}</p>
                  {ownerYear ? <p className="text-xs text-muted">{t.ownerPlatformSince(ownerYear)}</p> : null}
                </div>
              </div>

              {isDbProject ? (
                <div className="mt-5">
                  {!dbApplicationId ? (
                    appState && "success" in appState ? null : (
                      <>
                        <h2 className="font-display text-xl">{t.applicationHeading}</h2>
                        <form action={appFormAction} className="mt-4 space-y-3">
                          <Input name="name" placeholder={t.namePlaceholder} required />
                          <Input name="contact" placeholder={t.contactPlaceholder} required />
                          <Textarea name="message" rows={4} placeholder={t.messagePlaceholder} />
                          {appState && "error" in appState ? (
                            <p className="text-sm text-danger">
                              {appState.error === "fill_required" ? t.toastFillRequired : t.toastGenericError}
                            </p>
                          ) : null}
                          <p className="text-xs text-muted">{t.privacyNote}</p>
                          <Button type="submit" disabled={appPending}>
                            {appPending ? t.sending : t.submit}
                          </Button>
                        </form>
                      </>
                    )
                  ) : dbStatus === "approved" ? (
                    <div className="flex flex-col gap-3 rounded-2xl border border-ok/35 bg-ok/10 p-4">
                      <p className="font-semibold text-ok">{t.statusApprovedTitle}</p>
                      <p className="text-sm text-fg">{dbOwnerContact ?? "—"}</p>
                    </div>
                  ) : dbStatus === "declined" ? (
                    <div className="flex flex-col gap-3 rounded-2xl bg-raised p-4">
                      <p className="font-semibold text-danger">{t.statusDeclinedTitle}</p>
                      <p className="text-sm text-muted">{t.statusDeclinedBody}</p>
                      <button
                        type="button"
                        onClick={resetApplication}
                        className="self-start rounded-lg border border-line px-3 py-1.5 text-xs text-fg transition-colors hover:bg-line"
                      >
                        {t.newApplicationCta}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 rounded-2xl bg-raised p-4">
                      <p className="font-semibold">{t.statusPendingTitle}</p>
                      <p className="text-sm text-muted">{t.statusPendingBody}</p>
                      <p className="text-xs text-muted">{t.contactUnavailableNote}</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={checkingStatus}
                          onClick={() => dbApplicationId && void refreshStatus(dbApplicationId)}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-fg transition-all hover:brightness-110 disabled:opacity-40"
                        >
                          {t.checkStatusCta}
                        </button>
                        <button
                          type="button"
                          onClick={resetApplication}
                          className="rounded-lg border border-line px-3 py-1.5 text-xs text-fg transition-colors hover:bg-line"
                        >
                          {t.changeApplicationCta}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-5">
                  <h2 className="font-display text-xl">{t.applicationHeading}</h2>
                  <form onSubmit={sendLocal} className="mt-4 space-y-3">
                    <Input placeholder={t.namePlaceholder} value={name} onChange={(e) => setName(e.target.value)} />
                    <Textarea
                      rows={4}
                      placeholder={t.messagePlaceholder}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                    <Button type="submit">{t.submit}</Button>
                  </form>
                </div>
              )}

              <p className="mt-5 text-xs leading-relaxed text-muted">{t.dealDisclaimer}</p>
            </div>
          </aside>
        </div>
      </div>
    </Shell>
  );
}
