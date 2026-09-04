"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { locale, dict } = useI18n();

  const NAV = [
    { href: `/${locale}`, label: dict.nav.home },
    { href: `/${locale}/analyze`, label: dict.nav.analyze },
    { href: `/${locale}/financing`, label: dict.nav.financing },
    { href: `/${locale}/projects`, label: dict.nav.projects },
  ];

  return (
    <div className="min-h-dvh bg-bg text-fg">
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
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-10 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <p>{dict.shell.footerLine1.replace("{year}", String(new Date().getFullYear()))}</p>
          <p>{dict.shell.footerLine2}</p>
        </div>
      </footer>
    </div>
  );
}
