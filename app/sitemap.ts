import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";

const BASE_URL = "https://www.moliyahub.uz";

// Публичные страницы (без входа) — держим список синхронизированным вручную
// с app/[locale]/*/page.tsx. Не включаем: cabinet (за логином), login,
// update-password (служебные, не для поиска).
const ROUTES = [
  "",
  "about",
  "advice",
  "analyze",
  "business-plan-ai",
  "business-plans",
  "consulting",
  "financing",
  "islamic-finance",
  "news",
  "partners",
  "projects",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const route of ROUTES) {
    for (const locale of locales) {
      const path = route ? `/${locale}/${route}` : `/${locale}`;
      entries.push({
        url: `${BASE_URL}${path}`,
        lastModified: new Date(),
        changeFrequency: route === "" ? "daily" : "weekly",
        priority: route === "" ? 1 : 0.7,
      });
    }
  }

  return entries;
}
