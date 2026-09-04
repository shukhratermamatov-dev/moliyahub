"use client";

import { usePathname, useRouter } from "next/navigation";
import { locales, LOCALE_LABEL, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

function withLocale(pathname: string, next: Locale): string {
  const parts = pathname.split("/");
  parts[1] = next;
  return parts.join("/") || `/${next}`;
}

export function LanguageSwitcher({ current, className }: { current: Locale; className?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const switchTo = (locale: Locale) => {
    if (locale === current) return;
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
    router.push(withLocale(pathname, locale));
  };

  return (
    <div className={cn("flex items-center gap-1 rounded-lg bg-raised p-1 text-xs", className)}>
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => switchTo(locale)}
          className={cn(
            "rounded-md px-2 py-1.5 font-medium transition-colors",
            locale === current ? "bg-primary text-primary-fg" : "text-muted hover:text-fg",
          )}
        >
          {LOCALE_LABEL[locale]}
        </button>
      ))}
    </div>
  );
}
