"use client";

import Link from "next/link";
import { Moon } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { Button } from "@/components/ui/button";

export function IslamicTeaser() {
  const { locale, dict } = useI18n();
  const t = dict.home.islamicTeaser;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="flex flex-col items-start gap-6 rounded-3xl bg-gradient-to-br from-gold/15 via-surface to-surface p-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold">
            <Moon className="size-5" />
          </span>
          <div>
            <h2 className="font-display text-2xl">{t.heading}</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{t.text}</p>
          </div>
        </div>
        <Button asChild variant="gold" className="w-full shrink-0 sm:w-auto">
          <Link href={`/${locale}/financing?type=ISLAMIC`}>{t.cta}</Link>
        </Button>
      </div>
    </div>
  );
}
