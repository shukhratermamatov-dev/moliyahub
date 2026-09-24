"use client";

import { useState } from "react";
import { Copy, Mail, Phone } from "lucide-react";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";

const EMAILS = ["info@moliyahub.uz", "shukhrat.ermamatov@gmail.com"];
const PHONE = "+998909300330";

type Panel = "email" | "phone" | null;

type ConsultingCtaDict = {
  ctaHeading: string;
  ctaEmailLabel: string;
  ctaPhoneLabel: string;
  ctaCopy: string;
  ctaCopied: string;
};

export function ConsultingCta({ t }: { t: ConsultingCtaDict }) {
  const [open, setOpen] = useState<Panel>(null);

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t.ctaCopied);
    } catch {
      // Clipboard API может быть недоступен — значение всё равно видно на
      // экране и его можно скопировать вручную, поэтому просто игнорируем.
    }
  }

  return (
    <div className="rounded-2xl bg-raised p-6 text-center md:p-10">
      <Toaster theme="dark" position="top-center" />
      <h2 className="font-display text-2xl">{t.ctaHeading}</h2>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button
          type="button"
          size="lg"
          aria-expanded={open === "email"}
          onClick={() => setOpen((prev) => (prev === "email" ? null : "email"))}
        >
          <Mail className="size-4" aria-hidden="true" />
          {t.ctaEmailLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          aria-expanded={open === "phone"}
          onClick={() => setOpen((prev) => (prev === "phone" ? null : "phone"))}
        >
          <Phone className="size-4" aria-hidden="true" />
          {t.ctaPhoneLabel}
        </Button>
      </div>

      {open === "email" ? (
        <ul className="mx-auto mt-5 flex max-w-sm flex-col gap-2">
          {EMAILS.map((email) => (
            <li
              key={email}
              className="flex items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3 text-sm"
            >
              <a href={`mailto:${email}`} className="truncate text-left text-fg hover:text-primary">
                {email}
              </a>
              <button
                type="button"
                onClick={() => copy(email)}
                aria-label={t.ctaCopy}
                className="shrink-0 text-muted transition-colors hover:text-fg"
              >
                <Copy className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {open === "phone" ? (
        <div className="mx-auto mt-5 flex max-w-sm items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3 text-sm">
          <a href={`tel:${PHONE}`} className="text-fg hover:text-primary">
            {PHONE}
          </a>
          <button
            type="button"
            onClick={() => copy(PHONE)}
            aria-label={t.ctaCopy}
            className="shrink-0 text-muted transition-colors hover:text-fg"
          >
            <Copy className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
