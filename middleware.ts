import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, locales, type Locale } from "@/i18n/config";
import { ADMIN_SESSION_COOKIE, computeAdminToken } from "@/lib/admin-auth";

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Админка живёт вне [locale] — всегда на /admin, без языкового префикса.
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

  const hasLocalePrefix = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocalePrefix) {
    return NextResponse.next();
  }

  const locale = detectLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|favicon.svg|og.jpg).*)"],
};
