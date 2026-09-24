import {
  Calculator,
  CalendarClock,
  ClipboardCheck,
  Cpu,
  FileText,
  LineChart,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { ConsultingCta } from "./consulting-cta";

const SERVICE_ICONS: Record<string, typeof Calculator> = {
  budgeting: Calculator,
  fem: LineChart,
  analysis: ClipboardCheck,
  businessPlans: FileText,
  budgetControl: ShieldCheck,
  cashFlow: Wallet,
  scheduling: CalendarClock,
  kaizen: RefreshCw,
  itSolutions: Cpu,
};

export default async function ConsultingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = await getDictionary(locale);
  const t = dict.consulting;

  return (
    <Shell>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(30,168,122,0.16),_transparent_55%)]" />
        <div className="relative mx-auto max-w-4xl px-4 pb-16 pt-16 md:pt-24">
          <p className="mb-5 inline-flex rounded-full bg-raised px-3 py-1.5 text-sm tracking-wide text-primary">
            {t.eyebrow}
          </p>
          <h1 className="max-w-2xl font-display text-3xl leading-tight md:text-5xl">{t.title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted md:text-lg">{t.subtitle}</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="grid gap-4 md:grid-cols-3">
          {t.services.map((s) => {
            const Icon = SERVICE_ICONS[s.id] ?? Calculator;
            return (
              <article
                key={s.id}
                className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]"
              >
                <Icon className="mb-4 size-6 text-gold" aria-hidden="true" />
                <h3 className="font-display text-lg leading-snug">{s.title}</h3>
                {s.description ? (
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.description}</p>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-20">
        <ConsultingCta t={t} />
      </section>
    </Shell>
  );
}
