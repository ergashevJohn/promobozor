"use client";

import { Button } from "@/components/ui/button";
import { ShareNetworkIcon } from "@phosphor-icons/react/dist/ssr";
import { usePromocode } from "../PromocodeContext";

export function PromocodeStats() {
  const { promocode, translations, handleShare } = usePromocode();
  const t = translations.promocode;

  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="surface-stat space-y-2 text-center">
          <p className="text-muted-foreground text-xs tracking-widest uppercase">{t.views}</p>
          <p className="text-foreground text-2xl font-bold sm:text-3xl">{promocode.viewsCount}</p>
        </div>
        <div className="surface-stat space-y-2 text-center">
          <p className="text-muted-foreground text-xs tracking-widest uppercase">{t.copies}</p>
          <p className="text-foreground text-2xl font-bold sm:text-3xl">{promocode.copyCount}</p>
        </div>
      </div>

      {/* Engagement Buttons */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="bg-card/95 h-11 flex-1 gap-2 rounded-xl"
            onClick={handleShare}
            aria-label={t.share}
          >
            <ShareNetworkIcon size={18} aria-hidden="true" />
            <span className="hidden sm:inline">{t.share}</span>
          </Button>
        </div>
      </div>
    </>
  );
}
