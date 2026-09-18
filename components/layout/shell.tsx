"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, Menu, Phone, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { CurrencyTicker } from "@/components/finance/currency-ticker";
import { AuthNav } from "@/components/auth-nav";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

// Внешние сайты по теме платформы — финграмотность, законодательство,
// ЦБ и госуслуги. Ссылки одинаковые для всех локалей, подписи — из словаря.
const USEFUL_LINKS = [
  { id: "finlit", url: "https://finlit.uz" },
  { id: "lex", url: "https://lex.uz" },
  { id: "cbu", url: "https://cbu.uz" },
  { id: "gov", url: "https://my.gov.uz" },
  { id: "soliq", url: "https://soliq.uz" },
  { id: "trk", url: "https://trk.uz/ru/" },
] as const;

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { locale, dict } = useI18n();

  const NAV = [
    { href: `/${locale}`, label: dict.nav.home },
    { href: `/${locale}/analyze`, label: dict.nav.analyze },
    { href: `/${locale}/financing`, label: dict.nav.financing },
    { href: `/${locale}/islamic-finance`, label: dict.nav.islamicGuide },
    { href: `/${locale}/projects`, label: dict.nav.projects },
    { href: `/${locale}/business-plans`, label: dict.nav.businessPlans },
  ];

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <CurrencyTicker />
      <header className="sticky top-0 z-40 border-b border-line/80 bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link href={`/${locale}`} className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-fg">
              M
            </span>
            <span className="font-display text-lg tracking-tight">MoliyaHub</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:text-fg",
                  pathname === item.href && "bg-raised text-fg",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <AuthNav />
            <LanguageSwitcher current={locale} />
            <Button asChild size="sm">
              <Link href={`/${locale}/analyze`}>{dict.shell.calcCta}</Link>
            </Button>
          </div>

          <button
            type="button"
            className="relative grid size-11 place-items-center rounded-lg md:hidden"
            aria-label={open ? dict.shell.closeMenu : dict.shell.openMenu}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {open ? (
          <div className="border-t border-line px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 flex items-center justify-between gap-3">
                <AuthNav onNavigate={() => setOpen(false)} />
                <LanguageSwitcher current={locale} />
              </div>
              <Button asChild className="mt-2">
                <Link href={`/${locale}/analyze`} onClick={() => setOpen(false)}>
                  {dict.shell.calcCta}
                </Link>
              </Button>
            </div>
          </div>
        ) : null}
      </header>
      <main>{children}</main>
      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
            <div className="col-span-2 sm:col-span-3 lg:col-span-1">
              <Link href={`/${locale}`} className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-fg">
                  M
                </span>
                <span className="font-display text-lg tracking-tight">MoliyaHub</span>
              </Link>
              <p className="mt-4 text-sm text-muted">
                {dict.shell.footerLine1.replace("{year}", String(new Date().getFullYear()))}
              </p>
              <p className="mt-2 text-xs text-muted/70">{dict.shell.footerLine2}</p>
            </div>

            <div>
              <span className="text-xs uppercase tracking-wide text-muted/70">{dict.shell.footerMainLabel}</span>
              <ul className="mt-3 flex flex-col gap-2.5 text-sm">
                <li>
                  <Link href={`/${locale}/about`} className="text-muted transition-colors hover:text-fg">
                    {dict.shell.footerMainLinks.about}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/partners`} className="text-muted transition-colors hover:text-fg">
                    {dict.shell.footerMainLinks.partners}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/news`} className="text-muted transition-colors hover:text-fg">
                    {dict.shell.footerMainLinks.news}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <span className="text-xs uppercase tracking-wide text-muted/70">{dict.shell.footerServicesLabel}</span>
              <ul className="mt-3 flex flex-col gap-2.5 text-sm">
                <li>
                  <Link href={`/${locale}/consulting`} className="text-muted transition-colors hover:text-fg">
                    {dict.shell.footerServicesLinks.consulting}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/advice`} className="text-muted transition-colors hover:text-fg">
                    {dict.shell.footerServicesLinks.advice}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <span className="text-xs uppercase tracking-wide text-muted/70">{dict.shell.usefulLinksLabel}</span>
              <ul className="mt-3 flex flex-col gap-2.5 text-sm">
                {USEFUL_LINKS.map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted transition-colors hover:text-fg"
                    >
                      {dict.shell.usefulLinks[link.id]}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <span className="text-xs uppercase tracking-wide text-muted/70">{dict.shell.contactsLabel}</span>
              <ul className="mt-3 flex flex-col gap-2.5 text-sm">
                <li>
                  <a
                    href="tel:+998909300330"
                    className="flex items-center gap-2 text-muted transition-colors hover:text-fg"
                  >
                    <Phone className="size-4 shrink-0" aria-hidden="true" />
                    <span className="whitespace-nowrap">+998 90 930 03 30</span>
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:info@moliyahub.uz"
                    className="flex items-center gap-2 text-muted transition-colors hover:text-fg"
                  >
                    <Mail className="size-4 shrink-0" aria-hidden="true" />
                    <span className="whitespace-nowrap">info@moliyahub.uz</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
