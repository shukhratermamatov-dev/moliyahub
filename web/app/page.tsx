export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Шапка */}
      <header className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
            MoliyaHub
          </div>
          <nav className="hidden md:flex gap-8 text-sm text-slate-300">
            <a href="#features" className="hover:text-white transition">Возможности</a>
            <a href="#for-business" className="hover:text-white transition">Для бизнеса</a>
            <a href="#for-investors" className="hover:text-white transition">Для инвесторов</a>
          </nav>
          <button className="bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium px-5 py-2 rounded-lg transition">
            Скоро запуск
          </button>
        </div>
      </header>

      {/* Главный экран */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-sky-400 text-sm">
          Платформа для предпринимателей Узбекистана
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
          Финансовый анализ<br />
          <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
            и поиск инвестиций
          </span>
        </h1>
        
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
          Загрузите отчётность — получите анализ и рекомендации ИИ.
          Сравните предложения банков и найдите инвестора для своего проекта.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-sky-500 hover:bg-sky-400 text-white font-medium px-8 py-3 rounded-xl transition">
            Начать бесплатно
          </button>
          <button className="border border-slate-600 hover:border-slate-400 text-white font-medium px-8 py-3 rounded-xl transition">
            Узнать больше
          </button>
        </div>
      </section>

      {/* Возможности */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-14">Возможности платформы</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Финансовый анализ</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Загрузите баланс и ОПУ — система автоматически рассчитает все ключевые показатели и даст оценку здоровья бизнеса.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-2">ИИ-рекомендации</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Искусственный интеллект укажет на слабые места и предложит конкретные действия по улучшению финансовых показателей.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="text-3xl mb-4">💰</div>
            <h3 className="text-xl font-semibold mb-2">Поиск финансирования</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Сравните кредиты банков, исламское финансирование, венчур и другие инструменты в одном месте.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="text-3xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold mb-2">Биржа проектов</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Разместите свой проект или стартап и найдите инвестора, готового вложиться в вашу идею.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="text-3xl mb-4">📈</div>
            <h3 className="text-xl font-semibold mb-2">Для инвесторов</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Просматривайте проекты, изучайте бизнес-планы и ТЭО, выбирайте интересные предложения.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="text-3xl mb-4">🏦</div>
            <h3 className="text-xl font-semibold mb-2">Банки и партнёры</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Банки и финансовые компании могут размещать свои продукты и привлекать клиентов.
            </p>
          </div>
        </div>
      </section>

      {/* Нижний блок */}
      <section className="border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Скоро запуск</h2>
          <p className="text-slate-400 mb-8">
            Мы активно разрабатываем платформу. Следите за обновлениями.
          </p>
          <div className="text-slate-500 text-sm">
            © 2026 MoliyaHub. Все права защищены.
          </div>
        </div>
      </section>
    </div>
  );
}