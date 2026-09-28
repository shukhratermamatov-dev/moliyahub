"use client";

import { useEffect, useState } from "react";
import { useVisibleOffers, useAllProjects } from "@/lib/store";
import { useI18n } from "@/i18n/provider";

type SiteStats = { analysesCount: number; publicProjectsCount: number };

// Полоса доверия: 2 счётчика — с сервера (реальные строки Supabase,
// /api/stats/site), 2 — из данных, уже загруженных в браузере (каталог
// финансирования и проекты). Партнёрские логотипы — заглушки-плейсхолдеры,
// реальные логотипы должны прислать со стороны заказчика (см. ТЗ).
export function TrustStrip() {
  const { dict } = useI18n();
  const t = dict.home.trustStrip;
  const [stats, setStats] = useState<SiteStats | null>(null);
  const offers = useVisibleOffers();
  const projects = useAllProjects();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stats/site")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: SiteStats | null) => {
        if (!cancelled && data) setStats(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const analysesCount = stats?.analysesCount ?? null;
  const projectsCount = (stats?.publicProjectsCount ?? 0) + projects.length;

  const items: Array<{ value: string; label: string }> = [
    { value: analysesCount !== null ? `${analysesCount}+` : "—", label: t.analyses },
    { value: String(projectsCount), label: t.projects },
    { value: String(offers.length), label: t.products },
    { value: "11", label: t.templates },
  ];

  return (
    <div className="flex flex-col gap-7 border-y border-line bg-surface px-4 py-10">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-6 md:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col gap-1">
            <div className="font-display text-3xl text-primary-link md:text-4xl">{item.value}</div>
            <div className="text-sm text-muted">{item.label}</div>
          </div>
        ))}
      </div>
      <div className="mx-auto flex w-full max-w-6xl items-center gap-5">
        <span className="hidden w-28 shrink-0 text-xs text-muted/60 sm:block">{t.partnersLabel}</span>
        <div className="grid flex-1 grid-cols-3 gap-3 sm:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex h-10 items-center justify-center rounded-lg border border-dashed border-line text-[11px] text-muted/60"
            >
              {t.partnerPlaceholder}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
