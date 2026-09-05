import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Landmark,
  LineChart,
  Sparkles,
  Users,
} from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { SITE_IMAGES } from "@/lib/site-images";

const FEATURE_ICONS = [BarChart3, Sparkles, Landmark, LineChart, Users, Building2];

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = await getDictionary(locale);
  const t = dict.home;

  return (
    <Shell>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(30,168,122,0.16),_transparent_55%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 md:pt-24">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="mb-5 inline-flex rounded-full bg-raised px-3 py-1 text-xs tracking-wide text-primary">
                {t.eyebrow}
              </p>
              <h1 className="max-w-3xl font-display text-4xl leading-tight md:text-6xl">
                {t.h1Line1}
                <span className="block text-primary">{t.h1Line2}</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg">{t.subtitle}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href={`/${locale}/analyze`}>
                    {t.ctaPrimary} <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href={`/${locale}/projects`}>{t.ctaSecondary}</Link>
                </Button>
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-[0_0_0_1px_rgba(255,255,255,0.08)] lg:aspect-[4/5]">
              <img
                src={SITE_IMAGES.heroArchitecture.src}
                alt={SITE_IMAGES.heroArchitecture.alt}
                loading="eager"
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/70 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 pb-24">
        <h2 className="mb-10 font-display text-3xl">{t.featuresHeading}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {t.features.map((f, i) => {
            const Icon = FEATURE_ICONS[i];
            return (
              <article
                key={f.title}
                className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]"
              >
                <Icon className="mb-4 size-6 text-gold" />
                <h3 className="font-display text-xl">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center font-display text-3xl">{t.gallery.heading}</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[SITE_IMAGES.bazaar, SITE_IMAGES.textileFactory].map((img, i) => (
              <figure
                key={img.src}
                className="group relative overflow-hidden rounded-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.07)]"
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105 md:h-80"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/85 via-bg/10 to-transparent" />
                <figcaption className="absolute inset-x-0 bottom-0 p-5 font-display text-lg leading-snug text-fg">
                  {t.gallery.items[i].caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h2 className="font-display text-3xl">{t.stepsHeading}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {t.steps.map((s) => (
              <div key={s.n} className="rounded-2xl bg-raised p-6">
                <div className="font-display text-3xl text-gold">{s.n}</div>
                <h3 className="mt-3 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted">{s.text}</p>
              </div>
            ))}
          </div>
          <Button asChild className="mt-10" size="lg">
            <Link href={`/${locale}/analyze`}>{t.finalCta}</Link>
          </Button>
        </div>
      </section>
    </Shell>
  );
}
