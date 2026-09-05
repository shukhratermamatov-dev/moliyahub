"use client";

import { useState } from "react";
import { adminLogout } from "./actions";
import { OFFERS, TYPE_LABEL, type FinancingOffer, type FinancingType } from "@/lib/data/banks";
import { SEED_PROJECTS, STAGE_LABEL } from "@/lib/data/projects";
import { sameForAllLocales, sameListForAllLocales } from "@/lib/i18n-text";
import { useHubStore } from "@/lib/store";
import { formatMoney } from "@/lib/utils";

const TABS = [
  { id: "catalog", label: "Каталог финансирования" },
  { id: "projects", label: "Проекты" },
  { id: "applications", label: "Заявки инвесторов" },
  { id: "analyses", label: "Проведённые анализы" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const EMPTY_OFFER_DRAFT = {
  bank: "",
  type: "BANK_LOAN" as FinancingType,
  title: "",
  rateMin: 0,
  rateMax: 0,
  termMin: 6,
  termMax: 24,
  minAmount: 10_000_000,
  maxAmount: 1_000_000_000,
  purpose: "",
  islamic: false,
  note: "",
};

export function AdminDashboard() {
  const [tab, setTab] = useState<TabId>("catalog");

  const hiddenOfferIds = useHubStore((s) => s.hiddenOfferIds);
  const customOffers = useHubStore((s) => s.customOffers);
  const toggleOfferVisibility = useHubStore((s) => s.toggleOfferVisibility);
  const addCustomOffer = useHubStore((s) => s.addCustomOffer);
  const removeCustomOffer = useHubStore((s) => s.removeCustomOffer);

  const extraProjects = useHubStore((s) => s.extraProjects);
  const removeProject = useHubStore((s) => s.removeProject);

  const applications = useHubStore((s) => s.applications);

  const [draft, setDraft] = useState(EMPTY_OFFER_DRAFT);

  const submitOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.bank.trim() || !draft.title.trim()) return;
    // Админ-панель не спрашивает язык — введённый текст показываем как есть
    // на всех локалях сайта, а не переводим его машинно.
    const offer: Omit<FinancingOffer, "id"> = {
      bank: sameForAllLocales(draft.bank),
      type: draft.type,
      title: sameForAllLocales(draft.title),
      rateMin: draft.rateMin,
      rateMax: draft.rateMax,
      termMin: draft.termMin,
      termMax: draft.termMax,
      minAmount: draft.minAmount,
      maxAmount: draft.maxAmount,
      purpose: sameListForAllLocales(
        draft.purpose
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean),
      ),
      islamic: draft.islamic,
      note: sameForAllLocales(draft.note),
    };
    addCustomOffer(offer);
    setDraft(EMPTY_OFFER_DRAFT);
  };

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-40 border-b border-line/80 bg-bg/85 px-4 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-fg">
              M
            </span>
            <span className="font-display text-lg tracking-tight">MoliyaHub · Админ</span>
          </div>
          <form action={adminLogout}>
            <button
              type="submit"
              className="min-h-9 rounded-lg bg-raised px-3 text-xs font-medium text-fg hover:bg-line"
            >
              Выйти
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-xl bg-raised p-4 text-sm text-muted">
          Данные этой панели (кроме пароля) хранятся в localStorage браузера, а не в общей базе
          данных — изменения видны только на этом устройстве и не влияют на других посетителей
          сайта. Для реального администрирования каталога и заявок со всех пользователей нужна
          серверная БД — это следующий этап, который мы договорились пока не начинать.
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`min-h-10 rounded-full px-4 text-sm ${
                tab === t.id ? "bg-primary text-primary-fg" : "bg-raised text-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "catalog" ? (
          <div className="mt-6 space-y-6">
            <section>
              <h2 className="font-display text-xl">Встроенные продукты ({OFFERS.length})</h2>
              <p className="mt-1 text-sm text-muted">
                Скрытые продукты не показываются на публичной странице «Финансирование» в этом
                браузере.
              </p>
              <div className="mt-3 grid gap-2">
                {OFFERS.map((o) => {
                  const hidden = hiddenOfferIds.includes(o.id);
                  return (
                    <div
                      key={o.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]"
                    >
                      <div>
                        <div className="text-xs text-gold">{o.bank.ru}</div>
                        <div className="font-medium">
                          {o.title.ru} <span className="text-muted">· {TYPE_LABEL[o.type]}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleOfferVisibility(o.id)}
                        className={`min-h-9 shrink-0 rounded-lg px-3 text-xs font-medium ${
                          hidden ? "bg-line text-muted" : "bg-raised text-fg hover:bg-line"
                        }`}
                      >
                        {hidden ? "Скрыт — показать" : "Скрыть"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <h2 className="font-display text-xl">Добавленные продукты ({customOffers.length})</h2>
              {customOffers.length === 0 ? (
                <p className="mt-1 text-sm text-muted">Пока ничего не добавлено.</p>
              ) : (
                <div className="mt-3 grid gap-2">
                  {customOffers.map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]"
                    >
                      <div>
                        <div className="text-xs text-gold">{o.bank.ru}</div>
                        <div className="font-medium">
                          {o.title.ru} <span className="text-muted">· {TYPE_LABEL[o.type]}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCustomOffer(o.id)}
                        className="min-h-9 shrink-0 rounded-lg bg-raised px-3 text-xs font-medium text-danger hover:bg-line"
                      >
                        Удалить
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]">
              <h2 className="font-display text-xl">Добавить продукт</h2>
              <form onSubmit={submitOffer} className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-sm sm:col-span-2">
                  <span className="mb-1 block text-muted">Банк / организация</span>
                  <input
                    className="h-11 w-full rounded-xl bg-raised px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={draft.bank}
                    onChange={(e) => setDraft((d) => ({ ...d, bank: e.target.value }))}
                  />
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="mb-1 block text-muted">Название продукта</span>
                  <input
                    className="h-11 w-full rounded-xl bg-raised px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={draft.title}
                    onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-muted">Тип</span>
                  <select
                    className="h-11 w-full rounded-xl bg-raised px-3 text-sm"
                    value={draft.type}
                    onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as FinancingType }))}
                  >
                    {(Object.keys(TYPE_LABEL) as FinancingType[]).map((k) => (
                      <option key={k} value={k}>
                        {TYPE_LABEL[k]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.islamic}
                    onChange={(e) => setDraft((d) => ({ ...d, islamic: e.target.checked }))}
                  />
                  Соответствует шариату
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-muted">Ставка от, %</span>
                  <input
                    type="number"
                    className="h-11 w-full rounded-xl bg-raised px-3 text-sm"
                    value={draft.rateMin}
                    onChange={(e) => setDraft((d) => ({ ...d, rateMin: Number(e.target.value) || 0 }))}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-muted">Ставка до, %</span>
                  <input
                    type="number"
                    className="h-11 w-full rounded-xl bg-raised px-3 text-sm"
                    value={draft.rateMax}
                    onChange={(e) => setDraft((d) => ({ ...d, rateMax: Number(e.target.value) || 0 }))}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-muted">Срок от, мес.</span>
                  <input
                    type="number"
                    className="h-11 w-full rounded-xl bg-raised px-3 text-sm"
                    value={draft.termMin}
                    onChange={(e) => setDraft((d) => ({ ...d, termMin: Number(e.target.value) || 0 }))}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-muted">Срок до, мес.</span>
                  <input
                    type="number"
                    className="h-11 w-full rounded-xl bg-raised px-3 text-sm"
                    value={draft.termMax}
                    onChange={(e) => setDraft((d) => ({ ...d, termMax: Number(e.target.value) || 0 }))}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-muted">Сумма от, сум</span>
                  <input
                    type="number"
                    className="h-11 w-full rounded-xl bg-raised px-3 text-sm"
                    value={draft.minAmount}
                    onChange={(e) => setDraft((d) => ({ ...d, minAmount: Number(e.target.value) || 0 }))}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-muted">Сумма до, сум</span>
                  <input
                    type="number"
                    className="h-11 w-full rounded-xl bg-raised px-3 text-sm"
                    value={draft.maxAmount}
                    onChange={(e) => setDraft((d) => ({ ...d, maxAmount: Number(e.target.value) || 0 }))}
                  />
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="mb-1 block text-muted">Назначение (через запятую)</span>
                  <input
                    className="h-11 w-full rounded-xl bg-raised px-3 text-sm"
                    placeholder="оборудование, оборот"
                    value={draft.purpose}
                    onChange={(e) => setDraft((d) => ({ ...d, purpose: e.target.value }))}
                  />
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="mb-1 block text-muted">Примечание</span>
                  <textarea
                    rows={3}
                    className="w-full rounded-xl bg-raised px-3 py-2.5 text-sm"
                    value={draft.note}
                    onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
                  />
                </label>
                <button
                  type="submit"
                  className="min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-fg hover:brightness-110 sm:col-span-2"
                >
                  Добавить продукт
                </button>
              </form>
            </section>
          </div>
        ) : null}

        {tab === "projects" ? (
          <div className="mt-6 space-y-6">
            <section>
              <h2 className="font-display text-xl">Демо-проекты ({SEED_PROJECTS.length})</h2>
              <p className="mt-1 text-sm text-muted">
                Встроенные примеры — постоянные, их нельзя удалить из этой панели.
              </p>
              <div className="mt-3 grid gap-2">
                {SEED_PROJECTS.map((p) => (
                  <div key={p.id} className="rounded-xl bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]">
                    <div className="text-xs text-gold">
                      {p.industry.ru} · {STAGE_LABEL[p.stage]}
                    </div>
                    <div className="font-medium">{p.title.ru}</div>
                    <div className="text-sm text-muted">
                      {formatMoney(p.amount, "ru")} · {p.region.ru}
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h2 className="font-display text-xl">Опубликованные пользователями ({extraProjects.length})</h2>
              {extraProjects.length === 0 ? (
                <p className="mt-1 text-sm text-muted">
                  Пока ничего — здесь появятся проекты, размещённые через /projects/new в этом браузере.
                </p>
              ) : (
                <div className="mt-3 grid gap-2">
                  {extraProjects.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]"
                    >
                      <div>
                        <div className="text-xs text-gold">
                          {p.industry.ru} · {STAGE_LABEL[p.stage]}
                        </div>
                        <div className="font-medium">{p.title.ru}</div>
                        <div className="text-sm text-muted">
                          {formatMoney(p.amount, "ru")} · {p.owner.ru}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeProject(p.id)}
                        className="min-h-9 shrink-0 rounded-lg bg-raised px-3 text-xs font-medium text-danger hover:bg-line"
                      >
                        Удалить
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}

        {tab === "applications" ? (
          <div className="mt-6">
            <h2 className="font-display text-xl">Заявки инвесторов ({applications.length})</h2>
            {applications.length === 0 ? (
              <p className="mt-1 text-sm text-muted">Пока ничего не отправлено в этом браузере.</p>
            ) : (
              <div className="mt-3 grid gap-2">
                {applications.map((a) => (
                  <div key={a.id} className="rounded-xl bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]">
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span>Проект: {a.projectId}</span>
                      <span>{new Date(a.createdAt).toLocaleString("ru-RU")}</span>
                    </div>
                    <div className="mt-1 font-medium">{a.name}</div>
                    <p className="mt-1 text-sm text-muted">{a.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {tab === "analyses" ? (
          <div className="mt-6">
            <h2 className="font-display text-xl">Проведённые анализы</h2>
            <p className="mt-2 max-w-xl text-sm text-muted">
              Анализы гостей больше не хранятся локально (по требованию — данные незарегистрированных
              посетителей не должны сохраняться после ухода с сайта). Анализы зарегистрированных
              пользователей сохраняются в Supabase, в таблице <code>analyses</code>, привязаны к их
              аккаунту и видны им в личном кабинете. Общий список по всем пользователям сюда пока не
              выведен — при необходимости можно добавить отдельным экраном через сервисный ключ Supabase.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
