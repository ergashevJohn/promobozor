import { PromocodeListOptimized } from "@/components/public/PromocodeListServer";
import { CtaIcon } from "@/components/ui/cta-icon";
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
import {
  mapPromocodeListRow,
  promocodeListSelect,
  type PromocodeListRow,
} from "@/lib/queries/promocode-list";
import { getHomeTranslations } from "@/lib/translations";
import { and, asc, eq, isNull, lte, ne, or } from "drizzle-orm";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
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

      const runQuery = async () =>
        (await db
          .select(promocodeListSelect)
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
          .limit(6)) as PromocodeListRow[];

      let promocodesData: PromocodeListRow[] = [];

      try {
        promocodesData = await runQuery();
      } catch (error) {
        console.error("Error fetching featured promocodes (attempt 1):", error);
        try {
          await new Promise((resolve) => setTimeout(resolve, 200));
          promocodesData = await runQuery();
        } catch (retryError) {
          console.error("Error fetching featured promocodes (attempt 2):", retryError);
          promocodesData = [];
        }
      }

      const featuredPromocodes = promocodesData.map((row) =>
        mapPromocodeListRow(row, { includeStartsAt: true, includeConditions: true })
      );

      return { featuredPromocodes };
    },
    ["featured-promocodes", locale],
    {
      revalidate: 300, // 5 minutes - increased from 30 seconds for better performance
      tags: ["promocodes", "featured-promocodes", `featured-promocodes-${locale}`],
    }
  )();

export default async function FeaturedPromocodes({ locale }: FeaturedPromocodesProps) {
  const [featuredResult, translations, tStore] = await Promise.all([
    getFeatured(locale),
    getHomeTranslations(locale),
    getTranslations({ locale, namespace: "store" }),
  ]);

  const { featuredPromocodes } = featuredResult;
  const {
    home: t,
    common: tCommon,
    empty: tEmpty,
    card: tCard,
    promocode: tPromocode,
  } = translations;

  if (featuredPromocodes.length === 0) {
    return (
      <section className="my-12">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="brand-section-heading">{t("featuredPromocodes")}</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl text-base md:text-lg">
              {t("overhaul.featured.description")}
            </p>
          </div>
          <Link
            href="/promocodes"
            className="text-foreground inline-flex min-h-11 items-center gap-1 text-sm font-medium transition-colors hover:text-[color:var(--accent-red)]"
          >
            {tCommon("viewAll")}
            <ArrowRightIcon size={16} />
          </Link>
        </div>
        <div className="empty-state-card">
          <h3 className="text-foreground mb-2 text-xl font-semibold">{tEmpty("noPromocodes")}</h3>
          <p className="text-muted-foreground mx-auto max-w-xl text-sm leading-6">
            {tEmpty("noPromocodesDescription")}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="section-rhythm">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="brand-section-heading text-left">{t("featuredPromocodes")}</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl text-base md:text-lg">
            {t("overhaul.featured.description")}
          </p>
        </div>
        <Link
          href="/promocodes?featured=true"
          className="group text-foreground inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-medium transition-colors hover:text-[color:var(--accent-red)]"
          aria-label={`${t("featuredPromocodes")} - ${tCommon("viewAll")}`}
        >
          {tCommon("viewAll")}
          <CtaIcon>
            <ArrowRightIcon size={16} weight="light" />
          </CtaIcon>
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
            conditionsLabel: tCard("conditionsLabel"),
            codeCopied: tPromocode("codeCopied"),
            copyError: tPromocode("copyError"),
          },
        }}
      />
    </section>
  );
}
