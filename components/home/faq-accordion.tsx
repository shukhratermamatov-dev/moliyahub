"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useI18n } from "@/i18n/provider";

export function FaqAccordion() {
  const { dict } = useI18n();
  const t = dict.home.faq;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h2 className="text-center font-display text-3xl">{t.heading}</h2>
      <div className="mt-8 flex flex-col gap-3">
        {t.items.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={item.q} className="overflow-hidden rounded-2xl bg-raised">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={isOpen}
              >
                <span className="font-medium">{item.q}</span>
                <ChevronDown
                  className={`size-4 shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isOpen ? <p className="px-5 pb-4 text-sm leading-relaxed text-muted">{item.a}</p> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
