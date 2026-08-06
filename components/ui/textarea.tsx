import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "field-control placeholder:text-muted-foreground aria-invalid:ring-destructive/20 aria-invalid:border-destructive field-sizing-content min-h-32 resize-y py-3 text-base md:text-sm",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
