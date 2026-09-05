import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Экспорт анализа в PDF (app/api/finance/export/pdf) читает .ttf-шрифты
  // с кириллицей из assets/fonts через fs — без этого Vercel может не
  // включить их в собранную serverless-функцию.
  outputFileTracingIncludes: {
    "/**": ["./assets/fonts/**"],
  },
};

export default nextConfig;
