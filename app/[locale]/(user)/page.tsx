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
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

// ISR: Revalidate every 30 minutes
export const revalidate = 1800;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!isValidLanguage(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "meta" });

  const title = t("defaultTitle");
  const description = t("defaultDescription");
  const url = `/${locale}`;

  return {
    ...generateFullMetadata(title, description, url, undefined, "website", locale, "/"),
    title: {
      absolute: title,
    },
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (!isValidLanguage(locale)) {
    notFound();
  }

  const baseUrl = getBaseUrl();

  return (
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
      <div>
        <HeroSection
          locale={locale}
          searchBarNavigationMode="submit"
          searchBarTargetPath="/promocodes"
        />

        <div className="page-shell space-y-0">
          <HomeIntentRoutes locale={locale} />

          <Suspense
            fallback={
              <div className="section-rhythm">
                <SkeletonCardGrid count={3} />
              </div>
            }
          >
            <FeaturedPromocodes locale={locale} />
          </Suspense>

          <Suspense fallback={<SkeletonPopularSection />}>
            <PopularStoresCategories locale={locale} />
          </Suspense>

          <HomeEditorialGuide locale={locale} />

          <HomeFAQSection locale={locale} />
        </div>
      </div>
    </>
  );
}
