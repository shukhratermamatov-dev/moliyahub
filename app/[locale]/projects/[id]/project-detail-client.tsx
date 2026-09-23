"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { toast, Toaster } from "sonner";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { useI18n } from "@/i18n/provider";
import { findIndustry, findSubIndustry } from "@/lib/data/industries";
import type { Project, ProjectStage } from "@/lib/data/projects";
import { pickText } from "@/lib/i18n-text";
import { useAllProjects, useHubStore } from "@/lib/store";
import { formatMoney } from "@/lib/utils";
import { submitApplication, type SubmitApplicationState } from "../actions";

const initialApplicationState: SubmitApplicationState = undefined;

export function ProjectDetailClient({ id, dbProject }: { id: string; dbProject: Project | null }) {
  const { locale, dict } = useI18n();
  const t = dict.projectDetail;
  const localProjects = useAllProjects();
  // Локальные (seed/zustand) проекты имеют приоритет по id — dbProject
  // подставляется, только если такого id нет среди локальных (см.
  // app/[locale]/projects/[id]/page.tsx: он и не запрашивается для seed-id).
  const project = localProjects.find((p) => p.id === id) ?? dbProject ?? undefined;
  const isDbProject = project?.source === "supabase";

  const addApplication = useHubStore((s) => s.addApplication);
  // Важно: селектор zustand должен возвращать один и тот же массив, если он
  // не менялся — s.applications.filter(...) создавал НОВЫЙ массив на каждый
  // рендер, useSyncExternalStore видел "изменение" на каждой проверке и
  // рендерил компонент бесконечно (React error #185, вкладка падала на
  // любой странице проекта). Берём стабильную ссылку из стора и фильтруем
  // локально через useMemo — пересчитывается только когда реально нужно.
  const allApplications = useHubStore((s) => s.applications);
  const applications = useMemo(
    () => allApplications.filter((a) => a.projectId === id),
    [allApplications, id],
  );
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  // Для проектов из Supabase заявка идёт через серверный экшен (реальная
  // запись, видна только владельцу проекта в личном кабинете) — контакт
  // обязателен, иначе владельцу не с кем будет связаться.
  const boundSubmitApplication = submitApplication.bind(null, project?.id ?? "");
  const [appState, appFormAction, appPending] = useActionState(
    boundSubmitApplication,
    initialApplicationState,
  );

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

  return (
    <Shell>
      <Toaster theme="dark" position="top-center" />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link href={`/${locale}/projects`} className="text-sm text-muted hover:text-fg">
          {t.backLink}
        </Link>
        <p className="mt-6 text-xs text-gold">
          {findIndustry(project.industryId) ? pickText(findIndustry(project.industryId)!.name, locale) : ""}
          {findSubIndustry(project.industryId, project.subIndustryId)
            ? ` · ${pickText(findSubIndustry(project.industryId, project.subIndustryId)!.name, locale)}`
            : ""}{" "}
          · {dict.projectStages[project.stage as ProjectStage]} · {pickText(project.region, locale)}
        </p>
        <h1 className="mt-2 font-display text-4xl">{pickText(project.title, locale)}</h1>
        <p className="mt-2 text-muted">{pickText(project.owner, locale)}</p>
        <p className="mt-6 text-lg tabular-nums text-primary">{formatMoney(project.amount, locale)}</p>
        <p className="mt-6 leading-relaxed">{pickText(project.description, locale)}</p>
        {project.raisedHint ? (
          <p className="mt-4 text-sm text-gold">{pickText(project.raisedHint, locale)}</p>
        ) : null}

        <Card className="mt-10">
          <h2 className="font-display text-xl">{t.applicationHeading}</h2>

          {isDbProject ? (
            <>
              {appState && "success" in appState ? (
                <p className="mt-4 text-sm text-primary">{t.toastSent}</p>
              ) : (
                <form action={appFormAction} className="mt-4 space-y-3">
                  <Input name="name" placeholder={t.namePlaceholder} required />
                  <Input name="contact" placeholder={t.contactPlaceholder} required />
                  <Textarea name="message" rows={4} placeholder={t.messagePlaceholder} />
                  {appState && "error" in appState ? (
                    <p className="text-sm text-danger">{t.toastFillRequired}</p>
                  ) : null}
                  <p className="text-xs text-muted">{t.privacyNote}</p>
                  <Button type="submit" disabled={appPending}>
                    {appPending ? t.sending : t.submit}
                  </Button>
                </form>
              )}
            </>
          ) : (
            <form onSubmit={sendLocal} className="mt-4 space-y-3">
              <Input
                placeholder={t.namePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Textarea
                rows={4}
                placeholder={t.messagePlaceholder}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button type="submit">{t.submit}</Button>
            </form>
          )}
        </Card>

        {/* Для проектов из Supabase заявки видит только владелец в личном
            кабинете (RLS) — публично их не показываем, в отличие от
            демо/локальных проектов, где это старое поведение сохранено. */}
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
    </Shell>
  );
}
