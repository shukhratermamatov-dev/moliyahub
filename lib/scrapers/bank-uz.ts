import * as cheerio from "cheerio";
import { matchBankId } from "@/lib/data/bank-name-match";

// Скрейпер bank.uz/corp-credits — публичного агрегатора предложений по
// бизнес-кредитам (265 предложений от 31 банка на момент проверки,
// сервер-рендерится, robots.txt разрешает обход с Crawl-delay: 3 —
// проверено вживую в этой сессии). Разметка и селекторы ниже сверены с
// реальным HTML страницы (не угаданы) — карточка предложения это
// `.table-card-offers-bottom`, внутри неё блоки block1 (банк/продукт),
// block2 (ставка), block3 (срок), block4 (сумма), block5 (способ + ссылка).

const BASE_URL = "https://bank.uz";
const LIST_PATH = "/corp-credits";
const PAGE_PARAM = "PAGEN_3";
const MAX_PAGES = 40;
const DELAY_MS = 3200; // уважаем Crawl-delay: 3 из robots.txt (с запасом)
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

export type ScrapedBankOffer = {
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
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRate(raw: string): { rateMin: number | null; rateMax: number | null } {
  const text = raw.trim();
  if (!text) return { rateMin: null, rateMax: null };

  const range = text.match(/от\s*([\d.]+)\s*-\s*до\s*([\d.]+)\s*%/i);
  if (range) {
    const min = Number(range[1]);
    const max = Number(range[2]);
    return {
      rateMin: Number.isFinite(min) ? min : null,
      rateMax: Number.isFinite(max) ? max : null,
    };
  }

  const single = text.match(/^([\d.]+)\s*%$/);
  if (single) {
    const value = Number(single[1]);
    return Number.isFinite(value) ? { rateMin: value, rateMax: value } : { rateMin: null, rateMax: null };
  }

  return { rateMin: null, rateMax: null };
}

function parseTermYears(raw: string): number | null {
  const text = raw.trim();
  if (!text) return null;

  const years = text.match(/(\d+)\s*(лет|года|год)/i);
  if (years) {
    const value = Number(years[1]);
    return Number.isFinite(value) ? value : null;
  }

  const months = text.match(/(\d+)\s*мес/i);
  if (months) {
    const value = Number(months[1]);
    return Number.isFinite(value) ? value / 12 : null;
  }

  return null;
}

function parseAmount(raw: string): { amountCurrency: "UZS" | "USD" | null; amountMax: number | null } {
  const text = raw.trim();
  if (!text || /не указан/i.test(text)) return { amountCurrency: null, amountMax: null };

  const match = text.match(/до\s*([\d\s]+)\s*(сум|доллар|usd|\$)/i);
  if (!match) return { amountCurrency: null, amountMax: null };

  const digits = match[1].replace(/\s+/g, "");
  const value = Number(digits);
  if (!Number.isFinite(value)) return { amountCurrency: null, amountMax: null };

  const isUsd = /доллар|usd|\$/i.test(match[2]);
  return { amountCurrency: isUsd ? "USD" : "UZS", amountMax: value };
}

function pageUrl(page: number): string {
  if (page <= 1) return `${BASE_URL}${LIST_PATH}`;
  return `${BASE_URL}${LIST_PATH}?${PAGE_PARAM}=${page}`;
}

async function fetchPage(page: number): Promise<string | null> {
  try {
    const res = await fetch(pageUrl(page), {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function parseOffersFromHtml(html: string): ScrapedBankOffer[] {
  const $ = cheerio.load(html);
  const offers: ScrapedBankOffer[] = [];

  $(".table-card-offers-bottom").each((_, el) => {
    const card = $(el);

    const link = card.find(".table-card-offers-block1-text a").first();
    const onclick = link.attr("onclick") ?? "";
    // gAnalytica.elementFree('<категория>','<Банк>','<Продукт>') — чистые
    // строки без пробельного мусора, надёжнее видимого текста.
    const onclickMatch = onclick.match(/elementFree\('[^']*','([^']*)','([^']*)'\)/);

    const bankNameRaw = (
      onclickMatch?.[1] || card.find(".table-card-offers-block1-text .medium-text").first().text()
    ).trim();
    const productName = (onclickMatch?.[2] || link.text()).trim();

    if (!bankNameRaw || !productName) return; // не похоже на настоящую карточку — пропускаем

    const href = link.attr("href") ?? "";
    const sourceUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;

    const rateText = card.find(".table-card-offers-block2 .medium-text").first().text();
    const termText = card.find(".table-card-offers-block3 .medium-text").first().text();
    const amountText = card.find(".table-card-offers-block4 .medium-text").first().text();
    const delivery = card
      .find(".table-card-offers-block5 .o_icon")
      .map((__, iconEl) => $(iconEl).attr("title") ?? "")
      .get()
      .filter(Boolean);

    const { rateMin, rateMax } = parseRate(rateText);
    const { amountCurrency, amountMax } = parseAmount(amountText);

    offers.push({
      bankNameRaw,
      bankId: matchBankId(bankNameRaw),
      productName,
      rateMin,
      rateMax,
      termYears: parseTermYears(termText),
      amountCurrency,
      amountMax,
      delivery,
      sourceUrl,
    });
  });

  return offers;
}

export async function scrapeBankUzCorpCredits(): Promise<ScrapedBankOffer[]> {
  const all: ScrapedBankOffer[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    if (page > 1) await sleep(DELAY_MS);

    const html = await fetchPage(page);
    if (!html) break; // страница не отдалась — останавливаемся, не гоняем зря

    const offers = parseOffersFromHtml(html);
    if (offers.length === 0) break; // дошли до конца пагинации

    all.push(...offers);
  }

  return all;
}
