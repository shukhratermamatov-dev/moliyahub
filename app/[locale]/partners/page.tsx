import { Shell } from "@/components/layout/shell";
import { BankLogo } from "@/components/finance/bank-logo";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pickText } from "@/lib/i18n-text";
import { PARTNERS } from "@/lib/data/partners";

export default async function PartnersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = await getDictionary(locale);
  const t = dict.partners;

  return (
    <Shell>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(30,168,122,0.16),_transparent_55%)]" />
        <div className="relative mx-auto max-w-4xl px-4 pb-16 pt-16 md:pt-24">
          <p className="mb-5 inline-flex rounded-full bg-raised px-3 py-1.5 text-sm tracking-wide text-primary">
            {t.eyebrow}
          </p>
          <h1 className="max-w-2xl font-display text-3xl leading-tight md:text-5xl">{t.title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted md:text-lg">{t.intro}</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PARTNERS.map((partner) => (
            <a
              key={partner.id}
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col overflow-hidden rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.07)] transition-shadow hover:shadow-[0_0_0_1px_rgba(30,168,122,0.4)]"
            >
              <div className="flex items-center gap-3">
                <BankLogo name={partner.name} logoDomain={partner.logoDomain} size={48} />
                <div>
                  <h3 className="font-display text-lg">{partner.name}</h3>
                  <p className="mt-0.5 text-xs font-semibold text-gold">{t.categoryLabels[partner.category]}</p>
                </div>
              </div>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-muted">
                {pickText(partner.description, locale)}
              </p>
              <span className="mt-4 inline-block text-xs text-primary hover:underline">{t.visitSite}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20">
        <div className="rounded-2xl bg-raised/40 p-6 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
          <h2 className="font-display text-xl">{t.becomePartnerHeading}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{t.becomePartnerText}</p>
        </div>
      </section>
    </Shell>
  );
}
