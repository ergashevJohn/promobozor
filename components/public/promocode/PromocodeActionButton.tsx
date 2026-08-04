"use client";

import { Button } from "@/components/ui/button";
import { Copy, ExternalLink } from "lucide-react";
import { usePromocode, usePromocodeDisplay } from "../PromocodeContext";

export function PromocodeActionButton() {
  const { promocode, translations, copied, handleCopy } = usePromocode();
  const { isInactive } = usePromocodeDisplay();
  const t = translations.promocode;

  if (promocode.type === "code" && promocode.code) {
    return (
      <Button
        onClick={handleCopy}
        size="lg"
        aria-label={
          isInactive
            ? t.expired
            : copied
              ? `${t.promoCode}: ${t.copied}`
              : `${t.promoCode}: ${t.copyCode}`
        }
        className={`w-full rounded-full py-4 transition-all sm:py-3 ${
          copied
            ? "bg-green-500 hover:bg-green-600"
            : isInactive
              ? "cursor-not-allowed bg-slate-400 text-white"
              : "bg-accent-red text-accent-red-foreground hover:bg-accent-red/90"
        }`}
        disabled={copied || isInactive}
      >
        <Copy size={18} className="mr-2" />
        <span>{isInactive ? t.expired : copied ? `✓ ${t.copied}` : t.copyCode}</span>
      </Button>
    );
  }

  if (promocode.type === "link" && promocode.link) {
    return (
      <Button
        onClick={handleCopy}
        size="lg"
        disabled={isInactive}
        aria-label={isInactive ? t.expired : t.activateLink}
        className={`w-full rounded-full py-4 sm:py-3 ${isInactive ? "cursor-not-allowed bg-slate-400 text-white" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
      >
        <ExternalLink size={18} className="mr-2" />
        {isInactive ? t.expired : t.activateLink}
      </Button>
    );
  }

  return null;
}
