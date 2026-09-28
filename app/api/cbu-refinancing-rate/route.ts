import { NextResponse } from "next/server";

// Основная (рефинансирования) ставка ЦБ РУз — в отличие от курсов валют
// (cbu-rates/route.ts), у неё нет отдельного JSON-фида: официальный сайт
// показывает её только текстом на главной странице ("Основная ставка 14%
// с 16.09.2026"), а историю — файлом Excel. Поэтому аккуратно вытаскиваем
// значение регуляркой из HTML главной страницы; если формат страницы
// поменяется и текст не найдётся — отдаём null, виджет на клиенте просто
// не покажет этот показатель (см. обсуждение источника данных в ТЗ на
// редизайн — ничего не выдумываем).
const CBU_HOME_URL = "https://cbu.uz/ru/";

export type RefinancingRate = {
  rate: number;
  effectiveDate: string; // ISO-строка (YYYY-MM-DD)
};

// Меняется только по решениям Правления ЦБ (раз в несколько недель) —
// незачем скрести главную страницу чаще пары раз в день.
export const revalidate = 21600;

function parseDdMmYyyy(input: string): string | null {
  const m = input.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

export async function GET() {
  try {
    const res = await fetch(CBU_HOME_URL, {
      next: { revalidate },
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MoliyaHubBot/1.0)" },
    });
    if (!res.ok) throw new Error(`CBU responded with ${res.status}`);
    const html = await res.text();
    const text = html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ");

    const match = text.match(
      /[Оо]сновн\w*\s+ставк\w*[^%\d]{0,80}?(\d{1,2}(?:[.,]\d+)?)\s*%[^\d]{0,40}?(\d{2}\.\d{2}\.\d{4})/,
    );
    if (!match) return NextResponse.json(null, { status: 200 });

    const rate = Number(match[1].replace(",", "."));
    const effectiveDate = parseDdMmYyyy(match[2]);
    if (!Number.isFinite(rate) || !effectiveDate) return NextResponse.json(null, { status: 200 });

    const payload: RefinancingRate = { rate, effectiveDate };
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, max-age=21600, stale-while-revalidate=3600" },
    });
  } catch {
    return NextResponse.json(null, { status: 200 });
  }
}
