"use client";

import Link from "next/link";
import { Download, Sparkles } from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/i18n/provider";
import { INDUSTRIES } from "@/lib/data/industries";
import { pickText } from "@/lib/i18n-text";

export function BusinessPlansPageClient() {
  const { locale, dict } = useI18n();
  const t = dict.businessPlans;

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-display text-3xl md:text-4xl">{t.title}</h1>
        <p className="mt-2 max-w-2xl text-muted">{t.subtitle}</p>

        <Card className="mt-8 flex flex-col items-start justify-between gap-4 bg-gradient-to-br from-primary/15 via-surface to-surface sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-5 shrink-0 text-gold" />
            <div>
              <h2 className="font-display text-lg">{t.aiBanner.title}</h2>
              <p className="mt-1 text-sm text-muted">{t.aiBanner.text}</p>
            </div>
          </div>
          <Button asChild variant="gold" className="shrink-0">
            <Link href={`/${locale}/business-plan-ai`}>{t.aiBanner.cta}</Link>
          </Button>
        </Card>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((ind) => {
            const name = pickText(ind.name, locale);
            return (
              <Card key={ind.id} className="flex h-full flex-col justify-between">
                <div>
                  <h2 className="font-display text-xl">{name}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{t.cardDescription(name)}</p>
                </div>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <Button asChild variant="outline" className="w-full">
                    <a href={`/business-plans/${ind.id}.docx`} download>
                      <Download className="size-4" /> {t.downloadDocx}
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <a href={`/business-plans/${ind.id}.xlsx`} download>
                      <Download className="size-4" /> {t.downloadXlsx}
                    </a>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
