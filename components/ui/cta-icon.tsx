import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type CtaIconProps = {
  children: ReactNode;
  className?: string;
};

/** Trailing icon nest for CTAs (avoids flat arrow-only affordance). */
export function CtaIcon({ children, className }: CtaIconProps) {
  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-black/5 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105 dark:bg-white/10",
        className
      )}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}
