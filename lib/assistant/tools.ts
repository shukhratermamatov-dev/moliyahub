// Инструменты (function calling) ИИ-помощника MoliyaHub.
//
// Каждый инструмент — тонкая обёртка над кодом, который уже работает на
// сайте: тот же скоринг (lib/finance/ratios.ts), тот же каталог продуктов с
// админскими ставками и реальными предложениями bank.uz, те же проекты
// биржи и курсы ЦБ. Поэтому цифры в ответах помощника совпадают с цифрами
// на страницах, а модель не придумывает ставки и суммы сама.
//
// Декларации — в формате Gemini API (OpenAPI-подмножество, типы в верхнем
// регистре).

import type { Locale } from "@/i18n/config";
import { GET as getCbuRates, type CurrencyRate } from "@/app/api/cbu-rates/route";
import { GET as getCbuRefinancingRate, type RefinancingRate } from "@/app/api/cbu-refinancing-rate/route";
import { OFFERS, type FinancingType } from "@/lib/data/banks";
import { INDUSTRIES, findIndustry } from "@/lib/data/industries";
import { SEED_PROJECTS, mapDbProjectRow, type DbProjectRow, type Project } from "@/lib/data/projects";
import { REGIONS } from "@/lib/data/regions";
import { applyRateOverrides, type RateOverrideMap } from "@/lib/finance/rate-overrides";
import { buildRepaymentSchedule, calculateRatios } from "@/lib/finance/ratios";
import type { MinimalFinanceData } from "@/lib/finance/types";
import { pickList, pickText } from "@/lib/i18n-text";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { searchKnowledge } from "./knowledge";

export type ToolContext = { locale: Locale };

type Json = Record<string, unknown>;

// --- Декларации для модели ---------------------------------------------------

const FINANCE_NUMBER = (description: string) => ({ type: "NUMBER", description });

export const TOOL_DECLARATIONS = [
  {
    name: "search_knowledge",
    description:
      "Поиск по базе знаний MoliyaHub: исламское финансирование (мурабаха, иджара, мушарака, мудараба), советы предпринимателям, FAQ сайта, разделы сайта, консалтинг, команда, отрасли и образцы ТЭО/бизнес-планов, список банков Узбекистана, официальные источники. Вызывай перед ответом на любой вопрос о сайте, его услугах или понятиях.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Ключевые слова запроса (на языке пользователя)." },
      },
      required: ["query"],
    },
  },
  {
    name: "search_financing",
    description:
      "Подбор продуктов финансирования из каталога MoliyaHub (кредиты банков, исламское финансирование, лизинг, венчур, краудфандинг, гранты) с актуальными ставками + свежие предложения по бизнес-кредитам с bank.uz. Используй для любых вопросов «где взять деньги», «какие ставки», «какой кредит подойдёт». Все параметры необязательны.",
    parameters: {
      type: "OBJECT",
      properties: {
        type: {
          type: "STRING",
          enum: ["BANK_LOAN", "ISLAMIC", "LEASING", "VENTURE", "CROWDFUNDING", "GRANT"],
          description: "Тип финансирования.",
        },
        islamic_only: { type: "BOOLEAN", description: "Только продукты без процентов (по нормам шариата)." },
        amount_uzs: { type: "NUMBER", description: "Нужная сумма в сумах (UZS)." },
        term_months: { type: "NUMBER", description: "Желаемый срок в месяцах." },
        purpose: { type: "STRING", description: "Цель: оборудование, оборот, сырьё, недвижимость, IT, экспорт и т.п." },
      },
    },
  },
  {
    name: "calculate_scoring",
    description:
      "Считает финансовые коэффициенты и балл 0–100 по методике MoliyaHub (та же, что на странице «Анализ»). Суммы — в сумах (если пользователь дал в млн — умножь на 1 000 000). Передавай только те цифры, которые назвал пользователь; ничего не додумывай.",
    parameters: {
      type: "OBJECT",
      properties: {
        revenue: FINANCE_NUMBER("Выручка за год."),
        costOfSales: FINANCE_NUMBER("Себестоимость продаж."),
        grossProfit: FINANCE_NUMBER("Валовая прибыль (если не дана — будет выручка минус себестоимость)."),
        operatingProfit: FINANCE_NUMBER("Операционная прибыль."),
        netProfit: FINANCE_NUMBER("Чистая прибыль."),
        interestExpense: FINANCE_NUMBER("Процентные расходы."),
        currentAssets: FINANCE_NUMBER("Оборотные (текущие) активы."),
        inventory: FINANCE_NUMBER("Запасы."),
        cash: FINANCE_NUMBER("Денежные средства."),
        shortTermReceivables: FINANCE_NUMBER("Краткосрочная дебиторская задолженность."),
        totalAssets: FINANCE_NUMBER("Итого активы (валюта баланса)."),
        equity: FINANCE_NUMBER("Собственный капитал."),
        longTermLiabilities: FINANCE_NUMBER("Долгосрочные обязательства."),
        currentLiabilities: FINANCE_NUMBER("Текущие (краткосрочные) обязательства."),
        shortTermLoans: FINANCE_NUMBER("Краткосрочные кредиты."),
      },
    },
  },
  {
    name: "calculate_loan_payment",
    description:
      "Рассчитывает ежемесячный платёж, переплату и первые/последние платежи по кредиту или рассрочке (аннуитет или дифференцированные платежи).",
    parameters: {
      type: "OBJECT",
      properties: {
        principal_uzs: { type: "NUMBER", description: "Сумма кредита в сумах." },
        annual_rate_pct: { type: "NUMBER", description: "Годовая ставка, %." },
        months: { type: "NUMBER", description: "Срок в месяцах." },
        method: { type: "STRING", enum: ["ANNUITY", "DIFFERENTIATED"], description: "Способ погашения, по умолчанию ANNUITY." },
      },
      required: ["principal_uzs", "annual_rate_pct", "months"],
    },
  },
  {
    name: "search_projects",
    description:
      "Поиск проектов на «Бирже проектов» MoliyaHub, которые ищут инвестора. Фильтры необязательны.",
    parameters: {
      type: "OBJECT",
      properties: {
        industry_id: {
          type: "STRING",
          enum: INDUSTRIES.map((i) => i.id),
          description: "Отрасль.",
        },
        region: { type: "STRING", description: "Регион (часть названия, например «Самарканд»)." },
        stage: { type: "STRING", enum: ["IDEA", "MVP", "GROWTH", "SCALE"], description: "Стадия проекта." },
        max_amount_uzs: { type: "NUMBER", description: "Максимальная запрашиваемая сумма, сум." },
      },
    },
  },
  {
    name: "get_cbu_data",
    description: "Текущие курсы валют ЦБ РУз (USD, EUR, RUB, CNY) и основная (ставка рефинансирования) ставка ЦБ.",
    parameters: { type: "OBJECT", properties: {} },
  },
  {
    name: "get_my_latest_analysis",
    description:
      "Последний сохранённый финансовый анализ текущего пользователя из личного кабинета (балл, коэффициенты, краткие выводы). Работает только если пользователь вошёл в аккаунт. Вызывай, когда пользователь спрашивает про «мой анализ», «мой балл», «мою компанию».",
    parameters: { type: "OBJECT", properties: {} },
  },
];

// --- Реализация --------------------------------------------------------------

async function loadRateOverrides(): Promise<RateOverrideMap> {
  try {
    const supabase = createServiceRoleClient();
    const { data } = await supabase.from("financing_rate_overrides").select("offer_id, rate_min, rate_max");
    const map: RateOverrideMap = {};
    for (const row of data ?? []) {
      map[row.offer_id as string] = { rateMin: Number(row.rate_min), rateMax: Number(row.rate_max) };
    }
    return map;
  } catch {
    return {};
  }
}

async function loadBankUzOffers(): Promise<Json[]> {
  try {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("bank_credit_offers")
      .select("bank_name_raw, product_name, rate_min, rate_max, term_years, amount_currency, amount_max, source_url, scraped_at");
    return (data ?? []) as Json[];
  } catch {
    return [];
  }
}

function norm(s: string) {
  return s.toLowerCase().replace(/[ʻʼ‘’`']/g, "'");
}

async function searchFinancing(args: Json, ctx: ToolContext) {
  const { locale } = ctx;
  const type = typeof args.type === "string" ? (args.type as FinancingType) : undefined;
  const islamicOnly = args.islamic_only === true || type === "ISLAMIC";
  const amount = typeof args.amount_uzs === "number" ? args.amount_uzs : undefined;
  const term = typeof args.term_months === "number" ? args.term_months : undefined;
  const purpose = typeof args.purpose === "string" ? norm(args.purpose).slice(0, 5) : undefined;

  const offers = applyRateOverrides(OFFERS, await loadRateOverrides());

  const matched = offers
    .filter((o) => (type ? o.type === type : true))
    .filter((o) => (islamicOnly ? o.islamic : true))
    .filter((o) => (amount !== undefined ? amount >= o.minAmount && amount <= o.maxAmount : true))
    .filter((o) => (term !== undefined ? term >= o.termMin && term <= o.termMax : true))
    .filter((o) =>
      purpose
        ? (["ru", "uz", "en"] as Locale[]).some((l) =>
            [...pickList(o.purpose, l), pickText(o.title, l), pickText(o.note, l)].some((p) => norm(p).includes(purpose)),
          )
        : true,
    )
    .map((o) => ({
      id: o.id,
      provider: pickText(o.bank, locale),
      product: pickText(o.title, locale),
      type: o.type,
      islamic: o.islamic,
      rate_pct: o.rateMin === o.rateMax ? `${o.rateMin}` : `${o.rateMin}–${o.rateMax}`,
      term_months: `${o.termMin}–${o.termMax}`,
      amount_uzs: `${o.minAmount}–${o.maxAmount}`,
      purposes: pickList(o.purpose, locale),
      note: pickText(o.note, locale),
    }));

  // Реальные предложения bank.uz — только обычные бизнес-кредиты с процентом,
  // поэтому для исламских/грантовых/венчурных запросов их не показываем.
  let bankUz: Json[] = [];
  if (!islamicOnly && (!type || type === "BANK_LOAN")) {
    const rows = await loadBankUzOffers();
    bankUz = rows
      .filter((r) => (amount !== undefined && r.amount_currency === "UZS" && r.amount_max !== null ? amount <= Number(r.amount_max) : true))
      .filter((r) => (term !== undefined && r.term_years !== null ? term <= Number(r.term_years) * 12 : true))
      .sort((a, b) => Number(a.rate_min ?? 999) - Number(b.rate_min ?? 999))
      .slice(0, 8)
      .map((r) => ({
        bank: r.bank_name_raw,
        product: r.product_name,
        rate_pct: r.rate_min === r.rate_max || r.rate_max === null ? r.rate_min : `${r.rate_min}–${r.rate_max}`,
        term_years_max: r.term_years,
        amount_max: r.amount_max,
        currency: r.amount_currency,
        source_url: r.source_url,
        updated: typeof r.scraped_at === "string" ? r.scraped_at.slice(0, 10) : null,
      }));
  }

  return {
    catalog_offers: matched,
    bank_uz_offers: bankUz,
    page: `/${locale}/financing`,
    note:
      "Ставки ориентировочные; окончательные условия определяет банк после рассмотрения заявки. Если ничего не подошло под фильтры — предложи ослабить условия или посмотреть весь каталог.",
  };
}

const SCORING_KEYS: (keyof MinimalFinanceData)[] = [
  "currentAssets",
  "inventory",
  "cash",
  "shortTermReceivables",
  "totalAssets",
  "equity",
  "longTermLiabilities",
  "currentLiabilities",
  "shortTermLoans",
  "revenue",
  "costOfSales",
  "grossProfit",
  "operatingProfit",
  "netProfit",
  "interestExpense",
];

// Минимум, без которого балл 0–100 по методике сайта считать нечестно:
// без этих статей часть компонентов скоринга молча выпадает и балл
// получается завышенным/заниженным.
const REQUIRED_FOR_SCORE: (keyof MinimalFinanceData)[] = [
  "revenue",
  "netProfit",
  "currentAssets",
  "currentLiabilities",
  "totalAssets",
  "equity",
];

function round(n: number | null, digits = 2) {
  return n === null ? null : Math.round(n * 10 ** digits) / 10 ** digits;
}

function calculateScoring(args: Json, ctx: ToolContext) {
  const provided = new Set<keyof MinimalFinanceData>();
  const data = {} as MinimalFinanceData;
  for (const key of SCORING_KEYS) {
    const v = args[key];
    if (typeof v === "number" && Number.isFinite(v)) {
      data[key] = v;
      provided.add(key);
    } else {
      data[key] = 0;
    }
  }
  if (!provided.has("grossProfit") && provided.has("revenue") && provided.has("costOfSales")) {
    data.grossProfit = data.revenue - data.costOfSales;
    provided.add("grossProfit");
  }

  const r = calculateRatios(data);
  // Коэффициент показываем, только если все его составляющие реально даны.
  const need = (...keys: (keyof MinimalFinanceData)[]) => keys.every((k) => provided.has(k));
  const ratios: Json = {};
  if (need("currentAssets", "currentLiabilities")) {
    ratios.current_ratio = round(r.currentRatio);
    ratios.working_capital_uzs = r.workingCapital;
  }
  if (need("currentAssets", "inventory", "currentLiabilities")) ratios.quick_ratio = round(r.quickRatio);
  if (need("cash", "currentLiabilities")) ratios.absolute_liquidity = round(r.absoluteLiquidity);
  if (need("netProfit", "totalAssets")) ratios.roa_pct = round((r.roa ?? 0) * 100, 1);
  if (need("netProfit", "equity")) ratios.roe_pct = round((r.roe ?? 0) * 100, 1);
  if (need("netProfit", "revenue")) ratios.net_margin_pct = round((r.ros ?? 0) * 100, 1);
  if (need("grossProfit", "revenue")) ratios.gross_margin_pct = round((r.grossMargin ?? 0) * 100, 1);
  if (need("operatingProfit", "revenue")) ratios.operating_margin_pct = round((r.operatingMargin ?? 0) * 100, 1);
  if (need("equity", "totalAssets")) ratios.autonomy_ratio = round(r.autonomyRatio);
  if (need("totalAssets", "currentLiabilities", "longTermLiabilities")) ratios.debt_ratio = round(r.debtRatio);
  if (need("revenue", "totalAssets")) ratios.asset_turnover = round(r.assetTurnover);
  if (need("costOfSales", "inventory")) ratios.inventory_turnover = round(r.inventoryTurnover);
  if (need("operatingProfit", "interestExpense")) ratios.interest_coverage = round(r.interestCoverage);

  const missing = REQUIRED_FOR_SCORE.filter((k) => !provided.has(k));
  const norms = {
    current_ratio: "норма ≥ 1,5 (хорошо ≥ 2)",
    quick_ratio: "норма ≥ 0,7 (хорошо ≥ 1)",
    absolute_liquidity: "норма ≥ 0,2",
    roa_pct: "хорошо ≥ 8%",
    roe_pct: "хорошо ≥ 12%",
    net_margin_pct: "хорошо ≥ 5–10%",
    autonomy_ratio: "норма ≥ 0,4–0,5",
    debt_ratio: "норма ≤ 0,6 (хорошо ≤ 0,4)",
    asset_turnover: "хорошо ≥ 1",
    inventory_turnover: "хорошо ≥ 4",
  };

  return {
    ratios,
    norms,
    score:
      missing.length === 0
        ? { total: r.score, of: 100, components: r.scoreDetails, weights: "ликвидность 25%, рентабельность 30%, устойчивость 25%, эффективность 20%" }
        : null,
    missing_for_score: missing,
    full_analysis_page: `/${ctx.locale}/analyze`,
    note:
      missing.length === 0
        ? "Балл посчитан по той же методике, что и на странице «Анализ». Полный анализ по развёрнутой форме баланса и ОПУ с ИИ-рекомендациями — на странице анализа."
        : "Для балла 0–100 не хватает статей из missing_for_score — попроси их у пользователя или предложи полный анализ на сайте. Не называй балл сам.",
  };
}

function calculateLoanPayment(args: Json) {
  const principal = Number(args.principal_uzs);
  const rate = Number(args.annual_rate_pct);
  const months = Math.round(Number(args.months));
  const method = args.method === "DIFFERENTIATED" ? "DIFFERENTIATED" : "ANNUITY";
  if (!(principal > 0) || !(rate >= 0) || !(months > 0) || months > 600) {
    return { error: "Нужны положительные сумма, ставка и срок (до 600 месяцев)." };
  }
  const schedule = buildRepaymentSchedule(principal, rate, months, method);
  const total = schedule.reduce((s, row) => s + row.payment, 0);
  const r0 = (n: number) => Math.round(n);
  return {
    method,
    first_payment_uzs: r0(schedule[0].payment),
    last_payment_uzs: r0(schedule[schedule.length - 1].payment),
    total_paid_uzs: r0(total),
    overpayment_uzs: r0(total - principal),
    overpayment_pct_of_principal: Math.round(((total - principal) / principal) * 1000) / 10,
    first_months: schedule.slice(0, 3).map((row) => ({
      month: row.month,
      payment: r0(row.payment),
      principal: r0(row.principalPart),
      interest: r0(row.interestPart),
    })),
    note: "Расчёт без комиссий, страховок и льготного периода. Калькулятор также есть на странице «Финансирование».",
  };
}

async function searchProjects(args: Json, ctx: ToolContext) {
  const { locale } = ctx;
  let dbProjects: Project[] = [];
  try {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("projects")
      .select("id, name, owner_name, industry_id, sub_industry_id, sub_industry_other, stage, amount, region, description, attached_score, created_at")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(100);
    dbProjects = ((data as DbProjectRow[]) ?? []).map(mapDbProjectRow);
  } catch {
    // нет доступа к БД — остаются демо-проекты
  }

  const industryId = typeof args.industry_id === "string" ? args.industry_id : undefined;
  const region = typeof args.region === "string" ? norm(args.region).slice(0, 5) : undefined;
  const stage = typeof args.stage === "string" ? args.stage : undefined;
  const maxAmount = typeof args.max_amount_uzs === "number" ? args.max_amount_uzs : undefined;

  const all = [...dbProjects, ...SEED_PROJECTS];
  const found = all
    .filter((p) => (industryId ? p.industryId === industryId : true))
    .filter((p) => (region ? (["ru", "uz", "en"] as Locale[]).some((l) => norm(pickText(p.region, l)).includes(region)) : true))
    .filter((p) => (stage ? p.stage === stage : true))
    .filter((p) => (maxAmount !== undefined ? p.amount <= maxAmount : true))
    .slice(0, 8)
    .map((p) => ({
      title: pickText(p.title, locale),
      industry: findIndustry(p.industryId) ? pickText(findIndustry(p.industryId)!.name, locale) : p.industryId,
      region: pickText(p.region, locale),
      stage: p.stage,
      amount_uzs: p.amount,
      description: pickText(p.description, locale).slice(0, 300),
      attached_score: p.attachedScore ?? null,
      url: `/${locale}/projects/${p.id}`,
    }));

  return {
    projects: found,
    total_found: found.length,
    regions_hint: REGIONS.map((r) => pickText(r.name, locale)),
    publish_page: `/${locale}/projects/new`,
  };
}

async function getCbuData() {
  const [ratesRes, refiRes] = await Promise.all([getCbuRates(), getCbuRefinancingRate()]);
  const rates = (await ratesRes.json()) as CurrencyRate[];
  const refinancing = (await refiRes.json()) as RefinancingRate | null;
  return {
    currency_rates_uzs: rates,
    refinancing_rate: refinancing,
    source: "cbu.uz",
    note: rates.length === 0 && !refinancing ? "Сайт ЦБ сейчас не ответил — предложи посмотреть на cbu.uz." : undefined,
  };
}

async function getMyLatestAnalysis(ctx: ToolContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { logged_in: false, note: `Пользователь не вошёл. Предложи войти (/${ctx.locale}/login) или пройти анализ (/${ctx.locale}/analyze).` };
    }
    // RLS отдаёт только строки текущего пользователя.
    const { data } = await supabase
      .from("analyses")
      .select("industry, region, ratios, advice, created_at")
      .order("created_at", { ascending: false })
      .limit(1);
    const row = data?.[0] as { industry?: string; region?: string; ratios?: Json; advice?: Json; created_at?: string } | undefined;
    if (!row) return { logged_in: true, analysis: null, note: `Сохранённых анализов нет — предложи /${ctx.locale}/analyze.` };
    const advice = (row.advice ?? {}) as Json;
    return {
      logged_in: true,
      analysis: {
        date: row.created_at?.slice(0, 10),
        industry: row.industry,
        region: row.region,
        ratios: row.ratios,
        summary: advice.summary,
        red_flags: advice.red_flags,
        recommendations: advice.recommendations,
      },
      cabinet_page: `/${ctx.locale}/cabinet`,
    };
  } catch {
    return { error: "Не удалось получить данные кабинета." };
  }
}

export async function runTool(name: string, args: Json, ctx: ToolContext): Promise<Json> {
  switch (name) {
    case "search_knowledge": {
      const query = typeof args.query === "string" ? args.query : "";
      const docs = searchKnowledge(query, ctx.locale);
      return {
        results: docs.map((d) => ({ title: d.title, text: d.text, url: d.path !== undefined ? `/${ctx.locale}${d.path}` : undefined })),
        note: docs.length === 0 ? "В базе знаний ничего не найдено — не выдумывай, скажи честно и предложи связаться с командой." : undefined,
      };
    }
    case "search_financing":
      return searchFinancing(args, ctx);
    case "calculate_scoring":
      return calculateScoring(args, ctx);
    case "calculate_loan_payment":
      return calculateLoanPayment(args);
    case "search_projects":
      return searchProjects(args, ctx);
    case "get_cbu_data":
      return getCbuData();
    case "get_my_latest_analysis":
      return getMyLatestAnalysis(ctx);
    default:
      return { error: `Неизвестный инструмент: ${name}` };
  }
}
