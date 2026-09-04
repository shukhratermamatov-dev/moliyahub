import { formatMoney, formatPct, formatRatio } from "../utils";
import type { AiAdvice, FinancialRatios, MinimalFinanceData, Recommendation, RedFlag } from "./types";

export function buildRuleAdvice(data: MinimalFinanceData, ratios: FinancialRatios): AiAdvice {
  const red_flags: RedFlag[] = [];
  const strengths: string[] = [];
  const recommendations: Recommendation[] = [];

  if (ratios.currentRatio !== null && ratios.currentRatio < 1) {
    red_flags.push({
      indicator: "Текущая ликвидность",
      value: formatRatio(ratios.currentRatio),
      why_critical:
        "Текущих активов не хватает, чтобы покрыть краткосрочные долги. Есть риск кассовых разрывов.",
      priority: 1,
    });
    recommendations.push({
      title: "Укрепить оборотный капитал",
      description:
        "Соберите дебиторку быстрее, сократите запасы неликвида и перенесите часть краткосрочных кредитов на длинный срок.",
      expected_effect: "Текущая ликвидность выше 1,2",
      priority: 1,
      difficulty: "medium",
      timeframe: "1–3 месяца",
    });
  } else if (ratios.currentRatio !== null && ratios.currentRatio >= 1.5) {
    strengths.push("Запас ликвидности достаточный — краткосрочные обязательства покрываются активами.");
  }

  if (data.netProfit < 0) {
    red_flags.push({
      indicator: "Чистая прибыль",
      value: formatMoney(data.netProfit),
      why_critical: "Компания убыточна. Без разворота это быстро съест капитал.",
      priority: 1,
    });
    recommendations.push({
      title: "Разобрать убыток по статьям",
      description:
        "Отделите переменные и постоянные расходы. Поднимите цены на низкомаржинальные позиции и заморозьте необязательные затраты.",
      expected_effect: "Выход в операционную прибыль",
      priority: 1,
      difficulty: "high",
      timeframe: "1–3 месяца",
    });
  }

  if (ratios.autonomyRatio !== null && ratios.autonomyRatio < 0.3) {
    red_flags.push({
      indicator: "Автономия",
      value: formatPct(ratios.autonomyRatio),
      why_critical: "Бизнес сильно зависит от заёмных средств. Банки и инвесторы это заметят.",
      priority: 2,
    });
    recommendations.push({
      title: "Снизить долговую нагрузку",
      description:
        "Не берите новый оборотный кредит, пока не вырастет собственный капитал. Рассмотрите долю инвестора вместо долга.",
      expected_effect: "Коэффициент автономии выше 40%",
      priority: 2,
      difficulty: "high",
      timeframe: "3–6 месяцев",
    });
  } else if (ratios.autonomyRatio !== null && ratios.autonomyRatio >= 0.5) {
    strengths.push("Высокая финансовая независимость — собственный капитал доминирует в пассивах.");
  }

  if (ratios.absoluteLiquidity !== null && ratios.absoluteLiquidity < 0.1) {
    red_flags.push({
      indicator: "Абсолютная ликвидность",
      value: formatRatio(ratios.absoluteLiquidity),
      why_critical: "Денег на счетах почти нет. Любая задержка оплаты от клиентов бьёт по платежам.",
      priority: 2,
    });
  }

  if (ratios.inventoryTurnover !== null && ratios.inventoryTurnover < 2 && data.inventory > 0) {
    red_flags.push({
      indicator: "Оборачиваемость запасов",
      value: formatRatio(ratios.inventoryTurnover, 1),
      why_critical: "Запасы залеживаются. Деньги заморожены на складе.",
      priority: 3,
    });
    recommendations.push({
      title: "Расчистить склад",
      description:
        "Проведите инвентаризацию, распродайте неликвид со скидкой и перейдите на закупки под заказ, где возможно.",
      expected_effect: "Высвобождение денежных средств",
      priority: 3,
      difficulty: "medium",
      timeframe: "1–3 месяца",
    });
  }

  if (data.operatingProfit > 0 && ratios.ros !== null && ratios.ros >= 0.08) {
    strengths.push("Рентабельность продаж на здоровом уровне для МСБ.");
  }

  if (ratios.workingCapital > 0) {
    strengths.push("Чистый оборотный капитал положительный.");
  }

  if (recommendations.length === 0) {
    recommendations.push({
      title: "Зафиксировать финансовую дисциплину",
      description:
        "Ведите ежемесячный отчёт кассовых разрывов и сравнивайте коэффициенты с предыдущим периодом.",
      expected_effect: "Управляемость и раннее обнаружение проблем",
      priority: 3,
      difficulty: "low",
      timeframe: "1 месяц",
    });
  }

  let financing_advice =
    "Сначала закройте кассовые разрывы и убыток, затем рассматривайте кредит.";
  if (ratios.score >= 70 && data.netProfit > 0) {
    financing_advice =
      "Финансовое состояние позволяет привлекать банковский кредит или инвестора. Сравнивайте ставку с рентабельностью проекта: если доходность выше стоимости денег — имеет смысл масштабироваться.";
  } else if (ratios.score >= 45) {
    financing_advice =
      "Классический кредит возможен, но банки запросят залог и обороты. Параллельно покажите проект инвесторам и рассмотрите исламское финансирование / лизинг оборудования.";
  } else {
    financing_advice =
      "Сейчас новый долг опасен. Сначала поправьте ликвидность и прибыль. Для роста лучше искать инвестора в капитал или грант, а не кредит.";
  }

  const tone =
    ratios.score >= 70 ? "устойчивое" : ratios.score >= 45 ? "среднее, с зонами риска" : "напряжённое";

  return {
    summary: `Финансовое здоровье компании — ${tone} (балл ${ratios.score} из 100). ${
      data.netProfit >= 0
        ? `Чистая прибыль ${formatMoney(data.netProfit)} при выручке ${formatMoney(data.revenue)}.`
        : `Убыток ${formatMoney(data.netProfit)} требует первоочередного внимания.`
    } Автономия ${formatPct(ratios.autonomyRatio)}, текущая ликвидность ${formatRatio(ratios.currentRatio)}.`,
    score_comment: `Балл ${ratios.score}/100 собран из ликвидности (${ratios.scoreDetails.liquidity}), рентабельности (${ratios.scoreDetails.profitability}), устойчивости (${ratios.scoreDetails.stability}) и эффективности (${ratios.scoreDetails.efficiency}).`,
    red_flags: red_flags.sort((a, b) => a.priority - b.priority),
    strengths,
    recommendations: recommendations.sort((a, b) => a.priority - b.priority),
    financing_advice,
    source: "rules",
  };
}
