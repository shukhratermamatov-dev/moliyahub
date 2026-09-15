import { NextResponse } from "next/server";
import { scrapeBankUzCorpCredits } from "@/lib/scrapers/bank-uz";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Раз в сутки (см. vercel.json) обходит bank.uz/corp-credits и кладёт
// разобранные предложения в Supabase (bank_credit_offers). Полный обход
// занимает ~60-90 сек (пауза 3.2с между страницами, уважая Crawl-delay
// из robots.txt bank.uz) — с запасом от лимита в 300 сек на Hobby-плане
// Vercel (Fluid compute).
export const maxDuration = 280;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const offers = await scrapeBankUzCorpCredits();

  // ?dry=1 — прогнать скрейпер и разбор, но не писать в базу. Нужно, чтобы
  // проверить качество парсинга (в частности сопоставление банков) на
  // реальных данных, не трогая прод-таблицу.
  const isDryRun = new URL(request.url).searchParams.get("dry") === "1";
  if (isDryRun) {
    const unmatchedNames = Array.from(
      new Set(offers.filter((o) => o.bankId === null).map((o) => o.bankNameRaw)),
    );
    return NextResponse.json({
      count: offers.length,
      matched: offers.filter((o) => o.bankId !== null).length,
      unmatchedBankNames: unmatchedNames,
      sample: offers.slice(0, 10),
    });
  }

  if (offers.length === 0) {
    // Ничего не разобрали — не трогаем существующие данные в таблице,
    // лучше показать вчерашние ставки, чем очистить таблицу в ноль из-за
    // временного сбоя bank.uz или смены разметки.
    return NextResponse.json({ error: "no_offers_scraped" }, { status: 502 });
  }

  const runId = new Date().toISOString();
  const supabase = createServiceRoleClient();

  const rows = offers.map((o) => ({
    bank_name_raw: o.bankNameRaw,
    bank_id: o.bankId,
    product_name: o.productName,
    rate_min: o.rateMin,
    rate_max: o.rateMax,
    term_years: o.termYears,
    amount_currency: o.amountCurrency,
    amount_max: o.amountMax,
    delivery: o.delivery,
    source_url: o.sourceUrl,
    run_id: runId,
  }));

  const CHUNK_SIZE = 100;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from("bank_credit_offers").insert(chunk);
    if (error) {
      return NextResponse.json({ error: "insert_failed", details: error.message }, { status: 500 });
    }
  }

  // Новый прогон уже вставлен — теперь можно безопасно убрать строки
  // предыдущего прогона, на сайте не будет пустого промежутка.
  const { error: deleteError } = await supabase
    .from("bank_credit_offers")
    .delete()
    .neq("run_id", runId);

  if (deleteError) {
    return NextResponse.json(
      { warning: "cleanup_failed", inserted: rows.length, details: deleteError.message },
      { status: 200 },
    );
  }

  return NextResponse.json({ inserted: rows.length, runId });
}
