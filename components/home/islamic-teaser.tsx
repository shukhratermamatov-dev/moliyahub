"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/provider";
import { Button } from "@/components/ui/button";

export function IslamicTeaser() {
  const { locale, dict } = useI18n();
  const t = dict.home.islamicTeaser;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="relative flex flex-col gap-14 overflow-hidden rounded-3xl bg-[#14110A] p-8 sm:p-12 lg:flex-row lg:items-center lg:gap-16 lg:p-16">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -left-32 size-[520px] opacity-10 sm:-bottom-52 sm:-left-40 sm:size-[640px]"
          viewBox="0 0 200 200"
        >
          <defs>
            <pattern id="girihGold" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M20 2 L25 15 L38 20 L25 25 L20 38 L15 25 L2 20 L15 15 Z"
                fill="none"
                stroke="var(--color-gold)"
                strokeWidth="1"
              />
              <path
                d="M20 8 L28 12 L32 20 L28 28 L20 32 L12 28 L8 20 L12 12 Z"
                fill="none"
                stroke="var(--color-gold)"
                strokeWidth="0.6"
              />
            </pattern>
          </defs>
          <circle cx="100" cy="100" r="98" fill="url(#girihGold)" />
        </svg>

        <div className="relative flex shrink-0 flex-col items-start gap-5 lg:w-[380px]">
          <span className="text-sm font-semibold uppercase tracking-wide text-gold">{t.eyebrow}</span>
          <h2 className="font-display text-3xl font-semibold leading-tight text-[#F7EEDB] sm:text-4xl">
            {t.heading}
          </h2>
          <p className="text-base leading-relaxed text-[#CFC3A6] sm:text-lg">{t.text}</p>
          <Button asChild variant="gold" className="mt-1">
            <Link href={`/${locale}/islamic-finance`}>{t.cta}</Link>
          </Button>
        </div>

        <div className="relative grid flex-1 grid-cols-1 gap-5 sm:grid-cols-2">
          {t.cards.map((card) => (
            <div
              key={card.title}
              className="flex flex-col gap-2.5 rounded-[22px] border border-[rgba(224,179,84,0.22)] bg-[#1E1910] p-7"
            >
              <div className="font-display text-xl font-semibold text-[#F0CF86]">{card.title}</div>
              <div className="text-sm leading-relaxed text-[#CFC3A6]">{card.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
