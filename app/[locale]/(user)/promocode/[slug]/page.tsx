import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { HowToSection } from "@/components/public/HowToSection";
import { NotFoundUI } from "@/components/public/NotFoundUI";
import PromocodeDetail from "@/components/public/PromocodeDetail";
import { VerifiedBadge } from "@/components/public/VerifiedBadge";
import { isValidLanguage, type Language } from "@/lib/i18n";
import {
  generateFullMetadata,
  generateOgImageUrl,
  generatePromocodeDescription,
  generatePromocodeTitle,
  getBaseUrl,
} from "@/lib/metadata";
import { getPromocodeStaticParams } from "@/lib/queries/entities";
import { isGone } from "@/lib/redirects";
import { getEntityPath, type Locale as RouteLocale } from "@/lib/routes";
import type { Metadata } from "next";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect, unstable_rethrow } from "next/navigation";
import {
  getCachedPromocodeData,
  getCachedPromocodeLanguageAlternates,
  getCachedPromocodeMetadataData,
  getCachedRedirectUrl,
  getCachedRelatedPromocodes,
} from "./helpers";
import { PromocodeMetadata } from "./PromocodeMetadata";
import {
  transformPromocodeData,
  transformRelatedPromocodes,
  type PromocodeDataRow,
  type TransformedPromocode,
} from "./transformers";

export async function generateStaticParams() {
  return getPromocodeStaticParams();
}

export const revalidate = 1800;
export const dynamicParams = true;

function toIsoOrUndefined(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  return value.toISOString();
}

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
    const promocodeData = await getCachedPromocodeMetadataData(slug, locale as "uz" | "ru" | "en");

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
        locale,
        translation?.shortDescription || null
      );

    const url = getEntityPath(locale as RouteLocale, "promocode", slug);

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
    const allTranslations = await getCachedPromocodeLanguageAlternates(promocode.id);

    const languageAlternates: Record<string, string> = {};
    allTranslations.forEach((t) => {
      languageAlternates[t.language] = getEntityPath(
        t.language as RouteLocale,
        "promocode",
        t.slug
      );
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
  setRequestLocale(locale);

  if (!isValidLanguage(locale)) {
    notFound();
  }

  // 410 Gone check
  if (isGone("promocode", slug)) {
    const messages = await getMessages({ locale });
    return <NotFoundUI locale={locale} messages={messages} statusCode="410" />;
  }

  let promocodeData: PromocodeDataRow | null = null;
  let relatedPromocodes: TransformedPromocode[] = [];
  let shouldRedirect = false;
  let redirectUrl: string | null = null;
  let promocode: TransformedPromocode | null = null;
  let isActiveOffer = false;

  try {
    // Fetch promocode data
    const cachedPage = await getCachedPromocodeData(slug, locale as "uz" | "ru" | "en");
    promocodeData = cachedPage?.data ?? null;
    isActiveOffer = cachedPage?.isActiveOffer ?? false;

    if (!promocodeData) {
      // Check if slug exists in another language and redirect
      redirectUrl = await getCachedRedirectUrl(slug, locale as "uz" | "ru" | "en");
      if (redirectUrl) {
        shouldRedirect = true;
      }
    } else {
      // Transform promocode data
      promocode = transformPromocodeData(promocodeData);

      // Fetch related promocodes
      const relatedPromocodesData = await getCachedRelatedPromocodes(
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
            createdAt={toIsoOrUndefined(promocodeData.promocode.createdAt)}
            updatedAt={
              toIsoOrUndefined(promocodeData.promocode.updatedAt) ??
              toIsoOrUndefined(promocodeData.promocode.createdAt)
            }
            tPromocode={{ title: tPromocode("title") }}
            tStore={{ title: tStore("title") }}
          />
          <div className="container mx-auto px-6 pt-6 lg:px-8">
            <Breadcrumbs locale={locale} items={breadcrumbItems} homeName={tCommon("home")} />
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
                editorVerdict: tPromocode("editorVerdict"),
                lastVerified: tPromocode("lastVerified"),
                shortDescription: tPromocode("shortDescription"),
                minOrder: tPromocode("minOrder"),
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
          <div className="page-shell pb-4">
            <VerifiedBadge
              verifiedAt={promocode.lastVerifiedAt}
              locale={locale}
              label={tPromocode("lastVerified")}
            />
          </div>
          {isActiveOffer ? (
            <div className="page-shell pb-12">
              <HowToSection
                promocodeTitle={promocodeData.promocodeTranslation?.title || tPromocode("title")}
                storeName={promocodeData.storeTranslation?.name || tStore("title")}
                locale={locale}
                imageUrl={promocode.imageUrl || promocode.store?.logoUrl || "/icon.png"}
                baseUrl={getBaseUrl()}
                title={tPromocode("howToTitle")}
                howToHtml={promocodeData.promocodeTranslation?.howToHtml}
              />
            </div>
          ) : null}
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
