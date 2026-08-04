import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { BreadcrumbsSchema } from "@/components/public/BreadcrumbsSchema";
import { HowToSchema } from "@/components/public/HowToSchema";
import PromocodeDetail from "@/components/public/PromocodeDetail";
import StructuredData from "@/components/public/StructuredData";
import type { PromocodeStatus } from "@/components/public/types";
import {
  brands,
  brandTranslations,
  categories,
  categoryTranslations,
  db,
  promocodes,
  promocodeTranslations,
  stores,
  storeTranslations,
} from "@/lib/db";
import { isValidLanguage, type Language } from "@/lib/i18n";
import {
  generateFullMetadata,
  generateOgImageUrl,
  generatePromocodeDescription,
  generatePromocodeTitle,
  getBaseUrl,
} from "@/lib/metadata";
import { getMessages, getTranslations } from "next-intl/server";
import { and, desc, eq, gt, isNull, lte, ne, or, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isGone } from "@/lib/redirects";
import { NotFoundUI } from "@/components/public/NotFoundUI";

export async function generateStaticParams() {
  // Skip static generation for promocodes - render dynamically
  return [];
}

// This route cannot be statically rendered because the app root layout reads
// request headers (`x-nonce`, `x-pathname`) from proxy.ts. Leaving the detail
// page in ISR mode causes Next.js to throw DYNAMIC_SERVER_USAGE in production.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;

  if (!isValidLanguage(locale)) {
    return {};
  }
  const [tPromocode, tStore] = await Promise.all([
    getTranslations({ locale, namespace: "promocode" }),
    getTranslations({ locale, namespace: "store" }),
  ]);
  const promocodeTitle = tPromocode("title");
  const storeTitle = tStore("title");

  // 410 Gone check
  if (isGone("promocode", slug)) {
    return {
      title: "Gone",
      robots: { index: false, follow: false },
    };
  }

  try {
    const now = new Date();
    const [promocodeData] = await db
      .select({
        promocode: promocodes,
        store: stores,
        storeTranslation: storeTranslations,
        promocodeTranslation: promocodeTranslations,
      })
      .from(promocodes)
      .leftJoin(stores, eq(promocodes.storeId, stores.id))
      .leftJoin(
        promocodeTranslations,
        and(
          eq(promocodeTranslations.promocodeId, promocodes.id),
          eq(promocodeTranslations.language, locale as "uz" | "ru" | "en"),
          eq(promocodeTranslations.slug, slug)
        )
      )
      .leftJoin(
        storeTranslations,
        and(
          eq(storeTranslations.storeId, stores.id),
          eq(storeTranslations.language, locale as "uz" | "ru" | "en")
        )
      )
      .where(
        and(
          eq(promocodeTranslations.slug, slug),
          eq(promocodeTranslations.language, locale as "uz" | "ru" | "en"),
          eq(promocodes.status, "active"),
          or(isNull(promocodes.storeId), eq(stores.isActive, true)),
          or(isNull(promocodes.expiresAt), gt(promocodes.expiresAt, now)),
          or(isNull(promocodes.startsAt), lte(promocodes.startsAt, now))
        )
      )
      .limit(1);

    if (!promocodeData) {
      return {};
    }

    const translation = promocodeData.promocodeTranslation;
    const storeTranslation = promocodeData.storeTranslation;
    const promocode = promocodeData.promocode;

    // Format discount for better SEO
    let discountText = "";
    if (promocode.discountType === "percent" && promocode.discountValue) {
      discountText = `${promocode.discountValue}%`;
    } else if (promocode.discountType === "amount" && promocode.discountValue) {
      discountText = `${promocode.discountValue} ${promocode.currency || "UZS"}`;
    }

    // Generate SEO-optimized title and description
    const title =
      translation?.metaTitle ||
      generatePromocodeTitle(
        translation?.title || promocodeTitle,
        storeTranslation?.name || storeTitle,
        discountText || null,
        locale
      );

    const description =
      translation?.metaDescription ||
      generatePromocodeDescription(
        translation?.title || promocodeTitle,
        storeTranslation?.name || storeTitle,
        discountText || null,
        translation?.conditions || null,
        locale
      );

    const url = `/${locale}/promocode/${slug}`;

    // Format discount text for OG image (with "chegirma" suffix)
    const discountTextForOG = discountText ? `${discountText} chegirma` : "";

    // Generate dynamic OG image with discount badge
    const ogImage = generateOgImageUrl({
      title: translation?.title || promocodeTitle,
      description: description.slice(0, 100),
      type: "promocode",
      logo: promocodeData.store?.logoUrl || undefined,
      discount: discountTextForOG || undefined,
    });

    // Get all language slugs for this promocode
    const allTranslations = await db
      .select({
        language: promocodeTranslations.language,
        slug: promocodeTranslations.slug,
      })
      .from(promocodeTranslations)
      .where(eq(promocodeTranslations.promocodeId, promocode.id));

    const languageAlternates: Record<string, string> = {};
    allTranslations.forEach((t) => {
      languageAlternates[t.language] = `/${t.language}/promocode/${t.slug}`;
    });

    return generateFullMetadata(
      title,
      description,
      url,
      ogImage,
      "article",
      locale,
      "",
      languageAlternates
    );
  } catch {
    return {};
  }
}

export const revalidate = 1800;

export default async function PromocodeDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  if (!isValidLanguage(locale)) {
    notFound();
  }

  // 410 Gone check
  if (isGone("promocode", slug)) {
    const messages = await getMessages();
    return <NotFoundUI locale={locale} messages={messages} statusCode="410" />;
  }

  // Fetch promocode by slug and language
  let promocodeDataArray;
  let promocodeData;
  let updatedPromocodeData;
  let relatedPromocodesData;
  let promocode: {
    id: string;
    type: "code" | "link";
    code: string | null;
    link: string | null;
    discountType: "percent" | "amount";
    discountValue: number;
    currency?: "UZS" | "USD" | "EUR";
    imageUrl?: string | null;
    status: PromocodeStatus;
    isFeatured: boolean;
    viewsCount: number;
    copyCount: number;
    likesCount: number;
    dislikesCount: number;
    startsAt: string | null;
    expiresAt: string | null;
    translations: Array<{
      language: string;
      title: string;
      slug: string;
      conditions?: string | null;
    }>;
    store: {
      id?: string;
      logoUrl?: string | null;
      websiteUrl?: string | null;
      translations: Array<{
        language: string;
        name: string;
        slug: string;
      }>;
    } | null;
    brand?: {
      id?: string;
      imageUrl?: string | null;
      websiteUrl?: string | null;
      translations: Array<{
        language: string;
        name: string;
        slug: string;
      }>;
    } | null;
    category?: {
      id?: string;
      imageUrl?: string | null;
      translations: Array<{
        language: string;
        name: string;
        slug: string;
      }>;
    } | null;
  };
  let relatedPromocodes: Array<{
    id: string;
    type: "code" | "link";
    code: string | null;
    link: string | null;
    discountType: "percent" | "amount";
    discountValue: number;
    currency?: "UZS" | "USD" | "EUR";
    originalPrice?: number | null;
    imageUrl?: string | null;
    status: PromocodeStatus;
    isFeatured: boolean;
    viewsCount: number;
    copyCount: number;
    likesCount: number;
    dislikesCount: number;
    expiresAt: string | null;
    translations: Array<{
      language: string;
      title: string;
      slug: string;
    }>;
    store: {
      id?: string;
      logoUrl?: string | null;
      websiteUrl?: string | null;
      translations: Array<{
        language: string;
        name: string;
        slug: string;
      }>;
    } | null;
    brand?: {
      id?: string;
      imageUrl?: string | null;
      websiteUrl?: string | null;
      translations: Array<{
        language: string;
        name: string;
        slug: string;
      }>;
    } | null;
    category?: {
      id?: string;
      imageUrl?: string | null;
      translations: Array<{
        language: string;
        name: string;
        slug: string;
      }>;
    } | null;
  }>;

  try {
    const now = new Date();
    promocodeDataArray = await db
      .select({
        promocode: promocodes,
        store: stores,
        storeTranslation: storeTranslations,
        brand: brands,
        brandTranslation: brandTranslations,
        category: categories,
        categoryTranslation: categoryTranslations,
        promocodeTranslation: promocodeTranslations,
      })
      .from(promocodes)
      .leftJoin(stores, eq(promocodes.storeId, stores.id))
      .leftJoin(categories, eq(promocodes.categoryId, categories.id))
      .leftJoin(brands, eq(promocodes.brandId, brands.id))
      .innerJoin(
        promocodeTranslations,
        and(
          eq(promocodeTranslations.promocodeId, promocodes.id),
          eq(promocodeTranslations.language, locale as "uz" | "ru" | "en"),
          eq(promocodeTranslations.slug, slug)
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
      .leftJoin(
        categoryTranslations,
        and(
          eq(categoryTranslations.categoryId, categories.id),
          eq(categoryTranslations.language, locale as "uz" | "ru" | "en")
        )
      )
      .where(
        and(
          eq(promocodeTranslations.slug, slug),
          eq(promocodeTranslations.language, locale as "uz" | "ru" | "en"),
          or(isNull(promocodes.storeId), eq(stores.isActive, true))
          // Note: Allow viewing expired/disabled promocodes for historical purposes
        )
      )
      .limit(1);

    promocodeData = promocodeDataArray[0];

    if (!promocodeData) {
      // Check if slug exists in another language
      const [altSlug] = await db
        .select({
          promocodeId: promocodeTranslations.promocodeId,
          language: promocodeTranslations.language,
        })
        .from(promocodeTranslations)
        .innerJoin(promocodes, eq(promocodeTranslations.promocodeId, promocodes.id))
        .leftJoin(stores, eq(promocodes.storeId, stores.id))
        .where(
          and(
            eq(promocodeTranslations.slug, slug),
            or(isNull(promocodes.storeId), eq(stores.isActive, true))
            // Note: Allow viewing expired/disabled promocodes for historical purposes
          )
        )
        .limit(1);

      if (altSlug) {
        // Find correct slug for current locale
        const [correctTranslation] = await db
          .select({ slug: promocodeTranslations.slug })
          .from(promocodeTranslations)
          .where(
            and(
              eq(promocodeTranslations.promocodeId, altSlug.promocodeId),
              eq(promocodeTranslations.language, locale as "uz" | "ru" | "en")
            )
          )
          .limit(1);

        if (correctTranslation) {
          redirect(`/${locale}/promocode/${correctTranslation.slug}`);
        }
      }

      console.error(`Promocode not found: slug=${slug}, locale=${locale}`);
      notFound();
    }

    updatedPromocodeData = promocodeData;

    // Fetch related promocodes (same store or category, limit 4)
    relatedPromocodesData = await db
      .select({
        promocode: promocodes,
        store: stores,
        storeTranslation: storeTranslations,
        brand: brands,
        brandTranslation: brandTranslations,
        category: categories,
        categoryTranslation: categoryTranslations,
        promocodeTranslation: promocodeTranslations,
      })
      .from(promocodes)
      .leftJoin(stores, eq(promocodes.storeId, stores.id))
      .leftJoin(categories, eq(promocodes.categoryId, categories.id))
      .leftJoin(brands, eq(promocodes.brandId, brands.id))
      .innerJoin(
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
        categoryTranslations,
        and(
          eq(categoryTranslations.categoryId, categories.id),
          eq(categoryTranslations.language, locale as "uz" | "ru" | "en")
        )
      )
      .leftJoin(
        brandTranslations,
        and(
          eq(brandTranslations.brandId, brands.id),
          eq(brandTranslations.language, locale as "uz" | "ru" | "en")
        )
      )
      .where(
        and(
          ne(promocodes.id, updatedPromocodeData.promocode.id),
          eq(promocodes.status, "active"),
          or(isNull(promocodes.storeId), eq(stores.isActive, true)),
          or(isNull(promocodes.expiresAt), gt(promocodes.expiresAt, now)),
          or(isNull(promocodes.startsAt), lte(promocodes.startsAt, now)),
          or(
            updatedPromocodeData.promocode.storeId
              ? eq(promocodes.storeId, updatedPromocodeData.promocode.storeId)
              : sql`false`, // If no store, don't match by store
            updatedPromocodeData.promocode.categoryId
              ? eq(promocodes.categoryId, updatedPromocodeData.promocode.categoryId)
              : sql`false`
          )
        )
      )
      .orderBy(desc(promocodes.isFeatured), desc(promocodes.createdAt))
      .limit(4);

    // Transform data to match component expectations
    promocode = {
      id: updatedPromocodeData.promocode.id,
      type: updatedPromocodeData.promocode.type as "code" | "link",
      code: updatedPromocodeData.promocode.code,
      link: updatedPromocodeData.promocode.link,
      discountType: updatedPromocodeData.promocode.discountType,
      discountValue: updatedPromocodeData.promocode.discountValue,
      currency: updatedPromocodeData.promocode.currency,
      imageUrl:
        updatedPromocodeData.promocode.imageUrl ||
        updatedPromocodeData.store?.logoUrl ||
        updatedPromocodeData.brand?.imageUrl ||
        updatedPromocodeData.category?.imageUrl ||
        null,
      isFeatured: updatedPromocodeData.promocode.isFeatured,
      status: updatedPromocodeData.promocode.status,
      viewsCount: updatedPromocodeData.promocode.viewsCount,
      copyCount: updatedPromocodeData.promocode.copyCount,
      likesCount: updatedPromocodeData.promocode.likesCount,
      dislikesCount: updatedPromocodeData.promocode.dislikesCount,
      startsAt: updatedPromocodeData.promocode.startsAt?.toISOString() || null,
      expiresAt: updatedPromocodeData.promocode.expiresAt?.toISOString() || null,
      translations: updatedPromocodeData.promocodeTranslation
        ? [
            {
              ...updatedPromocodeData.promocodeTranslation,
              slug: updatedPromocodeData.promocodeTranslation.slug,
            },
          ]
        : [],
      store: updatedPromocodeData.store
        ? {
            id: updatedPromocodeData.store.id,
            logoUrl: updatedPromocodeData.store.logoUrl,
            websiteUrl: updatedPromocodeData.store.websiteUrl,
            translations: updatedPromocodeData.storeTranslation
              ? [updatedPromocodeData.storeTranslation]
              : [],
          }
        : null,
      brand: updatedPromocodeData.brand
        ? {
            id: updatedPromocodeData.brand.id,
            imageUrl: updatedPromocodeData.brand.imageUrl,
            websiteUrl: updatedPromocodeData.brand.websiteUrl,
            translations: updatedPromocodeData.brandTranslation
              ? [
                  {
                    language: updatedPromocodeData.brandTranslation.language,
                    name: updatedPromocodeData.brandTranslation.name,
                    slug: updatedPromocodeData.brandTranslation.slug,
                  },
                ]
              : [],
          }
        : null,
      category:
        updatedPromocodeData.category && updatedPromocodeData.categoryTranslation
          ? {
              id: updatedPromocodeData.category.id,
              imageUrl: updatedPromocodeData.category.imageUrl,
              translations: [updatedPromocodeData.categoryTranslation],
            }
          : null,
    };

    // Transform related promocodes
    relatedPromocodes = relatedPromocodesData.map((row) => ({
      id: row.promocode.id,
      type: row.promocode.type as "code" | "link",
      code: row.promocode.code,
      link: row.promocode.link,
      discountType: row.promocode.discountType,
      discountValue: row.promocode.discountValue,
      currency: row.promocode.currency,
      originalPrice:
        "originalPrice" in row.promocode
          ? ((row.promocode as { originalPrice?: number | null }).originalPrice ?? null)
          : null,
      imageUrl:
        "imageUrl" in row.promocode
          ? ((row.promocode as { imageUrl?: string | null }).imageUrl ?? null)
          : null,
      isFeatured: row.promocode.isFeatured,
      status: row.promocode.status,
      viewsCount: row.promocode.viewsCount,
      copyCount: row.promocode.copyCount,
      likesCount: row.promocode.likesCount,
      dislikesCount: row.promocode.dislikesCount,
      expiresAt: row.promocode.expiresAt?.toISOString() || null,
      translations: row.promocodeTranslation
        ? [{ ...row.promocodeTranslation, slug: row.promocodeTranslation.slug }]
        : [],
      store: row.store
        ? {
            id: row.store.id,
            logoUrl: row.store.logoUrl,
            websiteUrl: row.store.websiteUrl,
            translations: row.storeTranslation
              ? [{ ...row.storeTranslation, slug: row.storeTranslation.slug }]
              : [],
          }
        : null,
      brand: row.brand
        ? {
            id: row.brand.id,
            imageUrl: row.brand.imageUrl,
            websiteUrl: row.brand.websiteUrl,
            translations: row.brandTranslation
              ? [
                  {
                    language: row.brandTranslation.language,
                    name: row.brandTranslation.name,
                    slug: row.brandTranslation.slug,
                  },
                ]
              : [],
          }
        : null,
      category:
        row.category && row.categoryTranslation
          ? {
              id: row.category.id,
              imageUrl: row.category.imageUrl,
              translations: [{ ...row.categoryTranslation, slug: row.categoryTranslation.slug }],
            }
          : null,
    }));

    // Build breadcrumbs with full hierarchy
    const [tCommon, tPromocode, tCard, tStore, tBrand] = await Promise.all([
      getTranslations({ locale, namespace: "common" }),
      getTranslations({ locale, namespace: "promocode" }),
      getTranslations({ locale, namespace: "card" }),
      getTranslations({ locale, namespace: "store" }),
      getTranslations({ locale, namespace: "brand" }),
    ]);

    const breadcrumbItems = [
      promocode.store
        ? { name: tCommon("stores"), url: `/stores` }
        : { name: tCommon("brands"), url: `/brands` },
      promocode.store
        ? {
            name: updatedPromocodeData.storeTranslation?.name || tStore("title"),
            url: `/store/${updatedPromocodeData.storeTranslation?.slug || ""}`,
          }
        : {
            name: promocode.brand?.translations?.[0]?.name || tBrand("title"),
            url: `/brand/${promocode.brand?.translations?.[0]?.slug || ""}`,
          },
    ];

    breadcrumbItems.push({
      name: updatedPromocodeData.promocodeTranslation?.title || tPromocode("title"),
      url: `/promocode/${slug}`,
    });

    // Calculate aggregate rating from likes/dislikes
    const totalVotes = promocode.likesCount + promocode.dislikesCount;
    const ratingValue =
      totalVotes > 0
        ? ((promocode.likesCount * 5 + promocode.dislikesCount * 1) / totalVotes).toFixed(1)
        : null;

    const rating = ratingValue
      ? {
          ratingValue: parseFloat(ratingValue),
          reviewCount: totalVotes,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined;
    const contextualLinks = [
      promocode.store?.translations?.[0]?.slug
        ? {
            label: `${tCommon("stores")}: ${promocode.store.translations[0].name}`,
            href: `/store/${promocode.store.translations[0].slug}`,
            type: "store",
          }
        : null,
      promocode.brand?.translations?.[0]?.slug
        ? {
            label: `${tCommon("brands")}: ${promocode.brand.translations[0].name}`,
            href: `/brand/${promocode.brand.translations[0].slug}`,
            type: "brand",
          }
        : null,
      promocode.category?.translations?.[0]?.slug
        ? {
            label: `${tCommon("categories")}: ${promocode.category.translations[0].name}`,
            href: `/category/${promocode.category.translations[0].slug}`,
            type: "category",
          }
        : null,
    ].filter(Boolean) as Array<{ label: string; href: string; type: string }>;

    return (
      <>
        <BreadcrumbsSchema items={breadcrumbItems} locale={locale} />
        <StructuredData
          type="Promocode"
          data={promocode}
          lang={locale}
          baseUrl={getBaseUrl()}
          rating={rating}
          datePublished={updatedPromocodeData.promocode.createdAt?.toISOString() ?? undefined}
          dateModified={
            updatedPromocodeData.promocode.updatedAt?.toISOString() ??
            updatedPromocodeData.promocode.createdAt?.toISOString() ??
            new Date().toISOString()
          }
        />
        <HowToSchema
          promocodeTitle={updatedPromocodeData.promocodeTranslation?.title || tPromocode("title")}
          storeName={updatedPromocodeData.storeTranslation?.name || tStore("title")}
          locale={locale}
          imageUrl={promocode.imageUrl || promocode.store?.logoUrl || "/icon.png"}
          baseUrl={getBaseUrl()}
        />
        <div className="container mx-auto px-6 pt-6 lg:px-8">
          <Breadcrumbs items={breadcrumbItems} homeName={tCommon("home")} />
        </div>
        <PromocodeDetail
          promocode={promocode}
          relatedPromocodes={relatedPromocodes}
          contextualLinks={contextualLinks}
          lang={locale as Language}
          translations={{
            promocode: {
              title: tPromocode("title"),
              activateLink: tPromocode("activateLink"),
              codeCopied: tPromocode("codeCopied"),
              copied: tPromocode("copied"),
              copies: tPromocode("copies"),
              copyCode: tPromocode("copyCode"),
              copyError: tPromocode("copyError"),
              discount: tPromocode("discount"),
              expiresOn: tPromocode("expiresOn"),
              linkActivated: tPromocode("linkActivated"),
              promoCode: tPromocode("promoCode"),
              promoLink: tPromocode("promoLink"),
              redirecting: tPromocode("redirecting"),
              relatedOffers: tPromocode("relatedOffers"),
              views: tPromocode("views"),
              daysRemaining: tPromocode("daysRemaining"),
              expiryDate: tPromocode("expiryDate"),
              expired: tPromocode("expired"),
              share: tPromocode("share"),
              terms: tPromocode("terms"),
              amount: tPromocode("amount"),
              percentage: tPromocode("percentage"),
            },
            common: {
              featured: tCommon("featured"),
            },
            card: {
              activateLink: tCard("activateLink"),
              copied: tCard("copied"),
              copy: tCard("copy"),
              details: tCard("details"),
              viewDetails: tCard("viewDetails"),
              dislike: tCard("dislike"),
              endingSoon: tPromocode("expiresSoon"),
              featured: tCard("featured"),
              fresh: tCard("fresh"),
              getDeal: tCard("getDeal"),
              like: tCard("like"),
              popular: tCard("popular"),
              storeOffer: tCard("storeOffer"),
              brandOffer: tCard("brandOffer"),
              directDeal: tCard("directDeal"),
              codeReady: tCard("codeReady"),
              dealRoute: tCard("dealRoute"),
              promoCodeLabel: tCard("promoCodeLabel"),
              unknownStore: tCard("unknownStore"),
              storeTitle: tStore("title"),
              promocodeTitle: tPromocode("title"),
              unlimited: tCard("unlimited"),
              verified: tCard("verified"),
              codeCopied: tPromocode("codeCopied"),
              copyError: tPromocode("copyError"),
              expired: tCard("expired"),
              disabled: tCard("disabled"),
            },
          }}
        />
      </>
    );
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    console.error("Error fetching promocode:", errorObj);
    console.error("Error details:", errorObj.message);
    console.error("Promocode slug:", slug);
    console.error("Language:", locale);
    notFound();
  }
}
