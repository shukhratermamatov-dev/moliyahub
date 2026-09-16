import { Shell } from "@/components/layout/shell";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

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
      <section className="mx-auto flex min-h-[50vh] max-w-3xl flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="font-display text-3xl md:text-5xl">{t.title}</h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg">{t.comingSoon}</p>
      </section>
    </Shell>
  );
}
