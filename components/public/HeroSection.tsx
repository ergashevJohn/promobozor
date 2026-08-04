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
    <section className="brand-hero border-border relative overflow-hidden border-b">
      {/* Above the fold: brand + search (+ desktop insight) */}
      <div className="container mx-auto px-4 py-10 md:px-6 md:py-16 lg:px-8">
        <div className="brand-panel relative mx-auto max-w-6xl overflow-hidden p-6 md:p-12">
          <div className="absolute top-0 right-0 h-44 w-44 rounded-full bg-[color:var(--accent-red)]/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-[color:var(--primary)]/8 blur-3xl" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
            <div className="max-w-3xl text-center lg:text-left">
              <div className="brand-kicker mb-4 justify-center lg:justify-start md:mb-6">
                PromoBozor
              </div>
              <h1 className="mb-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-6xl">
                {t("title")}
              </h1>
              <p className="text-muted-foreground mb-6 max-w-2xl text-base leading-7 sm:text-lg md:mb-8 md:text-xl md:leading-8 lg:mx-0 mx-auto">
                {t("subtitle")}
              </p>
              <div className="mx-auto flex justify-center lg:mx-0 lg:justify-start">
                <SearchBar
                  currentParams={searchParams}
                  navigationMode={searchBarNavigationMode}
                  targetPath={searchBarTargetPath}
                />
              </div>
            </div>

            <div className="hidden gap-4 lg:grid">
              <div className="rounded-[30px] border border-white/90 bg-[#111827] p-6 text-white shadow-[0_28px_80px_-48px_rgba(17,24,39,0.7)]">
                <div className="mb-3 text-sm font-medium text-white/70">
                  {t("heroInsight.label")}
                </div>
                <div className="text-2xl font-semibold">{t("heroInsight.title")}</div>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/70">
                  {insightTags.map((tag) => (
                    <span key={tag} className="rounded-full bg-white/10 px-3 py-1">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[28px] border border-[color:var(--border)] bg-card p-5 shadow-[0_22px_56px_-44px_rgba(17,24,39,0.2)]">
                  <div className="text-muted-foreground text-sm">{t("heroCards.focus.label")}</div>
                  <div className="mt-2 text-lg font-semibold">{t("heroCards.focus.title")}</div>
                </div>
                <div className="rounded-[28px] border border-[color:var(--border)] bg-gradient-to-br from-[color:var(--accent)]/40 via-card to-[color:var(--secondary)] p-5 shadow-[0_22px_56px_-44px_rgba(17,24,39,0.2)]">
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

      {/* Below the fold on typical phones: trust + quick chips */}
      <div className="border-t border-[color:var(--border)]/70 bg-card/40">
        <div className="container mx-auto px-4 py-6 md:px-6 md:py-8 lg:px-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-4">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 lg:justify-start">
              {trustPills.map((pill) => (
                <div key={pill} className="brand-chip">
                  <span className="h-2 w-2 rounded-full bg-[color:var(--accent-red)]" />
                  {pill}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 lg:justify-start">
              {quickLinks.slice(0, 4).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-full border border-[color:var(--border)] bg-card/90 px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition-colors hover:border-[color:var(--accent-red)]/45 hover:text-[color:var(--accent-red)]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
