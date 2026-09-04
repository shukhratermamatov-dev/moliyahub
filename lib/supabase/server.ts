import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CookieToSet = { name: string; value: string; options?: any };

// Серверный клиент Supabase — для Server Components и Server Actions.
// Читает/пишет auth-куки текущего запроса; сам поход к данным всё ещё
// ограничен RLS-политиками (anon-ключ + auth.uid() из куки).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Вызов из Server Component — куки обновит middleware,
            // здесь это можно спокойно игнорировать.
          }
        },
      },
    },
  );
}

// Отдельный клиент с сервисным ключом — обходит RLS, только для доверенного
// серверного кода (например, административных операций). Никогда не
// импортировать в клиентские компоненты.
export function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
