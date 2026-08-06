import * as React from "react";

import { cn } from "@/lib/utils";

function Select({ className, ...props }: React.ComponentProps<"select">) {
  return <select data-slot="select" className={cn("field-control", className)} {...props} />;
}

export { Select };
