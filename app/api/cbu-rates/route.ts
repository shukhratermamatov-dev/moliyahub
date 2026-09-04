import { NextResponse } from "next/server";

// Курсы валют ЦБ РУз — публичный JSON-эндпоинт для веб-мастеров:
// https://cbu.uz/uz/arkhiv-kursov-valyut/veb-masteram/
const CBU_URL = "https://cbu.uz/en/arkhiv-kursov-valyut/json/";
const WANTED = ["USD", "EUR", "RUB", "CNY"] as const;

type CbuEntry = {
  Ccy: string;
  Rate: string;
  Diff: string;
  Date: string;
};

export type CurrencyRate = {
  code: string;
  rate: number;
  diff: number;
  date: string;
};

// Обновляем раз в час — курсы ЦБ публикуются раз в сутки, чаще не нужно.
export const revalidate = 3600;

export async function GET() {
  try {
    const res = await fetch(CBU_URL, { next: { revalidate } });
    if (!res.ok) {
      throw new Error(`CBU responded with ${res.status}`);
    }
    const data = (await res.json()) as CbuEntry[];

    const rates: CurrencyRate[] = WANTED.map((code): CurrencyRate | null => {
      const entry = data.find((d) => d.Ccy === code);
      if (!entry) return null;
      return {
        code: code as string,
        rate: Number(entry.Rate),
        diff: Number(entry.Diff),
        date: entry.Date,
      };
    }).filter((r): r is CurrencyRate => r !== null);

    return NextResponse.json(rates, {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=600",
      },
    });
  } catch {
    // ЦБ недоступен или сменил формат — отдаём пустой список,
    // виджет на клиенте просто не покажется, не роняя страницу.
    return NextResponse.json([], { status: 200 });
  }
}
