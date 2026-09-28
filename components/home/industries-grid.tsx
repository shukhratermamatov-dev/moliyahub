"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/provider";
import { INDUSTRIES } from "@/lib/data/industries";
import { pickText } from "@/lib/i18n-text";
import { Button } from "@/components/ui/button";

// Двухбуквенные коды — визуальный акцент в духе утверждённого макета
// (иконки-плашки вместо картинок для каждой из 11 отраслей «Биржи
// проектов»/бизнес-планов). Коды намеренно на латинице — не зависят от
// локали интерфейса.
const CODES: Record<string, string> = {
  industry: "IN",
  agriculture: "AG",
  construction: "CO",
  logistics: "LG",
  it: "IT",
  finance: "FN",
  tourism: "TR",
  trade: "TD",
  education: "ED",
  healthcare: "HC",
  creative: "CR",
};

export function IndustriesGrid() {
  const { locale, dict } = useI18n();
  const t = dict.home.industriesGrid;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="flex flex-col gap-3 text-center">
        <h2 className="font-display text-3xl">{t.heading}</h2>
        <p className="mx-auto max-w-2xl text-muted">{t.subtitle}</p>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {INDUSTRIES.map((ind) => (
          <Link
            key={ind.id}
            href={`/${locale}/business-plans`}
            className="flex flex-col items-center gap-2 rounded-2xl bg-raised px-3 py-5 text-center transition-colors hover:bg-raised/70"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-primary/15 font-display text-sm text-primary-link">
              {CODES[ind.id] ?? "•"}
            </span>
            <span className="text-xs leading-snug text-muted">{pickText(ind.name, locale)}</span>
          </Link>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Button asChild variant="outline">
          <Link href={`/${locale}/business-plans`}>{t.cta}</Link>
        </Button>
      </div>
    </div>
  );
}
