import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] outline-none focus-visible:ring-[3px] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--accent-red)] text-[color:var(--accent-foreground-red)] shadow-[0_12px_28px_-16px_rgba(232,78,66,0.55)] hover:bg-[color:var(--accent-red)]/90",
        destructive:
          "bg-destructive hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 text-white",
        outline:
          "bg-background text-foreground hover:text-foreground border shadow-xs hover:border-[color:var(--accent-red)] hover:bg-[color:var(--accent)]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 min-h-11 px-5 py-2 has-[>svg]:px-4",
        sm: "h-10 min-h-10 gap-1.5 px-3.5 has-[>svg]:px-3",
        lg: "h-12 min-h-12 px-7 has-[>svg]:px-5",
        icon: "size-11 min-h-11 min-w-11",
        "icon-sm": "size-10 min-h-10 min-w-10",
        "icon-lg": "size-12 min-h-12 min-w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
