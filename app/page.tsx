import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Landmark,
  LineChart,
  Sparkles,
  Users,
} from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: BarChart3,
    title: "Финансовый анализ",
    text: "Введите баланс и ОПУ — получите коэффициенты, скоринг 0–100 и сравнение слабых мест.",
  },
  {
    icon: Sparkles,
    title: "ИИ-рекомендации",
    text: "Конкретные действия: что чинить в первую очередь, за какой срок и какой эффект ждать.",
  },
  {
    icon: Landmark,
    title: "Финансирование",
    text: "Кредиты банков Узбекистана, исламское финансирование, лизинг, венчур и гранты — в одном каталоге.",
  },
  {
    icon: LineChart,
    title: "Биржа проектов",
    text: "Опубликуйте проект с суммой и описанием. Инвестор видит карточку и может оставить заявку.",
  },
  {
    icon: Users,
    title: "Для инвесторов",
    text: "Фильтры по отрасли, стадии и региону. Быстрый просмотр без лишней бюрократии.",
  },
  {
    icon: Building2,
    title: "Для банков",
    text: "Продукты рядом с реальными запросами предпринимателей — живой канал привлечения.",
  },
];

export default function Home() {
  return (
    <Shell>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(30,168,122,0.16),_transparent_55%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 md:pt-24">
          <p className="mb-5 inline-flex rounded-full bg-raised px-3 py-1 text-xs tracking-wide text-primary">
            Площадка для предпринимателей Узбекистана
          </p>
          <h1 className="max-w-3xl font-display text-4xl leading-tight md:text-6xl">
            Считайте финансы.
            <span className="block text-primary">Находите деньги на рост.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg">
            MoliyaHub считает показатели по балансу и ОПУ, подсказывает, что чинить, и
            показывает, где взять финансирование — у банка, инвестора или через исламские
            инструменты.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/analyze">
                Рассчитать показатели <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/projects">Смотреть проекты</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 pb-24">
        <h2 className="mb-10 font-display text-3xl">Что умеет платформа</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="rounded-2xl bg-surface p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]"
            >
              <f.icon className="mb-4 size-6 text-gold" />
              <h3 className="font-display text-xl">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h2 className="font-display text-3xl">Три шага — и картина ясна</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              ["1", "Введите отчётность", "15 полей баланса и ОПУ или демо-пример."],
              ["2", "Смотрите скоринг", "Ликвидность, рентабельность, долг, оборачиваемость."],
              ["3", "Выберите деньги", "Кредит, мурабаха, лизинг или инвестор под ваш балл."],
            ].map(([n, t, d]) => (
              <div key={n} className="rounded-2xl bg-raised p-6">
                <div className="font-display text-3xl text-gold">{n}</div>
                <h3 className="mt-3 font-semibold">{t}</h3>
                <p className="mt-2 text-sm text-muted">{d}</p>
              </div>
            ))}
          </div>
          <Button asChild className="mt-10" size="lg">
            <Link href="/analyze">Начать расчёт</Link>
          </Button>
        </div>
      </section>
    </Shell>
  );
}
