import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl bg-raised px-3 text-sm text-fg tabular-nums shadow-[0_0_0_1px_rgba(255,255,255,0.08)] placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-primary/50",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl bg-raised px-3 py-2.5 text-sm text-fg shadow-[0_0_0_1px_rgba(255,255,255,0.08)] placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-primary/50",
        className,
      )}
      {...props}
    />
  );
}
