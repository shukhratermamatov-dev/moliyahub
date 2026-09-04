"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/i18n/provider";
import type { ProjectStage } from "@/lib/data/projects";
import { useAllProjects } from "@/lib/store";
import { formatMoney } from "@/lib/utils";

export function ProjectsPageClient() {
  const { locale, dict } = useI18n();
  const t = dict.projectsIndex;
  const projects = useAllProjects();
  const [industry, setIndustry] = useState(t.allIndustries);
  const industries = useMemo(
    () => [t.allIndustries, ...Array.from(new Set(projects.map((p) => p.industry)))],
    [projects, t.allIndustries],
  );
  const list = projects.filter((p) => industry === t.allIndustries || p.industry === industry);

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

        <div className="mt-6 flex flex-wrap gap-2">
          {industries.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setIndustry(name)}
              className={`min-h-10 rounded-full px-4 text-sm ${
                industry === name ? "bg-primary text-primary-fg" : "bg-raised text-muted"
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {list.map((p) => (
            <Link key={p.id} href={`/${locale}/projects/${p.id}`} className="block">
              <Card className="h-full transition-transform hover:-translate-y-0.5">
                <div className="text-xs text-gold">
                  {p.industry} · {dict.projectStages[p.stage as ProjectStage]}
                </div>
                <h2 className="mt-2 font-display text-2xl">{p.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm text-muted">{p.description}</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="tabular-nums">{formatMoney(p.amount, locale)}</span>
                  <span className="text-muted">{p.region}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </Shell>
  );
}
