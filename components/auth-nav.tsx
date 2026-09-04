"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/provider";
import { createClient } from "@/lib/supabase/client";

export function AuthNav({ onNavigate }: { onNavigate?: () => void }) {
  const { locale, dict } = useI18n();
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loggedIn === null) {
    // Не мигаем ссылкой, пока статус авторизации не определён.
    return <span className="inline-block h-9 w-20" aria-hidden="true" />;
  }

  return (
    <Link
      href={loggedIn ? `/${locale}/cabinet` : `/${locale}/login`}
      onClick={onNavigate}
      className="rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:text-fg"
    >
      {loggedIn ? dict.cabinet.navLink : dict.cabinet.loginNavLink}
    </Link>
  );
}
