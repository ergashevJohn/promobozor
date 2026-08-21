import SafeHtmlContent from "@/components/public/SafeHtmlContent";
import { VerifiedBadge } from "@/components/public/VerifiedBadge";
import {
  EntityHeroFrame,
  EntityMetaRow,
  EntityMetricRail,
} from "@/components/public/entity-detail/EntityDetailPrimitives";
import { ArrowUpRightIcon, BuildingsIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";

interface BrandHeroProps {
  brandName: string;
  brandDescription?: string | null;
  brandImageUrl?: string | null;
  brandWebsiteUrl?: string | null;
  totalPromocodes: number;
  uniqueStoreCount: number;
  verifiedAt: Date | string | null | undefined;
  locale: string;
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
  verifiedAt,
  locale,
  t,
  tCommon,
  slug,
}: BrandHeroProps) {
  return (
    <div className="page-shell pb-4 md:pb-5">
      <EntityHeroFrame variant="brand">
        <div className="relative grid gap-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-end">
          {brandImageUrl ? (
            <div className="bg-card border-border relative size-28 shrink-0 overflow-hidden rounded-[1.75rem] border shadow-[0_20px_48px_-32px_rgba(15,20,25,0.38)] md:size-36">
              <Image
                src={brandImageUrl}
                alt={
                  brandName
                    ? `${brandName} - ${tCommon("altBrandLogo")}`
                    : tCommon("altBrandLogoWithSlug", { slug })
                }
                fill
                className="object-cover"
                sizes="144px"
                priority
              />
            </div>
          ) : (
            <div className="bg-muted border-border flex size-28 shrink-0 items-center justify-center rounded-[1.75rem] border text-[color:var(--accent-red)] md:size-36">
              <BuildingsIcon className="size-12" weight="duotone" aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0">
            <p className="brand-kicker mb-3">{t("heroKicker")}</p>
            <h1 className="page-hero-heading">{t("h1Title", { name: brandName })}</h1>
            {brandDescription ? (
              <SafeHtmlContent
                html={brandDescription}
                className="text-muted-foreground mt-5 max-w-[65ch] text-base leading-7 md:text-lg md:leading-8"
              />
            ) : null}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {totalPromocodes > 0 ? (
                <a
                  href="#offers"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[color:var(--accent-red)] px-5 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-[color:var(--ring)]/50 focus-visible:outline-none active:translate-y-0"
                >
                  {t("viewOffers")}
                </a>
              ) : null}
              {brandWebsiteUrl ? (
                <a
                  href={brandWebsiteUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow sponsored"
                  className="border-border text-foreground inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition-colors hover:bg-[color:var(--accent)] focus-visible:ring-[3px] focus-visible:ring-[color:var(--ring)]/50 focus-visible:outline-none"
                >
                  {t("officialWebsite")}
                  <ArrowUpRightIcon className="size-4" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
        <div className="relative mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <EntityMetricRail
            items={[
              { label: t("activePromocodes"), value: totalPromocodes },
              { label: t("storePlacementsLabel"), value: uniqueStoreCount },
            ]}
          />
          <EntityMetaRow>
            <VerifiedBadge verifiedAt={verifiedAt} locale={locale} label={t("lastReviewed")} />
          </EntityMetaRow>
        </div>
      </EntityHeroFrame>
    </div>
  );
}
