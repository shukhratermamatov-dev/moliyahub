import { createBrowserClient } from "@supabase/ssr";

// Клиентский (браузерный) клиент Supabase — использует публичный anon-ключ,
// безопасен для клиентского бандла. Реальный доступ к данным ограничен RLS.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
