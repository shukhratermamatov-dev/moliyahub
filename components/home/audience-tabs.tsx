"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";

type AudienceId = "biz" | "inv" | "bank";
const IDS: AudienceId[] = ["biz", "inv", "bank"];
const CTA_HREF: Record<AudienceId, string> = {
  biz: "/analyze",
  inv: "/projects",
  bank: "/about",
};

export function AudienceTabs() {
  const { locale, dict } = useI18n();
  const t = dict.home.audience;
  const [tab, setTab] = useState<AudienceId>("biz");
  const cur = t[tab];

  return (
    <div className="flex flex-col gap-8">
      <div
        role="tablist"
        aria-label={t.tablistLabel}
        className="inline-flex w-fit gap-1.5 rounded-2xl bg-raised p-1.5"
      >
        {IDS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={
              "min-h-11 rounded-xl px-5 text-sm font-semibold transition-colors " +
              (tab === id ? "bg-primary text-primary-fg" : "text-muted hover:text-fg")
            }
          >
            {t[id].label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cur.items.map((item, i) => (
          <div key={item.title} className="flex flex-col gap-3 rounded-3xl border border-line/70 bg-raised p-7">
            <span className="font-display text-sm text-primary-link">0{i + 1}</span>
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className="text-sm leading-relaxed text-muted">{item.text}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button asChild size="lg">
          <Link href={`/${locale}${CTA_HREF[tab]}`}>{cur.cta}</Link>
        </Button>
        <span className="text-sm text-muted">{cur.note}</span>
      </div>
    </div>
  );
}
