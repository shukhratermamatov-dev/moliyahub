"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Info, RotateCw, XCircle } from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/i18n/provider";
import type { Dictionary } from "@/i18n/get-dictionary";

type Concept = Dictionary["islamicGuide"]["concepts"][number];

function ConceptCard({
  concept,
  locale,
  t,
}: {
  concept: Concept;
  locale: string;
  t: Dictionary["islamicGuide"];
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="flex flex-col rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]">
      <button
        type="button"
        onClick={() => setFlipped((v) => !v)}
        className="flex-1 text-left"
        aria-expanded={flipped}
      >
        {!flipped ? (
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-xl">{concept.name}</h3>
              <RotateCw className="mt-1 size-4 shrink-0 text-muted" aria-hidden="true" />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">{concept.teaser}</p>
            <p className="mt-4 text-xs text-primary">{t.flipHint}</p>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-lg">{concept.name}</h3>
              <RotateCw className="mt-1 size-4 shrink-0 text-muted" aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-fg">{concept.explanation}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gold">
              {t.differenceLabel}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{concept.difference}</p>
            <p className="mt-3 text-xs text-muted">{concept.bestFor}</p>
          </div>
        )}
      </button>

      {flipped ? (
        concept.hasOffer ? (
          <Button asChild variant="outline" size="sm" className="mt-4 self-start">
            <Link href={`/${locale}/financing?type=ISLAMIC&offer=${concept.id}`}>
              {t.ctaViewOffer}
            </Link>
          </Button>
        ) : (
          <p className="mt-4 rounded-xl bg-raised p-3 text-xs leading-relaxed text-muted">
            {concept.noOfferNote}
          </p>
        )
      ) : null}
    </div>
  );
}

export function IslamicFinancePageClient() {
  const { locale, dict } = useI18n();
  const t = dict.islamicGuide;

  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const isCorrect = quizAnswer === "murabaha";

  return (
    <Shell>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(30,168,122,0.16),_transparent_55%)]" />
        <div className="relative mx-auto max-w-4xl px-4 pb-16 pt-16 md:pt-24">
          <Link
            href={`/${locale}/financing`}
            className="mb-6 inline-block text-sm text-muted transition-colors hover:text-fg"
          >
            ← {t.backToFinancing}
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
        <Card>
          <h2 className="font-display text-2xl">{t.quizHeading}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">{t.quizScenario}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {t.quizOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setQuizAnswer(opt.id)}
                className={`min-h-11 rounded-full px-4 text-sm transition-colors ${
                  quizAnswer === opt.id
                    ? isCorrect
                      ? "bg-primary text-primary-fg"
                      : "bg-danger text-fg"
                    : "bg-raised text-fg hover:bg-line"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {quizAnswer ? (
            <div className="mt-5 flex items-start gap-3 rounded-xl bg-raised p-4 text-sm leading-relaxed text-fg">
              {isCorrect ? (
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
              ) : (
                <XCircle className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden="true" />
              )}
              <p>{isCorrect ? t.quizCorrectFeedback : t.quizIncorrectFeedback}</p>
            </div>
          ) : null}

          {quizAnswer ? (
            <Button variant="ghost" size="sm" className="mt-4" onClick={() => setQuizAnswer(null)}>
              {t.quizRetake}
            </Button>
          ) : null}
        </Card>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-16">
        <h2 className="mb-6 font-display text-3xl">{t.conceptsHeading}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {t.concepts.map((c) => (
            <ConceptCard key={c.id} concept={c} locale={locale} t={t} />
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
            <Link href={`/${locale}/financing`}>{t.ctaAllOffers}</Link>
          </Button>
        </div>
      </section>
    </Shell>
  );
}
