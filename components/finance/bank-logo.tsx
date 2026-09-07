"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// Простой детерминированный цвет фона для аватара-заглушки — чтобы одно и то же
// название банка всегда получало один и тот же цвет.
function initialsColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  return `hsl(${hue} 45% 30%)`;
}

type BankLogoProps = {
  name: string;
  logoDomain?: string;
  size?: number;
  className?: string;
};

// Логотип банка через прокси фавиконок Google — не нужно хранить и поддерживать
// файлы логотипов самим. Если домен не указан (например, для небанковских записей
// каталога) или картинка не загрузилась — показываем аватар с первой буквой
// названия на цветном фоне.
export function BankLogo({ name, logoDomain, size = 32, className }: BankLogoProps) {
  const [failed, setFailed] = useState(false);
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  if (!logoDomain || failed) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full font-display text-fg/90",
          className,
        )}
        style={{ width: size, height: size, backgroundColor: initialsColor(name), fontSize: size * 0.42 }}
        aria-hidden="true"
      >
        {initial}
      </span>
    );
  }

  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(logoDomain)}&sz=${size * 2}`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("shrink-0 rounded-full bg-raised object-contain p-1", className)}
      style={{ width: size, height: size }}
    />
  );
}
