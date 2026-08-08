import FeaturedPromocodes from "@/components/home/FeaturedPromocodes";
import { HomeFAQSection } from "@/components/home/HomeFAQSection";
import { HomeEditorialGuide } from "@/components/home/HomeEditorialGuide";
import { HomeIntentRoutes } from "@/components/home/HomeIntentRoutes";
import PopularStoresCategories from "@/components/home/PopularStoresCategories";
import HeroSection from "@/components/public/HeroSection";
import { OrganizationSchema } from "@/components/public/OrganizationSchema";
import StructuredData from "@/components/public/StructuredData";
import { SkeletonCardGrid, SkeletonPopularSection } from "@/components/ui/skeleton-card";
import { isValidLanguage } from "@/lib/i18n";
import { generateFullMetadata, getBaseUrl } from "@/lib/metadata";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

// ISR: Revalidate every 5 minutes (300 seconds) - increased for better performance
export const revalidate = 1800;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;

  if (!isValidLanguage(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "meta" });

  const title = t("defaultTitle");
  const description = t("defaultDescription");
  const url = `/${locale}`;

  const hasFilters = Object.keys(resolvedSearchParams).length > 0;

  return {
    ...generateFullMetadata(title, description, url, undefined, "website", locale, "/"),
    title: {
      absolute: title,
    },
    ...(hasFilters && {
      robots: { index: false, follow: true },
    }),
  };
}

export default async function HomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    storeId?: string;
    categoryId?: string;
    brandId?: string;
    search?: string;
    sortBy?: string;
  }>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;

  if (!isValidLanguage(locale)) {
    notFound();
  }

  const baseUrl = getBaseUrl();
  const hasFilters = Object.keys(resolvedSearchParams).length > 0;
  if (hasFilters) {
    const params = new URLSearchParams();
    Object.entries(resolvedSearchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        params.set(key, value);
      }
    });
    const queryString = params.toString();
    redirect(queryString ? `/${locale}/promocodes?${queryString}` : `/${locale}/promocodes`);
  }

  return (
    <>
      {/* Only render schema on indexable pages (no filters applied) */}
      {!hasFilters && (
        <>
          <StructuredData type="Homepage" data={{}} lang={locale} baseUrl={baseUrl} />
          <OrganizationSchema
            name="PromoBozor"
            description="PromoBozor foydalanuvchilarga online do'konlar va servislar uchun foydali chegirmalar, promokodlar va kuponlarni bir joyda topishga yordam beradigan zamonaviy platforma."
            sameAs={[
              "https://t.me/promokoduz_app",
              "https://instagram.com/promokoduz_app",
              "https://www.youtube.com/@promokoduz_app",
            ]}
            contactPoint={{
              email: "jahongirergawev2@gmail.com",
              contactType: "customer service",
            }}
          />
        </>
      )}
      <div>
        {/* Hero Section - Static content, renders immediately */}
        <HeroSection
          locale={locale}
          searchParams={resolvedSearchParams as Record<string, string>}
          searchBarNavigationMode="submit"
          searchBarTargetPath="/promocodes"
        />

        <div className="page-shell space-y-0">
          <HomeIntentRoutes locale={locale} />

          {/* Featured Section - Streaming */}
          <Suspense
            fallback={
              <div className="section-rhythm">
                <SkeletonCardGrid count={3} />
              </div>
            }
          >
            <FeaturedPromocodes locale={locale} />
          </Suspense>

          {/* Popular Stores & Categories - Internal linking */}
          <Suspense fallback={<SkeletonPopularSection />}>
            <PopularStoresCategories locale={locale} />
          </Suspense>

          <HomeEditorialGuide locale={locale} />

          {/* FAQ Section with localized content */}
          <HomeFAQSection locale={locale} />
        </div>
      </div>
    </>
  );
}
