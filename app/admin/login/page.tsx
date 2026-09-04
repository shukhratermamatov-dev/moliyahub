"use client";

import { useActionState } from "react";
import { adminLogin, type LoginState } from "./actions";

const initialState: LoginState = undefined;

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(adminLogin, initialState);

  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-4 text-fg">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]"
      >
        <div className="mb-1 flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-fg">
            M
          </span>
          <span className="font-display text-lg tracking-tight">MoliyaHub · Админ</span>
        </div>
        <p className="mt-2 text-sm text-muted">Доступ только для администратора платформы.</p>
        <label className="mt-6 block text-sm">
          <span className="mb-1 block text-muted">Пароль</span>
          <input
            type="password"
            name="password"
            required
            autoFocus
            className="h-11 w-full rounded-xl bg-raised px-3 text-sm text-fg shadow-[0_0_0_1px_rgba(255,255,255,0.08)] focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </label>
        {state?.error ? <p className="mt-3 text-sm text-danger">{state.error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-fg transition-all hover:brightness-110 disabled:pointer-events-none disabled:opacity-40"
        >
          {pending ? "Проверяем…" : "Войти"}
        </button>
      </form>
    </div>
  );
}
