"use client";

import Link from "next/link";
import { useState } from "react";
import { Info, RotateCw } from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";

type Tip = {
  id: string;
  title: string;
  teaser: string;
  text: string;
};

function TipCard({ tip }: { tip: Tip }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setFlipped((v) => !v)}
      className="flex flex-col rounded-2xl bg-surface p-5 text-left shadow-[0_0_0_1px_rgba(255,255,255,0.07)] transition-colors hover:bg-raised"
      aria-expanded={flipped}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-lg">{tip.title}</h3>
        <RotateCw className="mt-1 size-4 shrink-0 text-muted" aria-hidden="true" />
      </div>
      {!flipped ? (
        <p className="mt-2 text-sm leading-relaxed text-muted">{tip.teaser}</p>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-fg">{tip.text}</p>
      )}
    </button>
  );
}

export function AdvicePageClient() {
  const { locale, dict } = useI18n();
  const t = dict.advicePage;

  return (
    <Shell>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(30,168,122,0.16),_transparent_55%)]" />
        <div className="relative mx-auto max-w-4xl px-4 pb-16 pt-16 md:pt-24">
          <Link
            href={`/${locale}`}
            className="mb-6 inline-block text-sm text-muted transition-colors hover:text-fg"
          >
            {t.backHome}
          </Link>
          <p className="mb-5 inline-flex rounded-full bg-raised px-3 py-1.5 text-sm tracking-wide text-primary">
            {t.eyebrow}
          </p>
          <h1 className="max-w-2xl font-display text-3xl leading-tight md:text-5xl">{t.title}</h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted md:text-lg">
            {t.subtitle}
          </p>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">{t.intro}</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-16">
        <h2 className="mb-2 font-display text-3xl">{t.tipsHeading}</h2>
        <p className="mb-6 text-sm text-primary">{t.flipHint}</p>
        <div className="grid gap-4 md:grid-cols-3">
          {t.tips.map((tip) => (
            <TipCard key={tip.id} tip={tip} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-20">
        <div className="flex items-start gap-3 rounded-2xl bg-raised p-5">
          <Info className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden="true" />
          <div>
            <h3 className="text-sm font-semibold text-fg">{t.disclaimerHeading}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">{t.disclaimer}</p>
          </div>
        </div>

        <div className="mt-8">
          <Button asChild size="lg">
            <Link href={`/${locale}/analyze`}>{t.ctaAnalyze}</Link>
          </Button>
        </div>
      </section>
    </Shell>
  );
}
