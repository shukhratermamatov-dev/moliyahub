"use client";

import Link from "next/link";
import { useState } from "react";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/i18n/provider";
import { findIndustry, findSubIndustry, INDUSTRIES } from "@/lib/data/industries";
import type { ProjectStage } from "@/lib/data/projects";
import { pickText } from "@/lib/i18n-text";
import { useAllProjects } from "@/lib/store";
import { formatMoney } from "@/lib/utils";

export function ProjectsPageClient() {
  const { locale, dict } = useI18n();
  const t = dict.projectsIndex;
  const projects = useAllProjects();
  const [industryId, setIndustryId] = useState<string | null>(null);
  const [subIndustryId, setSubIndustryId] = useState<string | null>(null);

  const selectedIndustry = industryId ? findIndustry(industryId) : undefined;

  const list = projects.filter(
    (p) =>
      (!industryId || p.industryId === industryId) &&
      (!subIndustryId || p.subIndustryId === subIndustryId),
  );

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-3xl md:text-4xl">{t.title}</h1>
            <p className="mt-2 max-w-xl text-muted">{t.subtitle}</p>
          </div>
          <Button asChild>
            <Link href={`/${locale}/projects/new`}>{t.listProject}</Link>
          </Button>
        </div>

        {/* Уровень 1: общие отрасли. */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setIndustryId(null);
              setSubIndustryId(null);
            }}
            className={`min-h-10 rounded-full px-4 text-sm ${
              industryId === null ? "bg-primary text-primary-fg" : "bg-raised text-muted"
            }`}
          >
            {t.allIndustries}
          </button>
          {INDUSTRIES.map((ind) => (
            <button
              key={ind.id}
              type="button"
              onClick={() => {
                setIndustryId(ind.id);
                setSubIndustryId(null);
              }}
              className={`min-h-10 rounded-full px-4 text-sm ${
                industryId === ind.id ? "bg-primary text-primary-fg" : "bg-raised text-muted"
              }`}
            >
              {pickText(ind.name, locale)}
            </button>
          ))}
        </div>

        {/* Уровень 2: детализация внутри выбранной отрасли. */}
        {selectedIndustry ? (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
            <button
              type="button"
              onClick={() => setSubIndustryId(null)}
              className={`min-h-9 rounded-full px-3 text-xs ${
                subIndustryId === null ? "bg-gold/20 text-gold" : "bg-raised text-muted"
              }`}
            >
              {t.allIndustries}
            </button>
            {selectedIndustry.subIndustries.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSubIndustryId(sub.id)}
                className={`min-h-9 max-w-xs rounded-full px-3 text-left text-xs leading-snug ${
                  subIndustryId === sub.id ? "bg-gold/20 text-gold" : "bg-raised text-muted"
                }`}
              >
                {pickText(sub.name, locale)}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {list.map((p) => {
            const industry = findIndustry(p.industryId);
            const sub = findSubIndustry(p.industryId, p.subIndustryId);
            return (
              <Link key={p.id} href={`/${locale}/projects/${p.id}`} className="block">
                <Card className="h-full transition-transform hover:-translate-y-0.5">
                  <div className="text-xs text-gold">
                    {industry ? pickText(industry.name, locale) : ""}
                    {sub ? ` · ${pickText(sub.name, locale)}` : ""} ·{" "}
                    {dict.projectStages[p.stage as ProjectStage]}
                  </div>
                  <h2 className="mt-2 font-display text-2xl">{pickText(p.title, locale)}</h2>
                  <p className="mt-2 line-clamp-3 text-sm text-muted">{pickText(p.description, locale)}</p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="tabular-nums">{formatMoney(p.amount, locale)}</span>
                    <span className="text-muted">{pickText(p.region, locale)}</span>
                  </div>
                </Card>
              </Link>
            );
          })}
          {list.length === 0 ? (
            <p className="text-sm text-muted">{t.emptyState}</p>
          ) : null}
        </div>
      </div>
    </Shell>
  );
}
