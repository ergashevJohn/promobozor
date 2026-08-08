import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type CtaIconProps = {
  children: ReactNode;
  className?: string;
};

/** Trailing icon for CTAs — no nest fill; motion only. */
export function CtaIcon({ children, className }: CtaIconProps) {
  return (
    <span
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5",
        className
      )}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}
