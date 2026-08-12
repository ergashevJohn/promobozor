import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { HowToSection } from "@/components/public/HowToSection";
import PromocodeDetail from "@/components/public/PromocodeDetail";
import { db, promocodeTranslations, promocodes, stores, storeTranslations } from "@/lib/db";
import { isValidLanguage, type Language } from "@/lib/i18n";
import {
  generateFullMetadata,
  generateOgImageUrl,
  generatePromocodeDescription,
  generatePromocodeTitle,
  getBaseUrl,
} from "@/lib/metadata";
import { getMessages, getTranslations } from "next-intl/server";
import { and, eq, gt, isNull, lte, or } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound, redirect, unstable_rethrow } from "next/navigation";
import { isGone } from "@/lib/redirects";
import { NotFoundUI } from "@/components/public/NotFoundUI";
import { fetchPromocodeData, fetchRelatedPromocodes, findRedirectUrl } from "./helpers";
import { PromocodeMetadata } from "./PromocodeMetadata";
import {
  calculateRating,
  transformPromocodeData,
  transformRelatedPromocodes,
  type TransformedPromocode,
  type PromocodeDataRow,
} from "./transformers";

export async function generateStaticParams() {
  // Skip static generation for promocodes - render dynamically
  return [];
}

export const revalidate = 1800;

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

  let promocodeData: PromocodeDataRow | null = null;
  let relatedPromocodes: TransformedPromocode[] = [];
  let shouldRedirect = false;
  let redirectUrl: string | null = null;
  let promocode: TransformedPromocode | null = null;

  try {
    // Fetch promocode data
    promocodeData = await fetchPromocodeData(slug, locale as "uz" | "ru" | "en");

    if (!promocodeData) {
      // Check if slug exists in another language and redirect
      redirectUrl = await findRedirectUrl(slug, locale as "uz" | "ru" | "en");
      if (redirectUrl) {
        shouldRedirect = true;
      }
    } else {
      // Transform promocode data
      promocode = transformPromocodeData(promocodeData);

      // Fetch related promocodes
      const relatedPromocodesData = await fetchRelatedPromocodes(
        promocodeData.promocode.id,
        promocodeData.promocode.storeId,
        promocodeData.promocode.categoryId,
        locale as "uz" | "ru" | "en"
      );

      relatedPromocodes = transformRelatedPromocodes(relatedPromocodesData);

      // Load translations
      const [tCommon, tPromocode, tCard, tStore, tBrand] = await Promise.all([
        getTranslations({ locale, namespace: "common" }),
        getTranslations({ locale, namespace: "promocode" }),
        getTranslations({ locale, namespace: "card" }),
        getTranslations({ locale, namespace: "store" }),
        getTranslations({ locale, namespace: "brand" }),
      ]);

      // Build breadcrumbs
      const breadcrumbItems = [
        promocode.store
          ? { name: tCommon("stores"), url: `/stores` }
          : { name: tCommon("brands"), url: `/brands` },
        promocode.store
          ? {
              name: promocodeData.storeTranslation?.name || tStore("title"),
              url: `/store/${promocodeData.storeTranslation?.slug || ""}`,
            }
          : {
              name: promocode.brand?.translations?.[0]?.name || tBrand("title"),
              url: `/brand/${promocode.brand?.translations?.[0]?.slug || ""}`,
            },
        {
          name: promocodeData.promocodeTranslation?.title || tPromocode("title"),
          url: `/promocode/${slug}`,
        },
      ];

      // Calculate rating
      const rating = calculateRating(promocode.likesCount, promocode.dislikesCount);

      // Build contextual links
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
          <PromocodeMetadata
            promocode={promocode}
            promocodeTranslation={promocodeData.promocodeTranslation}
            storeTranslation={promocodeData.storeTranslation}
            breadcrumbItems={breadcrumbItems}
            locale={locale}
            baseUrl={getBaseUrl()}
            rating={rating}
            createdAt={promocodeData.promocode.createdAt?.toISOString()}
            updatedAt={
              promocodeData.promocode.updatedAt?.toISOString() ??
              promocodeData.promocode.createdAt?.toISOString()
            }
            tPromocode={{ title: tPromocode("title") }}
            tStore={{ title: tStore("title") }}
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
                proofKicker: tPromocode("proofKicker"),
                proofDescription: tPromocode("proofDescription"),
                discountLabel: tPromocode("discountLabel"),
                exploreKicker: tPromocode("exploreKicker"),
                exploreDescription: tPromocode("exploreDescription"),
                relatedDealsKicker: tPromocode("relatedDealsKicker"),
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
          {(() => {
            const nowMs = Date.now();
            const expiresAt = promocodeData.promocode.expiresAt;
            const startsAt = promocodeData.promocode.startsAt;
            const isActiveOffer =
              promocodeData.promocode.status === "active" &&
              (!expiresAt || expiresAt.getTime() > nowMs) &&
              (!startsAt || startsAt.getTime() <= nowMs);

            if (!isActiveOffer) {
              return null;
            }

            return (
              <div className="page-shell pb-12">
                <HowToSection
                  promocodeTitle={promocodeData.promocodeTranslation?.title || tPromocode("title")}
                  storeName={promocodeData.storeTranslation?.name || tStore("title")}
                  locale={locale}
                  imageUrl={promocode.imageUrl || promocode.store?.logoUrl || "/icon.png"}
                  baseUrl={getBaseUrl()}
                  title={tPromocode("howToTitle")}
                />
              </div>
            );
          })()}
        </>
      );
    }
  } catch (error) {
    unstable_rethrow(error);
    const errorObj = error instanceof Error ? error : new Error(String(error));
    console.error("Error fetching promocode:", errorObj);
    console.error("Error details:", errorObj.message);
    console.error("Promocode slug:", slug);
    console.error("Language:", locale);
    notFound();
  }

  // Handle redirect outside try-catch
  if (shouldRedirect && redirectUrl) {
    redirect(redirectUrl);
  }

  // Handle not found outside try-catch
  if (!promocodeData) {
    console.error(`Promocode not found: slug=${slug}, locale=${locale}`);
    notFound();
  }
}
