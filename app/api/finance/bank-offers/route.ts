import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Публичный эндпоинт: отдаёт последний прогон реальных предложений по
// бизнес-кредитам с bank.uz (см. lib/scrapers/bank-uz.ts,
// app/api/cron/bank-offers/route.ts — обновляется раз в сутки). Читаем
// сервисным ключом, как и /api/finance/rate-overrides — таблица публично
// доступна на чтение через RLS, сервисный ключ здесь просто избавляет от
// лишнего анонимного клиента.
export const revalidate = 3600;

export type BankOfferDto = {
  bankNameRaw: string;
  bankId: string | null;
  productName: string;
  rateMin: number | null;
  rateMax: number | null;
  termYears: number | null;
  amountCurrency: "UZS" | "USD" | null;
  amountMax: number | null;
  delivery: string[];
  sourceUrl: string;
  scrapedAt: string;
};

export async function GET() {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("bank_credit_offers")
      .select(
        "bank_name_raw, bank_id, product_name, rate_min, rate_max, term_years, amount_currency, amount_max, delivery, source_url, scraped_at",
      );

    if (error || !data) {
      return NextResponse.json([], { status: 200 });
    }

    const offers: BankOfferDto[] = data.map((row) => ({
      bankNameRaw: row.bank_name_raw as string,
      bankId: (row.bank_id as string | null) ?? null,
      productName: row.product_name as string,
      rateMin: row.rate_min === null ? null : Number(row.rate_min),
      rateMax: row.rate_max === null ? null : Number(row.rate_max),
      termYears: row.term_years === null ? null : Number(row.term_years),
      amountCurrency: (row.amount_currency as "UZS" | "USD" | null) ?? null,
      amountMax: row.amount_max === null ? null : Number(row.amount_max),
      delivery: Array.isArray(row.delivery) ? (row.delivery as string[]) : [],
      sourceUrl: row.source_url as string,
      scrapedAt: row.scraped_at as string,
    }));

    return NextResponse.json(offers, {
      headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=1800" },
    });
  } catch {
    // Таблица ещё не создана, cron ещё ни разу не отработал, или сервис
    // недоступен — молча отдаём пустой список, страница «Финансирование»
    // просто покажет старый статичный каталог без реальных ставок bank.uz.
    return NextResponse.json([], { status: 200 });
  }
}
