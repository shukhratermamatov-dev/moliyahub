-- Журнал ИИ-помощника MoliyaHub: вопросы, ответы и оценки 👍/👎.
-- Выполнить один раз в Supabase: SQL Editor → New query → вставить → Run.
-- Без этой таблицы помощник тоже работает — просто не ведётся журнал.

create table if not exists public.assistant_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  locale text not null,
  page text,
  question text not null,
  answer text not null,
  tools text[] not null default '{}',
  model text,
  rating smallint check (rating in (-1, 1))
);

create index if not exists assistant_logs_created_at_idx on public.assistant_logs (created_at desc);
create index if not exists assistant_logs_rating_idx on public.assistant_logs (rating) where rating is not null;

-- Доступ только серверу (сервисный ключ обходит RLS). Политик для anon и
-- authenticated нет намеренно: посетители не могут читать чужие вопросы.
alter table public.assistant_logs enable row level security;

-- Полезные запросы для разбора качества:
--   Плохо оценённые ответы:
--     select created_at, locale, question, answer from assistant_logs where rating = -1 order by created_at desc;
--   Самые частые темы за неделю:
--     select question from assistant_logs where created_at > now() - interval '7 days' order by created_at desc;
--   Автоочистка старых записей (например, старше 180 дней):
--     delete from assistant_logs where created_at < now() - interval '180 days';
