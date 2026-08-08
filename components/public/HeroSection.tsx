import SearchBar from "@/components/public/SearchBar";
import { getTranslations } from "next-intl/server";

interface HeroSectionProps {
  locale: string;
  searchParams?: Record<string, string>;
  searchBarNavigationMode?: "live" | "submit";
  searchBarTargetPath?: string;
}

export default async function HeroSection({
  locale,
  searchParams,
  searchBarNavigationMode = "live",
  searchBarTargetPath,
}: HeroSectionProps) {
  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <section className="brand-hero relative overflow-hidden">
      <div className="page-shell pt-10 pb-6 md:pt-16 md:pb-8 lg:pt-20 lg:pb-10">
        <div className="brand-hero-panel mx-auto max-w-6xl">
          <div className="relative max-w-3xl p-6 text-left sm:p-8 md:p-12">
            <div className="brand-kicker mb-5" translate="no">
              PromoBozor
            </div>

            <h1 className="mb-4 max-w-[18ch] text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl lg:text-[3.75rem] lg:leading-[1.08]">
              {t("title")}
            </h1>
            <p className="text-muted-foreground mb-8 max-w-[42ch] text-base leading-7 text-pretty sm:text-lg">
              {t("subtitle")}
            </p>

            <div className="max-w-xl">
              <SearchBar
                currentParams={searchParams}
                navigationMode={searchBarNavigationMode}
                targetPath={searchBarTargetPath}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
