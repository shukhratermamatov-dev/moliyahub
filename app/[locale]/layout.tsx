import type { Viewport } from "next";
import { Unbounded, Golos_Text } from "next/font/google";
import { notFound } from "next/navigation";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { I18nProvider } from "@/i18n/provider";
import "../globals.css";

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
  variable: "--font-unbounded",
  display: "swap",
});

const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-golos",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#081018",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  // Только для метаданных (title/description) — это плоские строки, их можно
  // спокойно возвращать из серверного компонента, они не пересекают границу
  // сервер→клиент как React-проп.
  const dict = await getDictionary(locale);
  return {
    metadataBase: new URL("https://www.moliyahub.uz"),
    title: dict.meta.title,
    description: dict.meta.description,
    icons: {
      icon: "/favicon.svg",
    },
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
      images: ["/og.jpg"],
      url: `/${locale}`,
      locale,
      siteName: "MoliyaHub",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }
  const locale: Locale = rawLocale;

  return (
    <html
      lang={locale}
      className={`${unbounded.variable} ${golos.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
