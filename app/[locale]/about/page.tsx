import { Shell } from "@/components/layout/shell";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

// Фото команды лежат в public/team/ — у кого фото ещё нет, значение null,
// карточка тогда показывает аватар-заглушку с инициалом (тот же приём, что
// у BankLogo для банков без логотипа) и пометку "Фото скоро появится".
const TEAM_PHOTOS: Record<string, string | null> = {
  ermamatov: "/team/shukhrat-ermamatov.jpg",
  turgunov: "/team/jamshed-turgunov.jpg",
  khalilov: null,
};

function initialsColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  return `hsl(${hue} 45% 30%)`;
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const dict = await getDictionary(locale);
  const t = dict.about;

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

      <section className="mx-auto max-w-5xl px-4 pb-20">
        <h2 className="mb-8 font-display text-3xl">{t.teamHeading}</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {t.team.map((member) => {
            const photo = TEAM_PHOTOS[member.id] ?? null;
            return (
              <article
                key={member.id}
                className="overflow-hidden rounded-2xl bg-surface shadow-[0_0_0_1px_rgba(255,255,255,0.07)]"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-raised">
                  {photo ? (
                    <img src={photo} alt={member.name} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-3">
                      <span
                        className="grid size-20 place-items-center rounded-full font-display text-2xl text-fg/90"
                        style={{ backgroundColor: initialsColor(member.name) }}
                        aria-hidden="true"
                      >
                        {member.name.trim().charAt(0)}
                      </span>
                      <span className="text-xs text-muted">{t.photoComingSoon}</span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg">{member.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-gold">{member.role}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{member.bio}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </Shell>
  );
}
