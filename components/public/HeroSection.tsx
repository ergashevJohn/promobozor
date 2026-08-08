import SearchBar from "@/components/public/SearchBar";
import { ArrowsClockwise, CheckCircle, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { getTranslations } from "next-intl/server";

interface HeroSectionProps {
  locale: string;
  searchParams?: Record<string, string>;
  searchBarNavigationMode?: "live" | "submit";
  searchBarTargetPath?: string;
}

const TRUST_ICONS = [CheckCircle, ArrowsClockwise, MagnifyingGlass] as const;

export default async function HeroSection({
  locale,
  searchParams,
  searchBarNavigationMode = "live",
  searchBarTargetPath,
}: HeroSectionProps) {
  const t = await getTranslations({ locale, namespace: "home" });
  const trustPills = (await t.raw("trustPills")) as string[];

  return (
    <section
      className="brand-hero relative -mt-[4.75rem] overflow-hidden pt-[4.75rem]"
      aria-labelledby="home-hero-heading"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute top-[-20%] left-1/2 h-[28rem] w-[42rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(232,78,66,0.14),transparent_68%)] blur-2xl dark:bg-[radial-gradient(ellipse_at_center,rgba(232,78,66,0.18),transparent_68%)]" />
        <div className="absolute bottom-[-30%] left-1/2 h-[22rem] w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(15,20,25,0.06),transparent_70%)] blur-2xl dark:bg-[radial-gradient(ellipse_at_center,rgba(248,250,252,0.05),transparent_70%)]" />
      </div>

      <div className="page-shell relative pt-14 pb-12 md:pt-20 md:pb-16 lg:pt-24 lg:pb-20">
        <div className="hero-copy mx-auto flex max-w-3xl flex-col items-center text-center">
          <p
            className="text-[clamp(2.75rem,8vw,5.25rem)] leading-[0.92] font-semibold tracking-[-0.05em]"
            translate="no"
          >
            Promo
            <span className="text-[color:var(--accent-red)]">Bozor</span>
          </p>

          <span
            className="mt-5 h-1 w-12 rounded-full bg-[color:var(--accent-red)]"
            aria-hidden="true"
          />

          <h1
            id="home-hero-heading"
            className="text-foreground mt-6 max-w-[22ch] text-2xl leading-[1.18] font-semibold tracking-tight text-balance sm:text-3xl md:text-[2.35rem] md:leading-[1.15]"
          >
            {t("title")}
          </h1>

          <p className="text-muted-foreground mt-4 max-w-[46ch] text-base leading-7 text-pretty sm:text-lg">
            {t("subtitle")}
          </p>

          <div className="mt-8 w-full max-w-xl md:mt-10">
            <SearchBar
              currentParams={searchParams}
              navigationMode={searchBarNavigationMode}
              targetPath={searchBarTargetPath}
            />
          </div>

          <ul className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-0 sm:gap-y-2">
            {trustPills.map((pill, index) => {
              const Icon = TRUST_ICONS[index % TRUST_ICONS.length];
              return (
                <li key={pill} className="inline-flex items-center">
                  {index > 0 && (
                    <span className="text-border mx-3 hidden sm:inline" aria-hidden="true">
                      ·
                    </span>
                  )}
                  <span className="text-muted-foreground inline-flex items-center gap-2 text-sm">
                    <Icon
                      className="size-4 shrink-0 text-[color:var(--accent-red)]"
                      weight="bold"
                      aria-hidden="true"
                    />
                    {pill}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
