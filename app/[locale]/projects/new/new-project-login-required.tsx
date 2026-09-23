"use client";

import Link from "next/link";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/i18n/provider";
import type { Locale } from "@/i18n/config";

export function NewProjectLoginRequired({ locale }: { locale: Locale }) {
  const { dict } = useI18n();
  const t = dict.projectsNew;

  return (
    <Shell>
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <Card>
          <h1 className="font-display text-2xl">{t.loginRequiredTitle}</h1>
          <p className="mt-3 text-muted">{t.loginRequiredMessage}</p>
          <Button asChild className="mt-6">
            <Link href={`/${locale}/login`}>{t.loginCta}</Link>
          </Button>
        </Card>
      </div>
    </Shell>
  );
}
