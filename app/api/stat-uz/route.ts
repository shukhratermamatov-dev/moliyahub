import { NextResponse } from "next/server";

// Данные Госкомстата Узбекистана (stat.uz) — публичные JSON-выгрузки по
// «Демографии предприятий и организаций». URL стабильны (номер набора данных
// не меняется), а сам JSON-файл стат.уз перезаписывает на месте при выходе
// новых данных — поэтому просто перечитываем его по расписанию revalidate,
// без какого-либо ручного импорта.
const BASE = "https://api.siat.stat.uz/media/uploads/sdmx/sdmx_data_";

const DATASETS = [
  { key: "operating", id: "256" },
  { key: "registered", id: "257" },
  { key: "newlyCreated", id: "259" },
  { key: "smallBusinessOperating", id: "261" },
] as const;

export type StatUzIndicatorKey = (typeof DATASETS)[number]["key"];

export type StatUzRegion = {
  code: string;
  name: { ru: string; en: string; uz: string };
  values: number[];
};

export type StatUzIndicator = {
  key: StatUzIndicatorKey;
  years: number[];
  republic: number[];
  regions: StatUzRegion[];
};

type StatUzRow = Record<string, unknown> & {
  Code?: string | number;
  Klassifikator_ru?: string;
  Klassifikator_en?: string;
  Klassifikator_uzc?: string;
};

// Обновляем раз в сутки — наборы данных на стат.уз помечены как «ежегодные»,
// чаще проверять смысла нет, а сутки достаточно, чтобы новые цифры появились
// на сайте быстро после публикации.
export const revalidate = 86400;

// Сколько последних лет показываем на сайте.
const YEARS_WINDOW = 5;

function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

async function fetchIndicator(
  key: StatUzIndicatorKey,
  id: string,
): Promise<StatUzIndicator | null> {
  try {
    const res = await fetch(`${BASE}${id}.json`, { next: { revalidate } });
    if (!res.ok) {
      throw new Error(`stat.uz responded ${res.status}`);
    }
    const json = (await res.json()) as { data?: StatUzRow[] };
    const rows = Array.isArray(json.data) ? json.data : [];

    // Регионы верхнего уровня (Республика, области, г. Ташкент,
    // Каракалпакстан) кодируются 4-значным Code; районы и города внутри
    // области — более длинным кодом. Различаем по длине, а не по конкретным
    // значениям кодов — так фильтр не сломается, если стат.уз перенумерует.
    const topLevel = rows.filter((row) => String(row.Code ?? "").trim().length === 4);

    let republicRow: StatUzRow | undefined;
    const regionRows: StatUzRow[] = [];

    for (const row of topLevel) {
      const name = String(row.Klassifikator_ru ?? "").trim();
      if (!name) continue;
      if (/республика узбекистан/i.test(name)) {
        republicRow = row;
      } else {
        // Всё остальное верхнего уровня — области, г. Ташкент и Республика
        // Каракалпакстан — показываем как отдельные регионы (без суммирования),
        // как на приложенном пользователем примере диаграмм.
        regionRows.push(row);
      }
    }

    if (!republicRow) return null;

    const years = Object.keys(republicRow)
      .filter((k) => /^\d{4}$/.test(k))
      .map(Number)
      .sort((a, b) => a - b)
      .slice(-YEARS_WINDOW);

    if (years.length === 0) return null;

    const seriesFor = (row: StatUzRow | undefined) =>
      years.map((year) => toNumber(row?.[String(year)]));

    const regions: StatUzRegion[] = regionRows.map((row) => {
      const ru = String(row.Klassifikator_ru ?? "").trim();
      return {
        code: String(row.Code ?? ""),
        name: {
          ru,
          en: String(row.Klassifikator_en ?? "").trim() || ru,
          uz: String(row.Klassifikator_uzc ?? "").trim() || ru,
        },
        values: seriesFor(row),
      };
    });

    return {
      key,
      years,
      republic: seriesFor(republicRow),
      regions,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const results = await Promise.all(
    DATASETS.map((dataset) => fetchIndicator(dataset.key, dataset.id)),
  );
  const indicators = results.filter((r): r is StatUzIndicator => r !== null);

  return NextResponse.json(indicators, {
    headers: {
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=21600",
    },
  });
}
