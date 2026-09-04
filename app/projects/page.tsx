"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { STAGE_LABEL, type ProjectStage } from "@/lib/data/projects";
import { useAllProjects } from "@/lib/store";
import { formatMoney } from "@/lib/utils";

export default function ProjectsPage() {
  const projects = useAllProjects();
  const [industry, setIndustry] = useState("Все");
  const industries = useMemo(
    () => ["Все", ...Array.from(new Set(projects.map((p) => p.industry)))],
    [projects],
  );
  const list = projects.filter((p) => industry === "Все" || p.industry === industry);

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-3xl md:text-4xl">Биржа проектов</h1>
            <p className="mt-2 max-w-xl text-muted">
              Инвестор выбирает карточку. Предприниматель публикует запрос на капитал.
            </p>
          </div>
          <Button asChild>
            <Link href="/projects/new">Разместить проект</Link>
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
            <Link key={p.id} href={`/projects/${p.id}`} className="block">
              <Card className="h-full transition-transform hover:-translate-y-0.5">
                <div className="text-xs text-gold">
                  {p.industry} · {STAGE_LABEL[p.stage as ProjectStage]}
                </div>
                <h2 className="mt-2 font-display text-2xl">{p.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm text-muted">{p.description}</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="tabular-nums">{formatMoney(p.amount)}</span>
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
