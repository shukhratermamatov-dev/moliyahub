"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/provider";
import { findIndustry, resolveSubIndustryLabel } from "@/lib/data/industries";
import type { Project, ProjectStage } from "@/lib/data/projects";
import { pickText } from "@/lib/i18n-text";
import { useAllProjects } from "@/lib/store";
import { formatMoney } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Реальные проекты «Биржи»: серверные (Supabase, is_public=true) + то, что
// пользователь добавил только в своём браузере — тот же источник, что и
// на /projects. Показываем первые несколько как витрину на главной.
export function ProjectsCarousel({ dbProjects }: { dbProjects: Project[] }) {
  const { locale, dict } = useI18n();
  const t = dict.home.projectsCarousel;
  const localProjects = useAllProjects();
  const projects = [...dbProjects, ...localProjects].slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="flex flex-col gap-3 text-center">
        <h2 className="font-display text-3xl">{t.heading}</h2>
        <p className="mx-auto max-w-2xl text-muted">{t.subtitle}</p>
      </div>
      {projects.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted">{t.emptyState}</p>
      ) : (
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const industry = findIndustry(p.industryId);
            const subLabel = resolveSubIndustryLabel(p.industryId, p.subIndustryId, p.subIndustryOther, locale);
            return (
              <Link key={p.id} href={`/${locale}/projects/${p.id}`} className="block">
                <Card className="h-full transition-transform hover:-translate-y-0.5">
                  <div className="text-xs text-gold">
                    {industry ? pickText(industry.name, locale) : ""}
                    {subLabel ? ` · ${subLabel}` : ""} ·{" "}
                    {dict.projectStages[p.stage as ProjectStage]}
                  </div>
                  <h3 className="mt-2 font-display text-xl">{pickText(p.title, locale)}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted">{pickText(p.description, locale)}</p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="tabular-nums">{formatMoney(p.amount, locale)}</span>
                    <span className="text-muted">{pickText(p.region, locale)}</span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
      <div className="mt-8 text-center">
        <Button asChild variant="outline">
          <Link href={`/${locale}/projects`}>{t.cta}</Link>
        </Button>
      </div>
    </div>
  );
}
