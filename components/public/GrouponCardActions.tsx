"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Copy, Eye, Star } from "@phosphor-icons/react";
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
  stats?: {
    views: number;
    copies: number;
    likes: number;
    dislikes: number;
  };
  disabled?: boolean;
};

type State = { copied: boolean };
type Action = { type: "CODE_COPIED" } | { type: "RESET_COPIED" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "CODE_COPIED":
      return { copied: true };
    case "RESET_COPIED":
      return { copied: false };
  }
}

export function GrouponCardActions({
  promocodeId,
  type,
  code,
  link,
  detailsHref,
  translations,
  disabled = false,
}: Props) {
  const [state, dispatch] = useReducer(reducer, { copied: false });
  const { copied } = state;

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    try {
      if (type === "code") {
        await navigator.clipboard.writeText(code || "");
        dispatch({ type: "CODE_COPIED" });
        toast.success(translations.codeCopied);
      } else if (type === "link" && link) {
        window.open(link, "_blank", "noopener,noreferrer");
      }

      await fetch(`/api/promocodes/${promocodeId}/copy`, { method: "POST" });
      if (type === "code") {
        setTimeout(() => dispatch({ type: "RESET_COPIED" }), 2000);
      }
    } catch (err) {
      console.error("Failed to copy/open link:", err);
      toast.error(translations.copyError);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleCopy}
        className={`h-12 w-full min-h-11 rounded-xl transition-[color,background-color,opacity,transform] duration-200 ${
          type === "link"
            ? "ink-surface hover:opacity-90"
            : "bg-[color:var(--accent-red)] text-white hover:bg-[#b83a33]"
        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
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

      <Button
        asChild
        variant="outline"
        className="h-10 min-h-10 w-full rounded-xl bg-card/95 text-sm"
      >
        <Link href={detailsHref} aria-label={translations.viewDetails}>
          <Eye size={16} className="mr-1.5" />
          {translations.viewDetails}
        </Link>
      </Button>
    </div>
  );
}
