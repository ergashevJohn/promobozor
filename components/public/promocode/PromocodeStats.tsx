"use client";

import { Button } from "@/components/ui/button";
import { Share2, ThumbsDown, ThumbsUp } from "lucide-react";
import { usePromocode } from "../PromocodeContext";

export function PromocodeStats() {
  const { promocode, translations, liked, disliked, handleShare, handleLike, handleDislike } =
    usePromocode();
  const t = translations.promocode;
  const tCard = translations.card;

  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 rounded-[24px] border border-[color:var(--border)] bg-white/90 p-4 text-center shadow-[0_18px_48px_-42px_rgba(17,24,39,0.35)]">
          <p className="text-muted-foreground text-xs tracking-widest uppercase">{t.views}</p>
          <p className="text-foreground text-2xl font-bold sm:text-3xl">{promocode.viewsCount}</p>
        </div>
        <div className="space-y-2 rounded-[24px] border border-[color:var(--border)] bg-white/90 p-4 text-center shadow-[0_18px_48px_-42px_rgba(17,24,39,0.35)]">
          <p className="text-muted-foreground text-xs tracking-widest uppercase">{t.copies}</p>
          <p className="text-foreground text-2xl font-bold sm:text-3xl">{promocode.copyCount}</p>
        </div>
      </div>

      {/* Engagement Buttons */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="h-11 flex-1 gap-2 rounded-full bg-white/90"
            onClick={handleShare}
            aria-label={t.share}
          >
            <Share2 size={18} />
            <span className="hidden sm:inline">{t.share}</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleLike}
            className={`h-11 flex-1 gap-2 rounded-full bg-white/90 ${
              liked
                ? "border-accent-red/50 bg-accent-red/10 text-accent-red hover:bg-accent-red/20"
                : ""
            }`}
            aria-label={`${tCard.like} (${promocode.likesCount})`}
            title={tCard.like}
          >
            <ThumbsUp size={18} fill={liked ? "currentColor" : "none"} />
            <span className="hidden sm:inline">{promocode.likesCount}</span>
            <span className="sm:hidden">{promocode.likesCount}</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleDislike}
            className={`h-11 flex-1 gap-2 rounded-full bg-white/90 ${
              disliked ? "border-red-500/50 bg-red-500/10 text-red-500 hover:bg-red-500/20" : ""
            }`}
            aria-label={`${tCard.dislike} (${promocode.dislikesCount})`}
            title={tCard.dislike}
          >
            <ThumbsDown size={18} fill={disliked ? "currentColor" : "none"} />
            <span className="hidden sm:inline">{promocode.dislikesCount}</span>
            <span className="sm:hidden">{promocode.dislikesCount}</span>
          </Button>
        </div>
      </div>
    </>
  );
}
