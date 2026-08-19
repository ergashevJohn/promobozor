import { AboutCards } from "@/components/about/about-cards";
import { AboutContact } from "@/components/about/about-contact";
import { AboutFounder } from "@/components/about/about-founder";
import { AboutHero } from "@/components/about/about-hero";
import { AboutReasons } from "@/components/about/about-reasons";
import { AboutStats } from "@/components/about/about-stats";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { BreadcrumbsSchema } from "@/components/public/BreadcrumbsSchema";
import { PersonSchema } from "@/components/public/PersonSchema";
import { getCachedInventoryStats } from "@/lib/cache/inventory-stats";
import { isValidLanguage } from "@/lib/i18n";
import { generateFullMetadata, getBaseUrl } from "@/lib/metadata";
import {
  ArrowsClockwiseIcon,
  CheckCircleIcon,
  GlobeIcon,
  LightningIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!isValidLanguage(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "about" });

  const title = t("title");
  const description = t("description");
  const url = `/${locale}/about`;

  return generateFullMetadata(title, description, url, undefined, "website", locale, "/about");
}

export const revalidate = 3600;

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (!isValidLanguage(locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "about" });
  const tCommon = await getTranslations({ locale, namespace: "common" });
  const founderHighlights = (await t.raw("founder.highlights")) as string[];
  const founderExperience = (await t.raw("founder.experience")) as Array<{
    title: string;
    description: string;
  }>;
  const aboutUrl = `${getBaseUrl()}/${locale}/about`;

  const reasons = [
    { icon: CheckCircleIcon, title: t("reason1Title"), description: t("reason1Description") },
    { icon: ArrowsClockwiseIcon, title: t("reason2Title"), description: t("reason2Description") },
    { icon: LightningIcon, title: t("reason3Title"), description: t("reason3Description") },
    { icon: GlobeIcon, title: t("reason4Title"), description: t("reason4Description") },
  ];

  let storeCount = 0;
  let categoryCount = 0;
  let brandCount = 0;
  let promocodeCount = 0;

  try {
    const statsData = await getCachedInventoryStats();
    storeCount = statsData.storeCount;
    categoryCount = statsData.categoryCount;
    brandCount = statsData.brandCount;
    promocodeCount = statsData.promocodeCount;
  } catch (error) {
    console.error("Failed to load about-page inventory stats:", error);
  }

  const stats = [
    { label: t("statsStores"), value: String(storeCount) },
    { label: t("statsCategories"), value: String(categoryCount) },
    { label: t("statsBrands"), value: String(brandCount) },
    { label: t("statsPromocodes"), value: String(promocodeCount) },
  ];

  return (
    <>
      <PersonSchema
        name={t("founder.name")}
        jobTitle={t("founder.role")}
        url={aboutUrl}
        description={t("founder.bio")}
        sameAs={[
          "https://t.me/promokoduz_app",
          "https://instagram.com/promokoduz_app",
          "https://www.youtube.com/@promokoduz_app",
        ]}
        knowsAbout={[
          "Promocode verification",
          "E-commerce savings strategies",
          "Uzbekistan online shopping market",
          "Next.js and TypeScript development",
          "Full-stack web development",
          "Affiliate marketing optimization",
          "SEO and GEO (Generative Engine Optimization)",
        ]}
      />

      <div className="page-shell py-4">
        <Breadcrumbs
          locale={locale}
          items={[{ name: t("title"), url: "/about" }]}
          homeName={tCommon("home")}
        />
      </div>
      <BreadcrumbsSchema
        items={[
          { name: tCommon("home"), url: "/" },
          { name: t("title"), url: "/about" },
        ]}
        locale={locale}
      />

      <div className="page-shell py-12">
        {/* Hero */}
        <AboutHero
          heroKicker={t("heroKicker")}
          heroTitle={t("heroTitle")}
          heroDescription={t("heroDescription")}
        />

        {/* Mission & How We Work */}
        <AboutCards
          missionTitle={t("missionTitle")}
          missionDescription={t("missionDescription")}
          howWeWork={t("howWeWork")}
          howWeWorkDescription={t("howWeWorkDescription")}
        />

        {/* Stats */}
        <AboutStats statsTitle={t("statsTitle")} stats={stats} />

        {/* Why Us */}
        <AboutReasons whyUsTitle={t("whyUsTitle")} reasons={reasons} />

        {/* Founder */}
        <AboutFounder
          badge={t("founder.badge")}
          name={t("founder.name")}
          role={t("founder.role")}
          credentials={t.raw("founder.credentials") as string | undefined}
          bio={t("founder.bio")}
          quote={t("founder.quote")}
          highlightsTitle={t("founder.highlightsTitle")}
          highlights={founderHighlights}
          experienceTitle={t("founder.experienceTitle")}
          experience={founderExperience}
          cta={t("founder.cta")}
        />

        <p className="text-muted-foreground mx-auto mb-12 max-w-3xl text-center text-sm leading-7">
          {t("affiliateDisclosure")}
        </p>

        {/* Contact */}
        <AboutContact
          contactTitle={t("contactTitle")}
          contactDescription={t("contactDescription")}
        />
      </div>
    </>
  );
}
