import { Link } from "@/i18n/navigation";
import { AlertCircle, Star } from "lucide-react";
import Image from "next/image";
import type { Promocode } from "../types";
import type { PromocodeDisplayData } from "@/lib/promocode-utils";

export function PromocodeHeader({
  promocode,
  translations,
  displayData,
}: {
  promocode: Promocode;
  translations: Record<string, Record<string, string>>;
  displayData: PromocodeDisplayData;
}) {
  const {
    displayName,
    displayImage,
    displaySlug,
    displayType,
    translation,
    isExpired,
    isInactive,
  } = displayData;
  const tCommon = translations.common;
  const tCard = translations.card;
  const promocodeTitle = translations.promocode?.title || tCommon.promocodes;

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-[20px] border border-white/80 bg-white shadow-[0_18px_48px_-40px_rgba(17,24,39,0.45)]">
          {displayImage ? (
            <Image
              src={displayImage}
              alt={displayName}
              width={64}
              height={64}
              priority
              sizes="(max-width: 640px) 64px, 64px"
              className="h-16 w-16 rounded-[18px] object-cover"
            />
          ) : (
            <span className="text-muted-foreground text-2xl font-bold">
              {displayName.charAt(0)}
            </span>
          )}
        </div>
        <div>
          <div className="brand-kicker mb-3">
            <span>{displayName}</span>
          </div>
          <h1 className="text-foreground text-xl font-bold sm:text-2xl md:text-3xl">
            {translation?.title || promocodeTitle}
          </h1>
          {displaySlug && (
            <Link
              href={`/${displayType}/${displaySlug}`}
              className="text-muted-foreground hover:text-primary text-sm transition-colors"
            >
              {displayName}
            </Link>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {promocode.isFeatured && !isInactive && (
          <div className="flex items-center gap-1.5 rounded-full bg-[color:var(--accent)] px-3 py-1.5">
            <Star size={14} className="fill-accent-red text-accent-red" />
            <span className="text-accent-red text-xs font-semibold">{tCommon.featured}</span>
          </div>
        )}
        {isInactive && (
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
              isExpired ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"
            }`}
          >
            <AlertCircle size={14} />
            <span>{isExpired ? tCard.expired : tCard.disabled}</span>
          </div>
        )}
      </div>
    </div>
  );
}
