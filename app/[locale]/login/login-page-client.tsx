"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { toast, Toaster } from "sonner";
import { useI18n } from "@/i18n/provider";
import { signIn, signUp, requestPasswordReset, type AuthActionState, type ResetActionState } from "./actions";

const initialState: AuthActionState = undefined;
const initialResetState: ResetActionState = undefined;

const inputClass =
  "h-[52px] w-full rounded-xl bg-inset px-4 text-sm text-fg shadow-[0_0_0_1px_rgba(255,255,255,0.14)] focus:outline-none focus:ring-2 focus:ring-primary/50";
const buttonClass =
  "mt-1 inline-flex h-14 w-full items-center justify-center rounded-2xl bg-primary px-4 text-[17px] font-semibold text-primary-fg transition-all hover:brightness-110 disabled:pointer-events-none disabled:opacity-40";

// Роль ("Предприниматель"/"Инвестор") пока не открывает разный функционал
// на сайте — обе роли могут и анализировать, и публиковать проекты, и
// откликаться на чужие. Выбор просто уходит в user_metadata (см.
// login/actions.ts) — задел под персонализацию кабинета/онбординга позже.
type Role = "biz" | "inv";

export function LoginPageClient({
  next,
  initialMode = "login",
}: {
  next?: string;
  initialMode?: "login" | "register";
}) {
  const { locale, dict } = useI18n();
  const t = dict.auth;
  const [mode, setMode] = useState<"login" | "register" | "reset">(initialMode);
  const [role, setRole] = useState<Role>("biz");
  const [loginState, loginAction, loginPending] = useActionState(signIn, initialState);
  const [registerState, registerAction, registerPending] = useActionState(signUp, initialState);
  const [resetState, resetAction, resetPending] = useActionState(requestPasswordReset, initialResetState);

  const state = mode === "login" ? loginState : mode === "register" ? registerState : undefined;
  const errorText =
    state?.status === "error"
      ? {
          invalid_credentials: t.invalidCredentials,
          email_in_use: t.emailInUse,
          weak_password: t.weakPassword,
          generic_error: t.genericError,
        }[state.code]
      : null;
  const checkEmail = state?.status === "check_email";

  return (
    <div className="grid min-h-dvh bg-bg text-fg lg:grid-cols-2">
      <Toaster theme="dark" position="top-center" />

      {/* Левая панель — обещание продукта, видна только на широких экранах. */}
      <div className="relative hidden flex-col justify-center gap-10 overflow-hidden bg-surface px-16 py-14 lg:flex">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-44 -left-36 size-[620px] opacity-[0.08]"
          viewBox="0 0 200 200"
        >
          <defs>
            <pattern id="girihReg" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M20 2 L25 15 L38 20 L25 25 L20 38 L15 25 L2 20 L15 15 Z"
                fill="none"
                stroke="var(--color-primary-link)"
                strokeWidth="1"
              />
              <path
                d="M20 8 L28 12 L32 20 L28 28 L20 32 L12 28 L8 20 L12 12 Z"
                fill="none"
                stroke="var(--color-primary-link)"
                strokeWidth="0.6"
              />
            </pattern>
          </defs>
          <circle cx="100" cy="100" r="98" fill="url(#girihReg)" />
        </svg>

        <Link href={`/${locale}`} className="relative flex items-center gap-3 text-fg no-underline">
          <span className="grid size-[38px] place-items-center rounded-[10px] bg-primary font-display text-lg font-bold text-primary-fg">
            M
          </span>
          <span className="font-display text-xl font-semibold">MoliyaHub</span>
        </Link>

        <div className="relative flex max-w-md flex-col gap-4">
          <h1 className="font-display text-4xl font-semibold leading-[1.12]">{t.heroTitle}</h1>
          <p className="text-lg leading-relaxed text-muted">{t.heroSubtitle}</p>
        </div>

        <div className="relative flex flex-col gap-4">
          {t.heroBullets.map((b) => (
            <div key={b} className="flex items-center gap-3.5 text-base">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-primary-link">
                  <path d="M5 12l5 5L20 7" />
                </svg>
              </span>
              {b}
            </div>
          ))}
        </div>
      </div>

      {/* Правая панель — форма. Единственная панель на мобильном. */}
      <div className="flex flex-grow items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px]">
          <Link href={`/${locale}`} className="mb-8 flex items-center gap-2.5 text-fg no-underline lg:hidden">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-fg">
              M
            </span>
            <span className="font-display text-lg tracking-tight">MoliyaHub</span>
          </Link>

          {mode === "reset" ? (
            <button
              type="button"
              onClick={() => setMode("login")}
              className="mb-6 text-sm text-muted transition-colors hover:text-fg"
            >
              {t.backToLogin}
            </button>
          ) : (
            <div className="mb-6 flex rounded-xl bg-raised p-1.5 text-sm">
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`h-11 flex-1 rounded-lg font-semibold transition-colors ${
                  mode === "register" ? "bg-primary text-primary-fg" : "text-muted"
                }`}
              >
                {t.registerButton}
              </button>
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`h-11 flex-1 rounded-lg font-semibold transition-colors ${
                  mode === "login" ? "bg-primary text-primary-fg" : "text-muted"
                }`}
              >
                {t.loginButton}
              </button>
            </div>
          )}

          {mode === "reset" ? (
            resetState?.status === "sent" ? (
              <p className="rounded-xl bg-raised p-4 text-sm">{t.resetSent}</p>
            ) : (
              <form action={resetAction} className="flex flex-col gap-4">
                <input type="hidden" name="locale" value={locale} />
                <label className="block text-sm">
                  <span className="mb-2 block text-muted">{t.emailLabel}</span>
                  <input type="email" name="email" required autoComplete="email" className={inputClass} />
                </label>
                <button type="submit" disabled={resetPending} className={buttonClass}>
                  {resetPending ? t.resetPending : t.resetButton}
                </button>
              </form>
            )
          ) : checkEmail ? (
            <p className="rounded-xl bg-raised p-4 text-sm">{t.checkEmail}</p>
          ) : mode === "login" ? (
            <form action={loginAction} className="flex flex-col gap-4">
              <input type="hidden" name="locale" value={locale} />
              {next ? <input type="hidden" name="next" value={next} /> : null}
              <label className="block text-sm">
                <span className="mb-2 block text-muted">{t.emailLabel}</span>
                <input type="email" name="email" required autoComplete="email" className={inputClass} />
              </label>
              <label className="block text-sm">
                <span className="mb-2 block text-muted">{t.passwordLabel}</span>
                <input type="password" name="password" required autoComplete="current-password" className={inputClass} />
              </label>
              <button
                type="button"
                onClick={() => setMode("reset")}
                className="-mt-2 self-end text-sm text-muted transition-colors hover:text-fg"
              >
                {t.forgotPassword}
              </button>
              {errorText ? <p className="text-sm text-danger">{errorText}</p> : null}
              <button type="submit" disabled={loginPending} className={buttonClass}>
                {loginPending ? t.loginPending : t.loginButton}
              </button>
            </form>
          ) : (
            <form action={registerAction} className="flex flex-col gap-[18px]">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="role" value={role} />

              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted">{t.chooseRoleLabel}</span>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      ["biz", t.roleBizTitle, t.roleBizSub],
                      ["inv", t.roleInvTitle, t.roleInvSub],
                    ] as const
                  ).map(([id, title, sub]) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={role === id}
                      onClick={() => setRole(id)}
                      className={`flex h-[76px] flex-col gap-1 rounded-2xl border-2 bg-inset px-4 py-3.5 text-left transition-colors ${
                        role === id ? "border-primary" : "border-white/10"
                      }`}
                    >
                      <span className="text-[15px] font-semibold">{title}</span>
                      <span className="text-[13px] text-muted">{sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <label className="block text-sm">
                <span className="mb-2 block text-muted">{t.fullNameLabel}</span>
                <input type="text" name="fullName" autoComplete="name" className={inputClass} />
              </label>
              <label className="block text-sm">
                <span className="mb-2 block text-muted">{t.phoneLabel}</span>
                <input type="tel" name="phone" autoComplete="tel" placeholder="+998" className={inputClass} />
              </label>
              <label className="block text-sm">
                <span className="mb-2 block text-muted">{t.emailLabel}</span>
                <input type="email" name="email" required autoComplete="email" className={inputClass} />
              </label>
              <label className="block text-sm">
                <span className="mb-2 block text-muted">{t.passwordLabel}</span>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className={inputClass}
                />
              </label>
              <label className="flex items-start gap-2.5 text-sm leading-relaxed text-muted">
                <input type="checkbox" required className="mt-0.5 size-[18px] accent-primary" />
                {t.agreementLabel}
              </label>
              {errorText ? <p className="text-sm text-danger">{errorText}</p> : null}
              <button type="submit" disabled={registerPending} className={buttonClass}>
                {registerPending ? t.registerPending : t.registerButton}
              </button>
            </form>
          )}

          {mode !== "reset" && !checkEmail ? (
            <>
              <div className="my-6 flex items-center gap-3.5 text-[13px] text-muted/70">
                <span className="h-px flex-grow bg-white/10" />
                {t.orDivider}
                <span className="h-px flex-grow bg-white/10" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => toast(t.comingSoonToast)}
                  className="h-[52px] rounded-2xl border border-white/15 text-[15px] font-medium text-fg transition-colors hover:bg-raised"
                >
                  {t.oneIdButton}
                </button>
                <button
                  type="button"
                  onClick={() => toast(t.comingSoonToast)}
                  className="h-[52px] rounded-2xl border border-white/15 text-[15px] font-medium text-fg transition-colors hover:bg-raised"
                >
                  {t.telegramButton}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
