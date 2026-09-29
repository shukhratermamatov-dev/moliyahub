"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { findIndustry } from "@/lib/data/industries";
import type { Project, ProjectStage } from "@/lib/data/projects";
import { pickText } from "@/lib/i18n-text";
import { useAllProjects } from "@/lib/store";
import { formatMoney, cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Редизайн блока «Проекты на бирже» (главная страница) по макету,
// присланному пользователем: вместо статичной сетки 3×2 — горизонтальная
// карусель карточек (прокрутка + стрелки), эйбрау над заголовком, карточки
// с бейджами отрасли/региона вместо строки-«хлебной крошки» и отдельным
// «Подробнее →» на карточке. По решению пользователя (уточнено вопросом)
// кнопка «Смотреть все проекты» сохранена под каруселью — на макете её нет,
// но без нее с главной страницы исчезал путь к полному каталогу /projects
// (витрина показывает только первые 6 проектов).
//
// Реальные проекты «Биржи»: серверные (Supabase, is_public=true) + то, что
// пользователь добавил только в своём браузере — тот же источник, что и
// на /projects. Показываем первые несколько как витрину на главной.
export function ProjectsCarousel({ dbProjects }: { dbProjects: Project[] }) {
  const { locale, dict } = useI18n();
  const t = dict.home.projectsCarousel;
  const localProjects = useAllProjects();
  const projects = useMemo(() => [...dbProjects, ...localProjects].slice(0, 6), [dbProjects, localProjects]);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const update = () => {
      setCanScrollPrev(el.scrollLeft > 4);
      setCanScrollNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [projects.length]);

  function scrollByCard(dir: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-carousel-card]");
    const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.9;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-primary">{t.eyebrow}</p>
          <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">{t.heading}</h2>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline">
            <Link href={`/${locale}/projects/new`}>
              <Plus className="size-4" /> {t.addProjectCta}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/${locale}/projects`}>{t.cta}</Link>
          </Button>
          {projects.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous"
                disabled={!canScrollPrev}
                onClick={() => scrollByCard(-1)}
                className="flex size-10 items-center justify-center rounded-full bg-raised text-fg transition-colors hover:bg-line disabled:opacity-30"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Next"
                disabled={!canScrollNext}
                onClick={() => scrollByCard(1)}
                className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-fg transition-colors hover:brightness-110 disabled:opacity-30"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {projects.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted">{t.emptyState}</p>
      ) : (
        <div
          ref={scrollerRef}
          className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2"
        >
          {projects.map((p) => {
            const industry = findIndustry(p.industryId);
            return (
              <Link key={p.id} href={`/${locale}/projects/${p.id}`} data-carousel-card className="block shrink-0 snap-start">
                <Card className="group h-full w-[300px] transition-transform hover:-translate-y-0.5 sm:w-[320px]">
                  <div className="flex flex-wrap gap-2">
                    {industry && (
                      <span className="rounded-full bg-raised px-3 py-1 text-xs text-muted">
                        {pickText(industry.name, locale)}
                      </span>
                    )}
                    <span className="rounded-full bg-raised px-3 py-1 text-xs text-muted">
                      {pickText(p.region, locale)}
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-lg leading-snug">{pickText(p.title, locale)}</h3>
                  <p className="mt-2 text-sm text-muted">
                    {t.stageLabel}: {dict.projectStages[p.stage as ProjectStage]}
                  </p>
                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      <div className="text-xs text-muted">{t.amountLabel}</div>
                      <div className="mt-0.5 font-display text-lg tabular-nums">{formatMoney(p.amount, locale)}</div>
                    </div>
                    <span
                      className={cn(
                        "flex items-center gap-1 text-sm font-medium text-primary-link",
                        "transition-transform group-hover:translate-x-0.5",
                      )}
                    >
                      {t.detailsCta} <ArrowRight className="size-3.5" />
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
