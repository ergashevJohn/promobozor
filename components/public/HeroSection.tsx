import SearchBar from "@/components/public/SearchBar";
import { Link } from "@/i18n/navigation";
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
  const trustPills = (await t.raw("trustPills")) as string[];
  const insightTags = (await t.raw("heroInsight.tags")) as string[];
  const quickLinks = (await t.raw("overhaul.heroQuickLinks")) as Array<{
    label: string;
    href: string;
  }>;

  return (
    <div className="brand-hero border-border relative overflow-hidden border-b py-16 md:py-20">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="brand-panel relative mx-auto max-w-6xl overflow-hidden p-8 md:p-12">
          <div className="absolute top-0 right-0 h-44 w-44 rounded-full bg-[color:var(--accent-red)]/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-[color:var(--primary)]/8 blur-3xl" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="max-w-3xl">
              <div className="brand-kicker mb-6">PromoBozor</div>
              <h1 className="mb-4 text-4xl font-semibold tracking-tight text-balance md:text-6xl">
                {t("title")}
              </h1>
              <p className="text-muted-foreground mb-8 max-w-2xl text-lg leading-8 md:text-xl">
                {t("subtitle")}
              </p>
              <div className="flex justify-center lg:justify-start">
                <SearchBar
                  currentParams={searchParams}
                  navigationMode={searchBarNavigationMode}
                  targetPath={searchBarTargetPath}
                />
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-3 lg:justify-start">
                {trustPills.map((pill) => (
                  <div key={pill} className="brand-chip">
                    <span className="h-2 w-2 rounded-full bg-[color:var(--accent-red)]" />
                    {pill}
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                {quickLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full border border-[color:var(--border)] bg-white/92 px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition-colors hover:border-[color:var(--accent-red)]/40 hover:text-[color:var(--accent-red)]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[30px] border border-white/90 bg-[#111827] p-6 text-white shadow-[0_28px_80px_-48px_rgba(17,24,39,0.7)]">
                <div className="mb-3 text-sm font-medium text-white/70">
                  {t("heroInsight.label")}
                </div>
                <div className="text-2xl font-semibold">{t("heroInsight.title")}</div>
                <div className="mt-4 flex items-center gap-3 text-sm text-white/70">
                  {insightTags.map((tag) => (
                    <span key={tag} className="rounded-full bg-white/10 px-3 py-1">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[28px] border border-[color:var(--border)] bg-white p-5 shadow-[0_22px_56px_-44px_rgba(17,24,39,0.2)]">
                  <div className="text-muted-foreground text-sm">{t("heroCards.focus.label")}</div>
                  <div className="mt-2 text-lg font-semibold">{t("heroCards.focus.title")}</div>
                </div>
                <div className="rounded-[28px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,90,79,0.14),rgba(255,255,255,0.95))] p-5 shadow-[0_22px_56px_-44px_rgba(17,24,39,0.2)]">
                  <div className="text-muted-foreground text-sm">{t("heroCards.cta.label")}</div>
                  <div className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
                    {t("heroCards.cta.title")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
