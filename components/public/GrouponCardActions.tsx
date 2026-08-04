"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Copy, Eye, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import { useReducer } from "react";
import { toast } from "sonner";

type Translations = {
  featured: string;
  verified: string;
  unlimited: string;
  unknownStore: string;
  activateLink: string;
  details: string;
  viewDetails: string;
  copy: string;
  copied: string;
  getDeal: string;
  like: string;
  dislike: string;
  codeCopied: string;
  copyError: string;
};

type Props = {
  promocodeId: string;
  type: "code" | "link" | null;
  code: string | null;
  link: string | null;
  detailsHref: string;
  translations: Translations;
  stats: {
    views: number;
    copies: number;
    likes: number;
    dislikes: number;
  };
  disabled?: boolean;
};

type State = {
  likes: number;
  dislikes: number;
  copied: boolean;
  userAction: "like" | "dislike" | null;
  copyCount: number;
};

type Action =
  | { type: "LIKED"; prevAction: "like" | "dislike" | null }
  | { type: "DISLIKED"; prevAction: "like" | "dislike" | null }
  | { type: "CODE_COPIED" }
  | { type: "LINK_USED" }
  | { type: "RESET_COPIED" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "LIKED":
      return {
        ...state,
        likes: state.likes + 1,
        dislikes: action.prevAction === "dislike" ? state.dislikes - 1 : state.dislikes,
        userAction: "like",
      };
    case "DISLIKED":
      return {
        ...state,
        dislikes: state.dislikes + 1,
        likes: action.prevAction === "like" ? state.likes - 1 : state.likes,
        userAction: "dislike",
      };
    case "CODE_COPIED":
      return { ...state, copied: true, copyCount: state.copyCount + 1 };
    case "LINK_USED":
      return { ...state, copyCount: state.copyCount + 1 };
    case "RESET_COPIED":
      return { ...state, copied: false };
  }
}

export function GrouponCardActions({
  promocodeId,
  type,
  code,
  link,
  detailsHref,
  translations,
  stats,
  disabled = false,
}: Props) {
  const [state, dispatch] = useReducer(reducer, {
    likes: stats.likes,
    dislikes: stats.dislikes,
    copied: false,
    userAction: null,
    copyCount: stats.copies,
  });

  const { likes, dislikes, copied, userAction, copyCount } = state;

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || userAction === "like") return;
    try {
      const res = await fetch(`/api/promocodes/${promocodeId}/like`, { method: "POST" });
      if (res.ok) {
        dispatch({ type: "LIKED", prevAction: userAction });
      }
    } catch (error) {
      console.error("Failed to like promocode:", error);
    }
  };

  const handleDislike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || userAction === "dislike") return;
    try {
      const res = await fetch(`/api/promocodes/${promocodeId}/dislike`, { method: "POST" });
      if (res.ok) {
        dispatch({ type: "DISLIKED", prevAction: userAction });
      }
    } catch (error) {
      console.error("Failed to dislike promocode:", error);
    }
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) {
      return;
    }
    try {
      if (type === "code") {
        await navigator.clipboard.writeText(code || "");
        dispatch({ type: "CODE_COPIED" });
        toast.success(translations.codeCopied);
      } else if (type === "link" && link) {
        window.open(link, "_blank", "noopener,noreferrer");
      }

      await fetch(`/api/promocodes/${promocodeId}/copy`, { method: "POST" });
      if (type !== "code") dispatch({ type: "LINK_USED" });
      if (type === "code") {
        setTimeout(() => dispatch({ type: "RESET_COPIED" }), 2000);
      }
    } catch (err) {
      console.error("Failed to copy/open link:", err);
      toast.error(translations.copyError);
    }
  };

  return (
    <>
      <div className="mt-auto grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <Button
          onClick={handleCopy}
          className={`h-12 w-full transition-all duration-200 ${
            type === "link"
              ? "bg-[color:var(--foreground)] text-white hover:bg-[#1f2937]"
              : "bg-[color:var(--accent-red)] text-white hover:bg-[#ef4f44]"
          } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
          size="default"
          disabled={disabled || (copied && type === "code")}
          aria-label={
            type === "link"
              ? translations.getDeal
              : copied
                ? translations.copied
                : translations.copy
          }
        >
          {type === "link" ? (
            <>
              <Star size={16} className="mr-1.5" />
              {translations.getDeal}
            </>
          ) : copied ? (
            <>
              <Copy size={16} className="mr-1.5" />
              {translations.copied}
            </>
          ) : (
            <>
              <Copy size={16} className="mr-1.5" />
              {translations.copy}
            </>
          )}
        </Button>

        <Button asChild variant="outline" className="h-12 rounded-xl bg-white/90 px-4">
          <Link href={detailsHref} aria-label={translations.viewDetails}>
            <Eye size={16} className="mr-1.5" />
            {translations.viewDetails}
          </Link>
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--secondary)] px-3 py-1.5 text-[color:var(--muted-foreground)]">
          <span className="font-semibold text-[color:var(--foreground)]">
            {translations.verified}
          </span>
          <span className="h-1 w-1 rounded-full bg-[color:var(--border)]" />
          <span>{type === "link" ? translations.getDeal : translations.copy}</span>
        </div>
        {copied && type === "code" && (
          <div className="rounded-full bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700">
            {translations.codeCopied}
          </div>
        )}
      </div>

      <div className="border-t border-[color:var(--border)] px-5 pt-3">
        <div className="flex items-center justify-between text-xs">
          <div className="text-muted-foreground flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Eye size={14} />
              <span className="font-medium">{stats.views.toLocaleString()}</span>
            </div>
            <div className="bg-muted-foreground h-3 w-px"></div>
            <div className="flex items-center gap-1.5">
              <Copy size={14} />
              <span className="font-medium">{copyCount.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all duration-200 ${
                userAction === "like"
                  ? "bg-green-100 text-green-700"
                  : "bg-muted text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700"
              } ${disabled ? "pointer-events-none cursor-not-allowed opacity-50" : ""}`}
              aria-label={`${translations.like} ${likes.toLocaleString()}`}
              aria-pressed={userAction === "like"}
              disabled={disabled}
            >
              <ThumbsUp size={14} className={userAction === "like" ? "fill-current" : ""} />
              <span className="font-semibold">{likes.toLocaleString()}</span>
            </button>

            <button
              onClick={handleDislike}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all duration-200 ${
                userAction === "dislike"
                  ? "bg-red-100 text-red-700"
                  : "bg-muted text-muted-foreground hover:bg-[color:var(--accent)] hover:text-[color:var(--accent-red)]"
              } ${disabled ? "pointer-events-none cursor-not-allowed opacity-50" : ""}`}
              aria-label={`${translations.dislike} ${dislikes.toLocaleString()}`}
              aria-pressed={userAction === "dislike"}
              disabled={disabled}
            >
              <ThumbsDown size={14} className={userAction === "dislike" ? "fill-current" : ""} />
              <span className="font-semibold">{dislikes.toLocaleString()}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
