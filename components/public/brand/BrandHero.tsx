import SafeHtmlContent from "@/components/public/SafeHtmlContent";
import { Buildings } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";

interface BrandHeroProps {
  brandName: string;
  brandDescription?: string | null;
  brandImageUrl?: string | null;
  brandWebsiteUrl?: string | null;
  totalPromocodes: number;
  uniqueStoreCount: number;
  t: (key: string, params?: Record<string, string | number>) => string;
  tCommon: (key: string, params?: Record<string, string | number>) => string;
  slug: string;
}

export default function BrandHero({
  brandName,
  brandDescription,
  brandImageUrl,
  brandWebsiteUrl,
  totalPromocodes,
  uniqueStoreCount,
  t,
  tCommon,
  slug,
}: BrandHeroProps) {
  return (
    <div className="page-shell pb-10">
      <div className="page-hero-surface">
        <div className="flex flex-col items-start gap-8 md:flex-row md:items-center">
          {brandImageUrl ? (
            <div className="bg-card border-border relative size-28 shrink-0 overflow-hidden rounded-2xl border md:size-36">
              <Image
                src={brandImageUrl}
                alt={
                  brandName
                    ? `${brandName} - ${tCommon("altBrandLogo")}`
                    : tCommon("altBrandLogoWithSlug", { slug })
                }
                fill
                className="object-contain p-3"
                sizes="144px"
                priority
              />
            </div>
          ) : (
            <div className="bg-muted border-border flex size-28 shrink-0 items-center justify-center rounded-2xl border text-[color:var(--accent-red)] md:size-36">
              <Buildings className="h-12 w-12" aria-hidden="true" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="brand-kicker mb-4">{t("heroKicker")}</div>
            <h1 className="text-foreground mb-3 text-3xl font-semibold tracking-tight md:text-5xl">
              {t("h1Title", { name: brandName })}
            </h1>
            {brandDescription && (
              <SafeHtmlContent
                html={brandDescription}
                className="text-muted-foreground max-w-[65ch] text-lg leading-8"
              />
            )}
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <span className="text-muted-foreground text-sm">
                <strong className="text-foreground text-lg font-semibold">{totalPromocodes}</strong>{" "}
                {t("activePromocodes")}
              </span>
              <span className="text-muted-foreground text-sm">
                <strong className="text-foreground text-lg font-semibold">
                  {uniqueStoreCount}
                </strong>{" "}
                {t("storePlacementsLabel")}
              </span>
              {brandWebsiteUrl && (
                <a
                  href={brandWebsiteUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow sponsored"
                  className="bg-card inline-flex min-h-11 items-center gap-2 rounded-xl border border-[color:var(--border)] px-5 py-3 text-sm font-semibold text-[color:var(--foreground)]"
                >
                  {t("officialWebsite")}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
