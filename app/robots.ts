import type { MetadataRoute } from "next";

const BASE_URL = "https://www.moliyahub.uz";

// Стандартный Next.js App Router способ отдать /robots.txt — без ручного
// файла в public/. Кабинет (требует входа) и админка закрыты от индексации,
// остальное открыто.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/*/cabinet", "/*/login", "/*/update-password"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
