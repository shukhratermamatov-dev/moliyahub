import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, locales, type Locale } from "@/i18n/config";
import { ADMIN_SESSION_COOKIE, computeAdminToken } from "@/lib/admin-auth";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

function detectLocale(request: NextRequest): Locale {
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && isLocale(cookieLocale)) {
    return cookieLocale;
  }

  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    for (const part of acceptLanguage.split(",")) {
      const code = part.split(";")[0]?.trim().slice(0, 2).toLowerCase();
      if (code && isLocale(code)) {
        return code;
      }
    }
  }

  return defaultLocale;
}

// Пути внутри /[locale]/..., которые требуют входа — редиректим на /login,
// если пользователь не аутентифицирован через Supabase.
const PROTECTED_SEGMENTS = ["cabinet"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API-роуты (например /api/cbu-rates) — не под [locale], их не редиректим
  // на языковой префикс, иначе получаем 404.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Статические файлы из public/ (образцы .xlsx, изображения и т.п.) — у них
  // нет языкового префикса и не должно быть: последний сегмент пути с точкой
  // (расширением) — это файл, а не страница. Раньше сюда попадали только
  // favicon/og с явным перечислением, но /business-plans/<id>.xlsx показал,
  // что список нужно было держать закрытым по паттерну, а не перечислением —
  // иначе редирект на /<locale>/business-plans/<id>.xlsx даёт 404.
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) {
    return NextResponse.next();
  }

  // Админка живёт вне [locale] — всегда на /admin, без языкового префикса,
  // и использует свой отдельный пароль-гейт (не Supabase Auth).
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const expected = process.env.ADMIN_PASSWORD;
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const validToken = expected ? await computeAdminToken(expected) : null;

    if (!expected || !token || token !== validToken) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Продлеваем Supabase-сессию на всех остальных маршрутах.
  const { response: supabaseResponse, user } = await updateSupabaseSession(request);

  const hasLocalePrefix = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (hasLocalePrefix) {
    const segments = pathname.split("/").filter(Boolean); // ["ru", "cabinet", ...]
    const currentLocale = segments[0] as Locale;
    const routeSegment = segments[1];

    if (routeSegment && PROTECTED_SEGMENTS.includes(routeSegment) && !user) {
      const url = request.nextUrl.clone();
      url.pathname = `/${currentLocale}/login`;
      url.searchParams.set("next", pathname);
      const redirectResponse = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
      return redirectResponse;
    }

    return supabaseResponse;
  }

  const locale = detectLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  const redirectResponse = NextResponse.redirect(url);
  supabaseResponse.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
  return redirectResponse;
}

export const config = {
  matcher: ["/((?!_next).*)"],
};
