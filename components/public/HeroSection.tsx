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
    <section className="brand-hero relative overflow-hidden">
      <div className="page-shell py-10 md:py-16 lg:py-20">
        <div className="ticket-stub mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-[1.15fr_auto_0.85fr]">
            <div className="relative p-6 text-left sm:p-8 md:p-12">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <div className="brand-kicker" translate="no">
                  PromoBozor
                </div>
                <span className="coral-stamp">{t("heroInsight.label")}</span>
              </div>

              <h1 className="mb-4 max-w-[18ch] text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl lg:text-[4rem] lg:leading-[1.05]">
                {t("title")}
              </h1>
              <p className="text-muted-foreground mb-8 max-w-[42ch] text-base leading-7 text-pretty sm:text-lg md:text-xl md:leading-8">
                {t("subtitle")}
              </p>

              <div className="max-w-xl">
                <SearchBar
                  currentParams={searchParams}
                  navigationMode={searchBarNavigationMode}
                  targetPath={searchBarTargetPath}
                />
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {quickLinks.slice(0, 4).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="border-border text-muted-foreground hover:border-[color:var(--accent-red)]/40 hover:text-foreground inline-flex min-h-11 items-center rounded-full border bg-card/80 px-4 py-2 text-sm font-medium transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div
              className="ticket-perforation hidden w-6 self-stretch lg:block"
              aria-hidden="true"
            />

            <div className="border-border relative flex flex-col justify-between gap-6 border-t p-6 sm:p-8 lg:border-t-0 lg:p-10">
              <div className="ink-surface rounded-[1.25rem] p-5 sm:p-6">
                <div className="mb-2 text-xs font-semibold tracking-[0.16em] text-white/55 uppercase">
                  {t("heroInsight.label")}
                </div>
                <div className="text-xl font-semibold text-balance sm:text-2xl">
                  {t("heroInsight.title")}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {insightTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-white/10 px-2.5 py-1 text-xs text-white/75"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div className="metric-card">
                  <div className="text-muted-foreground text-sm">{t("heroCards.focus.label")}</div>
                  <div className="mt-1 text-lg font-semibold">{t("heroCards.focus.title")}</div>
                </div>
                <div className="metric-card">
                  <div className="text-muted-foreground text-sm">{t("heroCards.cta.label")}</div>
                  <div className="mt-1 text-lg font-semibold">{t("heroCards.cta.title")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-8 flex max-w-6xl flex-wrap items-center gap-2 lg:mt-10">
          {trustPills.map((pill) => (
            <div key={pill} className="brand-chip">
              <span
                className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent-red)]"
                aria-hidden="true"
              />
              {pill}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
