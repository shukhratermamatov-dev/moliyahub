"use client";

import { useEffect, useRef, useState, type ChangeEvent, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// Группирует цифры по три с пробелом: "60000000" -> "60 000 000".
function groupDigits(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function formatSigned(value: number): string {
  if (!value) return "";
  const sign = value < 0 ? "-" : "";
  return sign + groupDigits(String(Math.trunc(Math.abs(value))));
}

type NumberFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: number;
  onValueChange: (value: number) => void;
  /** Разрешить ввод отрицательных чисел (например, чистая прибыль/убыток). */
  allowNegative?: boolean;
};

// Текстовое поле для крупных сумм: показывает "60 000 000" вместо "60000000",
// но наружу всегда отдаёт обычное число. Реализовано через type="text" +
// inputMode="numeric", потому что нативный <input type="number"> не умеет
// показывать сгруппированные разряды. Сохраняет позицию курсора при вводе.
export function NumberField({ value, onValueChange, allowNegative = false, className, ...props }: NumberFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [display, setDisplay] = useState(() => formatSigned(value));

  // Синхронизация при внешнем изменении value (сброс формы, загрузка данных и т.п.),
  // но не перетирать то, что уже набрано, если число совпадает.
  useEffect(() => {
    const next = formatSigned(value);
    setDisplay((prev) => (prev.replace(/\s/g, "") === next.replace(/\s/g, "") ? prev : next));
  }, [value]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const raw = input.value;
    const cursorBefore = input.selectionStart ?? raw.length;
    const significantBeforeCursor = raw.slice(0, cursorBefore).replace(/[^\d-]/g, "").length;

    const isNegative = allowNegative && raw.trimStart().startsWith("-");
    const digits = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
    const grouped = (isNegative ? "-" : "") + groupDigits(digits);
    const numeric = digits ? Number(digits) * (isNegative ? -1 : 1) : 0;

    setDisplay(grouped);
    onValueChange(numeric);

    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      let seen = 0;
      let pos = grouped.length;
      for (let i = 0; i < grouped.length; i++) {
        if (grouped[i] !== " ") seen++;
        if (seen === significantBeforeCursor) {
          pos = i + 1;
          break;
        }
      }
      if (significantBeforeCursor === 0) pos = 0;
      el.setSelectionRange(pos, pos);
    });
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={display}
      onChange={handleChange}
      className={cn(
        "h-11 w-full rounded-xl bg-raised px-3 text-sm text-fg tabular-nums shadow-[0_0_0_1px_rgba(255,255,255,0.08)] placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-primary/50",
        className,
      )}
      {...props}
    />
  );
}
