"use client";

import Link from "next/link";
import { FileText, LineChart, CreditCard } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { Button } from "@/components/ui/button";

// Редизайн блока «Как это работает» (главная страница) по макету,
// присланному пользователем: светлая тёплая (кремовая) секция поверх
// тёмной темы сайта — тот же приём самостоятельной локальной палитры,
// что уже применён в components/home/islamic-teaser.tsx, только в светлую
// сторону. Контент (3 шага, тексты, ссылка кнопки) не меняется — меняется
// только визуальное оформление плюс заголовок-эйбрау и кнопка в шапке
// секции (раньше кнопка была одна под карточками).
const STEP_ICONS = [FileText, LineChart, CreditCard];

// Цикл пастельных цветов для плашки-иконки — тот же язык, что и у бейджей
// отраслей в business-plans-teaser.tsx, но здесь всегда мятный (в макете
// у всех трёх шагов один и тот же зелёный).
const ICON_BADGE_BG = "#DCF2E6";
const ICON_BADGE_FG = "#178257";

export function HowItWorks() {
  const { locale, dict } = useI18n();
  const t = dict.home;

  return (
    <div className="bg-[#F1EADA]">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-[#178257]">{t.stepsEyebrow}</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-[#14161C] sm:text-4xl">
              {t.stepsHeading}
            </h2>
          </div>
          <Button asChild className="rounded-full bg-[#14161C] px-6 text-white shadow-none hover:brightness-125">
            <Link href={`/${locale}/analyze`}>{t.finalCta}</Link>
          </Button>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {t.steps.map((s, i) => {
            const Icon = STEP_ICONS[i] ?? FileText;
            return (
              <div key={s.n} className="rounded-[22px] bg-white p-7 shadow-[0_1px_3px_rgba(20,22,28,0.08)]">
                <div className="flex items-start justify-between">
                  <span
                    className="flex size-11 items-center justify-center rounded-2xl"
                    style={{ background: ICON_BADGE_BG, color: ICON_BADGE_FG }}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="font-display text-5xl font-bold leading-none text-[#14161C]/10">{s.n}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-[#14161C]">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#6E6A5C]">{s.text}</p>
                <div className="mt-6 flex gap-1.5">
                  {[0, 1, 2].map((seg) => (
                    <span
                      key={seg}
                      className="h-1.5 flex-1 rounded-full"
                      style={{ background: seg <= i ? "#22c08a" : "#E7DFC9" }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
