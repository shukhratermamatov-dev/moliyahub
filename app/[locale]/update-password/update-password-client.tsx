"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useI18n } from "@/i18n/provider";
import { updatePassword, type UpdatePasswordActionState } from "./actions";

const initialState: UpdatePasswordActionState = undefined;

const inputClass =
  "h-11 w-full rounded-xl bg-raised px-3 text-sm text-fg shadow-[0_0_0_1px_rgba(255,255,255,0.08)] focus:outline-none focus:ring-2 focus:ring-primary/50";
const buttonClass =
  "mt-1 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-fg transition-all hover:brightness-110 disabled:pointer-events-none disabled:opacity-40";

export function UpdatePasswordClient({ invalidLink }: { invalidLink: boolean }) {
  const { locale, dict } = useI18n();
  const [state, formAction, pending] = useActionState(updatePassword, initialState);

  const errorText =
    state?.status === "error"
      ? {
          weak_password: dict.auth.weakPassword,
          generic_error: dict.auth.genericError,
        }[state.code]
      : null;

  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-4 text-fg">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]">
        <Link href={`/${locale}`} className="mb-1 flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-fg">
            M
          </span>
          <span className="font-display text-lg tracking-tight">MoliyaHub</span>
        </Link>

        {invalidLink ? (
          <>
            <p className="mt-6 rounded-xl bg-raised p-4 text-sm text-fg">{dict.auth.resetLinkInvalid}</p>
            <Link
              href={`/${locale}/login`}
              className="mt-4 inline-flex text-sm text-muted transition-colors hover:text-fg"
            >
              {dict.auth.backToLogin}
            </Link>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted">{dict.auth.updatePasswordSubtitle}</p>
            <form action={formAction} className="mt-6 flex flex-col gap-4">
              <input type="hidden" name="locale" value={locale} />
              <label className="block text-sm">
                <span className="mb-1 block text-muted">{dict.auth.newPasswordLabel}</span>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className={inputClass}
                />
              </label>
              {errorText ? <p className="text-sm text-danger">{errorText}</p> : null}
              <button type="submit" disabled={pending} className={buttonClass}>
                {pending ? dict.auth.updatePasswordPending : dict.auth.updatePasswordButton}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
