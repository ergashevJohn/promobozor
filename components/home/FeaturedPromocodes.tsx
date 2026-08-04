import { PromocodeListOptimized } from "@/components/public/PromocodeListServer";
import { Link } from "@/i18n/navigation";
import {
  brands,
  brandTranslations,
  db,
  promocodes,
  promocodeTranslations,
  stores,
  storeTranslations,
} from "@/lib/db";
import { getHomeTranslations } from "@/lib/translations";
import { and, asc, eq, isNull, lte, ne, or } from "drizzle-orm";
import { ArrowRight } from "lucide-react";
import { unstable_cache } from "next/cache";
import { getTranslations } from "next-intl/server";

interface FeaturedPromocodesProps {
  locale: string;
}

const getFeatured = (locale: string) =>
  unstable_cache(
    async () => {
      const now = new Date();

      // Build where conditions
      const whereConditions = [
        ne(promocodes.status, "draft"), // Exclude draft, show all others (active, expired, disabled)
        eq(promocodes.isFeatured, true), // Only featured
        or(isNull(promocodes.storeId), eq(stores.isActive, true)),
        // Note: Allow expired promocodes to show
        or(isNull(promocodes.startsAt), lte(promocodes.startsAt, now)),
      ];

      let promocodesData: Array<{
        promocode: typeof promocodes.$inferSelect;
        store: typeof stores.$inferSelect | null;
        storeTranslation: typeof storeTranslations.$inferSelect | null;
        brand: typeof brands.$inferSelect | null;
        brandTranslation: typeof brandTranslations.$inferSelect | null;
        promocodeTranslation: typeof promocodeTranslations.$inferSelect | null;
      }> = [];

      try {
        promocodesData = await db
          .select({
            promocode: promocodes,
            store: stores,
            storeTranslation: storeTranslations,
            brand: brands,
            brandTranslation: brandTranslations,
            promocodeTranslation: promocodeTranslations,
          })
          .from(promocodes)
          .leftJoin(stores, eq(promocodes.storeId, stores.id))
          .leftJoin(brands, eq(promocodes.brandId, brands.id))
          .leftJoin(
            promocodeTranslations,
            and(
              eq(promocodeTranslations.promocodeId, promocodes.id),
              eq(promocodeTranslations.language, locale as "uz" | "ru" | "en")
            )
          )
          .leftJoin(
            storeTranslations,
            and(
              eq(storeTranslations.storeId, stores.id),
              eq(storeTranslations.language, locale as "uz" | "ru" | "en")
            )
          )
          .leftJoin(
            brandTranslations,
            and(
              eq(brandTranslations.brandId, brands.id),
              eq(brandTranslations.language, locale as "uz" | "ru" | "en")
            )
          )
          .where(and(...whereConditions))
          .orderBy(asc(promocodes.order))
          .limit(6); // Limit featured items
      } catch (error) {
        console.error("Error fetching featured promocodes:", error);
        promocodesData = [];
      }

      const featuredPromocodes = promocodesData.map((row) => ({
        id: row.promocode.id,
        type: row.promocode.type as "code" | "link",
        code: row.promocode.code,
        link: row.promocode.link,
        discountType: row.promocode.discountType,
        discountValue: row.promocode.discountValue,
        currency: row.promocode.currency,
        isFeatured: row.promocode.isFeatured,
        status: row.promocode.status,
        viewsCount: row.promocode.viewsCount,
        copyCount: row.promocode.copyCount,
        likesCount: row.promocode.likesCount,
        dislikesCount: row.promocode.dislikesCount,
        expiresAt: row.promocode.expiresAt?.toISOString() || null,
        translations: row.promocodeTranslation
          ? [
              {
                language: row.promocodeTranslation.language,
                title: row.promocodeTranslation.title,
                slug: row.promocodeTranslation.slug,
              },
            ]
          : [],
        store: row.store
          ? {
              id: row.store.id,
              logoUrl: row.store.logoUrl,
              translations: row.storeTranslation
                ? [
                    {
                      language: row.storeTranslation.language,
                      name: row.storeTranslation.name,
                      slug: row.storeTranslation.slug,
                    },
                  ]
                : [],
            }
          : null,
        brand:
          row.brand && row.brandTranslation
            ? {
                id: row.brand.id,
                imageUrl: row.brand.imageUrl,
                translations: [
                  {
                    language: row.brandTranslation.language,
                    name: row.brandTranslation.name,
                    slug: row.brandTranslation.slug,
                  },
                ],
              }
            : null,
      }));

      return { featuredPromocodes };
    },
    ["featured-promocodes", locale],
    {
      revalidate: 300, // 5 minutes - increased from 30 seconds for better performance
      tags: ["promocodes", "featured-promocodes", `featured-promocodes-${locale}`],
    }
  )();

export default async function FeaturedPromocodes({ locale }: FeaturedPromocodesProps) {
  const { featuredPromocodes } = await getFeatured(locale);
  const translations = await getHomeTranslations(locale);
  const tStore = await getTranslations({ locale, namespace: "store" });
  const {
    home: t,
    common: tCommon,
    empty: tEmpty,
    card: tCard,
    promocode: tPromocode,
  } = translations;

  if (featuredPromocodes.length === 0) {
    return null;
  }

  // Transform data
  return (
    <section className="my-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="brand-kicker mb-3">{t("overhaul.featured.eyebrow")}</div>
          <h2 className="brand-section-heading">{t("featuredPromocodes")}</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl text-base md:text-lg">
            {t("overhaul.featured.description")}
          </p>
        </div>
        <Link
          href="/promocodes?featured=true"
          className="text-foreground flex items-center gap-1 text-sm font-medium transition-colors hover:text-[color:var(--accent-red)]"
          aria-label={`${t("featuredPromocodes")} - ${tCommon("viewAll")}`}
        >
          {tCommon("viewAll")}
          <ArrowRight size={16} />
        </Link>
      </div>
      <PromocodeListOptimized
        promocodes={featuredPromocodes}
        maxItems={6}
        mobileMaxItems={4}
        translations={{
          noPromocodes: tEmpty("noPromocodes"),
          noPromocodesDescription: tEmpty("noPromocodesDescription"),
          card: {
            featured: tCard("featured"),
            verified: tCard("verified"),
            fresh: tCard("fresh"),
            popular: tCard("popular"),
            endingSoon: tPromocode("expiresSoon"),
            unlimited: tCard("unlimited"),
            unknownStore: tCard("unknownStore"),
            storeTitle: tStore("title"),
            promocodeTitle: tPromocode("title"),
            activateLink: tCard("activateLink"),
            details: tCard("details"),
            viewDetails: tCard("viewDetails"),
            storeOffer: tCard("storeOffer"),
            brandOffer: tCard("brandOffer"),
            directDeal: tCard("directDeal"),
            codeReady: tCard("codeReady"),
            dealRoute: tCard("dealRoute"),
            promoCodeLabel: tCard("promoCodeLabel"),
            copy: tCard("copy"),
            copied: tCard("copied"),
            getDeal: tCard("getDeal"),
            like: tCard("like"),
            dislike: tCard("dislike"),
            expired: tCard("expired"),
            disabled: tCard("disabled"),
            codeCopied: tPromocode("codeCopied"),
            copyError: tPromocode("copyError"),
          },
        }}
      />
    </section>
  );
}
