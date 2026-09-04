import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 min-h-11 px-4",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-fg hover:brightness-110 shadow-[0_0_0_1px_rgba(30,168,122,0.35)]",
        ghost: "bg-transparent text-fg hover:bg-raised",
        outline: "bg-transparent text-fg shadow-[0_0_0_1px_rgba(255,255,255,0.12)] hover:bg-raised",
        gold: "bg-gold text-bg hover:brightness-105",
        subtle: "bg-raised text-fg hover:bg-line",
      },
      size: {
        default: "px-5",
        sm: "min-h-9 px-3 text-xs",
        lg: "min-h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild, ...props }: Props) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
