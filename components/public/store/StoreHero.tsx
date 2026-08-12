import Image from "next/image";
import { Storefront } from "@phosphor-icons/react/dist/ssr";
import { getApprovedImageUrl } from "@/lib/media";
import StoreDescription from "@/components/public/StoreDescription";

interface StoreHeroProps {
  name: string;
  description: string | null | undefined;
  logoUrl: string | null;
  websiteUrl: string | null;
  totalPromocodesCount: number;
  uniqueBrandCount: number;
  uniqueCategoryCount: number;
  featuredPromocodesCount: number;
  totalViews: number;
  totalCopies: number;
  translations: {
    heroKicker: string;
    h1Title: string;
    activeRouteLabel: string;
    activePromocodes: string;
    brandMixLabel: string;
    connectedBrandsLabel: string;
    categorySpreadLabel: string;
    activeCategoryPathsLabel: string;
    storeTrustTitle: string;
    storeTrustDescription: string;
    visitWebsite: string;
    views: string;
    uses: string;
    altStoreLogo: string;
    altStoreLogoWithSlug: (slug: string) => string;
    featured: string;
  };
  slug: string;
}

export default function StoreHero({
  name,
  description,
  logoUrl,
  websiteUrl,
  totalPromocodesCount,
  uniqueBrandCount,
  uniqueCategoryCount,
  featuredPromocodesCount,
  totalViews,
  totalCopies,
  translations,
  slug,
}: StoreHeroProps) {
  const storeLogoUrl = getApprovedImageUrl(logoUrl);

  return (
    <div className="page-shell pb-10">
      <div className="page-hero-surface">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <div>
            <div className="mb-6 flex items-start gap-4">
              {storeLogoUrl ? (
                <div className="bg-card border-border relative mt-2 flex size-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-[22px] border md:size-20">
                  <Image
                    src={storeLogoUrl}
                    alt={
                      name
                        ? `${name} - ${translations.altStoreLogo}`
                        : translations.altStoreLogoWithSlug(slug)
                    }
                    fill
                    className="h-full w-full object-contain"
                    sizes="80px"
                    priority
                  />
                </div>
              ) : (
                <div className="bg-muted border-border flex size-16 flex-shrink-0 items-center justify-center rounded-[22px] border text-4xl md:size-20">
                  <Storefront className="text-foreground size-10 md:size-12" />
                </div>
              )}
              <div>
                <div className="brand-kicker mb-4">{translations.heroKicker}</div>
                <h1 className="text-foreground mb-2 text-3xl font-semibold md:text-5xl">
                  {translations.h1Title}
                </h1>
                {description && <StoreDescription description={description} />}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="surface-stat">
                <div className="text-xs font-semibold tracking-[0.14em] text-[color:var(--accent-red)] uppercase">
                  {translations.activeRouteLabel}
                </div>
                <div className="mt-3 text-3xl font-semibold text-[color:var(--foreground)]">
                  {totalPromocodesCount}
                </div>
                <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                  {translations.activePromocodes}
                </p>
              </div>
              <div className="surface-stat">
                <div className="text-xs font-semibold tracking-[0.14em] text-[color:var(--accent-red)] uppercase">
                  {translations.brandMixLabel}
                </div>
                <div className="mt-3 text-3xl font-semibold text-[color:var(--foreground)]">
                  {uniqueBrandCount}
                </div>
                <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                  {translations.connectedBrandsLabel}
                </p>
              </div>
              <div className="surface-stat">
                <div className="text-xs font-semibold tracking-[0.14em] text-[color:var(--accent-red)] uppercase">
                  {translations.categorySpreadLabel}
                </div>
                <div className="mt-3 text-3xl font-semibold text-[color:var(--foreground)]">
                  {uniqueCategoryCount}
                </div>
                <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                  {translations.activeCategoryPathsLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="surface-dark p-5">
              <div className="text-xs font-semibold tracking-[0.16em] text-white/70 uppercase">
                {translations.storeTrustTitle}
              </div>
              <div className="mt-3 text-2xl font-semibold">
                {featuredPromocodesCount} {translations.featured.toLowerCase()}
              </div>
              <p className="mt-2 text-sm leading-6 text-white/74">
                {translations.storeTrustDescription}
              </p>
              {websiteUrl && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow sponsored"
                  className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-[color:var(--ink-foreground)] px-5 py-3 text-sm font-semibold text-[color:var(--ink)] transition-transform hover:-translate-y-0.5"
                >
                  {translations.visitWebsite}
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="surface-stat">
                <div className="text-sm font-semibold text-[color:var(--foreground)]">
                  {translations.views}
                </div>
                <div className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">
                  {totalViews}
                </div>
              </div>
              <div className="surface-stat">
                <div className="text-sm font-semibold text-[color:var(--foreground)]">
                  {translations.uses}
                </div>
                <div className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">
                  {totalCopies}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
