"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { Button } from "@/components/ui/button";
import { INDUSTRIES } from "@/lib/data/industries";
import { INDUSTRY_CODES } from "@/components/home/industries-grid";
import { pickText } from "@/lib/i18n-text";

// Редизайн блока «Готовый шаблон или план с ИИ» (главная страница) по
// макету, присланному пользователем: сетка отраслей (вместо прежних двух
// карточек-кнопок) + отдельная тёмная карточка ИИ-генератора справа.
// По решению пользователя (уточнено через вопрос при редизайне) — сетка
// использует реальный справочник 11 отраслей сайта (lib/data/industries.ts,
// тот же, что и на /business-plans и в components/home/industries-grid.tsx),
// а не список категорий с макета: там «Текстиль»/«Пищевое производство» —
// это подпункты «Промышленности», а не отдельные отрасли, поэтому подписи
// плиток будут немного отличаться от картинки. Коды-бейджи переиспользуют
// INDUSTRY_CODES, чтобы визуальный код отрасли был единым по сайту.

// Цикл пастельных цветов для бейджей отраслей — в духе макета (мятный,
// голубой, сиреневый, персиковый по кругу).
const BADGE_COLORS = [
  { bg: "#DCF2E6", fg: "#178257" },
  { bg: "#DEE7FC", fg: "#3457C7" },
  { bg: "#ECE1FB", fg: "#6E3FC9" },
  { bg: "#FBE7D6", fg: "#C1650E" },
];

export function BusinessPlansTeaser() {
  const { locale, dict } = useI18n();
  const t = dict.home.businessPlansSection;

  return (
    <div className="bg-[#F1EADA]">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-sm font-bold uppercase tracking-wide text-[#178257]">{t.eyebrow}</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-[#14161C] sm:text-4xl">{t.heading}</h2>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {INDUSTRIES.map((ind, i) => {
              const color = BADGE_COLORS[i % BADGE_COLORS.length];
              return (
                <Link
                  key={ind.id}
                  href={`/${locale}/business-plans`}
                  className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(20,22,28,0.08)] transition-transform hover:-translate-y-0.5"
                >
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold"
                    style={{ background: color.bg, color: color.fg }}
                  >
                    {INDUSTRY_CODES[ind.id] ?? "•"}
                  </span>
                  <span className="text-sm font-medium leading-snug text-[#14161C]">
                    {pickText(ind.name, locale)}
                  </span>
                </Link>
              );
            })}
            <Link
              href={`/${locale}/business-plans`}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#14161C] p-4 text-sm font-semibold text-white transition-colors hover:bg-[#14161C]/90"
            >
              {t.allTemplatesCta} <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="flex flex-col justify-between rounded-3xl bg-[#14161C] p-7">
            <div>
              <span className="flex size-11 items-center justify-center rounded-2xl bg-[#22c08a]/15 text-[#22c08a]">
                <Sparkles className="size-5" />
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold text-white">{t.aiTitle}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#AFAA9C]">{t.aiText}</p>
            </div>
            <Button asChild className="mt-6 w-full">
              <Link href={`/${locale}/business-plan-ai`}>{t.aiCta}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
