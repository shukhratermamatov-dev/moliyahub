import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Экспорт анализа в PDF (app/api/finance/export/pdf) читает .ttf-шрифты
  // с кириллицей из assets/fonts через fs — без этого Vercel может не
  // включить их в собранную serverless-функцию.
  outputFileTracingIncludes: {
    "/**": [
      "./assets/fonts/**",
      // Подстраховка вдобавок к serverExternalPackages: явно указываем
      // трассировщику включить сами бинарные/шрифтовые данные pdfmake и
      // его зависимостей на случай, если автоматическая трассировка
      // внешнего пакета их не найдёт.
      "./node_modules/pdfmake/**",
      "./node_modules/pdfkit/**",
      "./node_modules/@foliojs-fork/**",
    ],
  },
  // pdfmake тянет за собой pdfkit/fontkit, которые сами читают через fs
  // свои бинарные данные (например data.trie) относительно расположения
  // модуля в node_modules. Бандлер (Turbopack) не умеет корректно
  // отследить такие динамические fs-пути и оставляет собранный код без
  // этого файла — из-за этого сборка падает с ENOENT на Vercel.
  // serverExternalPackages исключает pdfmake (и всё, что он require'ит)
  // из бандлинга: пакет остаётся как есть в node_modules и подключается
  // обычным Node.js require в рантайме, где такие относительные fs-пути
  // работают штатно.
  serverExternalPackages: ["pdfmake"],
};

export default nextConfig;
