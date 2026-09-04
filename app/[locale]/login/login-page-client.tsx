"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useI18n } from "@/i18n/provider";
import { signIn, signUp, type AuthActionState } from "./actions";

const initialState: AuthActionState = undefined;

const inputClass =
  "h-11 w-full rounded-xl bg-raised px-3 text-sm text-fg shadow-[0_0_0_1px_rgba(255,255,255,0.08)] focus:outline-none focus:ring-2 focus:ring-primary/50";
const buttonClass =
  "mt-1 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-fg transition-all hover:brightness-110 disabled:pointer-events-none disabled:opacity-40";

export function LoginPageClient({ next }: { next?: string }) {
  const { locale, dict } = useI18n();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginState, loginAction, loginPending] = useActionState(signIn, initialState);
  const [registerState, registerAction, registerPending] = useActionState(signUp, initialState);

  const state = mode === "login" ? loginState : registerState;
  const errorText =
    state?.status === "error"
      ? {
          invalid_credentials: dict.auth.invalidCredentials,
          email_in_use: dict.auth.emailInUse,
          weak_password: dict.auth.weakPassword,
          generic_error: dict.auth.genericError,
        }[state.code]
      : null;
  const checkEmail = state?.status === "check_email";

  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-4 text-fg">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]">
        <Link href={`/${locale}`} className="mb-1 flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-fg">
            M
          </span>
          <span className="font-display text-lg tracking-tight">MoliyaHub</span>
        </Link>
        <p className="mt-2 text-sm text-muted">{dict.auth.subtitle}</p>

        <div className="mt-6 flex rounded-xl bg-raised p-1 text-sm">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-lg px-3 py-2 transition-colors ${
              mode === "login" ? "bg-primary text-primary-fg" : "text-muted"
            }`}
          >
            {dict.auth.loginButton}
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 rounded-lg px-3 py-2 transition-colors ${
              mode === "register" ? "bg-primary text-primary-fg" : "text-muted"
            }`}
          >
            {dict.auth.registerButton}
          </button>
        </div>

        {checkEmail ? (
          <p className="mt-6 rounded-xl bg-raised p-4 text-sm text-fg">{dict.auth.checkEmail}</p>
        ) : mode === "login" ? (
          <form action={loginAction} className="mt-6 flex flex-col gap-4">
            <input type="hidden" name="locale" value={locale} />
            {next ? <input type="hidden" name="next" value={next} /> : null}
            <label className="block text-sm">
              <span className="mb-1 block text-muted">{dict.auth.emailLabel}</span>
              <input type="email" name="email" required autoComplete="email" className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">{dict.auth.passwordLabel}</span>
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                className={inputClass}
              />
            </label>
            {errorText ? <p className="text-sm text-danger">{errorText}</p> : null}
            <button type="submit" disabled={loginPending} className={buttonClass}>
              {loginPending ? dict.auth.loginPending : dict.auth.loginButton}
            </button>
          </form>
        ) : (
          <form action={registerAction} className="mt-6 flex flex-col gap-4">
            <input type="hidden" name="locale" value={locale} />
            <label className="block text-sm">
              <span className="mb-1 block text-muted">{dict.auth.fullNameLabel}</span>
              <input type="text" name="fullName" autoComplete="name" className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">{dict.auth.emailLabel}</span>
              <input type="email" name="email" required autoComplete="email" className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">{dict.auth.passwordLabel}</span>
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
            <button type="submit" disabled={registerPending} className={buttonClass}>
              {registerPending ? dict.auth.registerPending : dict.auth.registerButton}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
