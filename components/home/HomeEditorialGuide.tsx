import { Button } from "@/components/ui/button";
import { CtaIcon } from "@/components/ui/cta-icon";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Question, ShieldWarning, Ticket } from "@phosphor-icons/react/dist/ssr";
import { getTranslations } from "next-intl/server";

interface HomeEditorialGuideProps {
  locale: string;
}

export async function HomeEditorialGuide({ locale }: HomeEditorialGuideProps) {
  const t = await getTranslations({ locale, namespace: "home.overhaul.guide" });
  const items = (await t.raw("items")) as Array<{ title: string; description: string }>;
  const icons = [Ticket, ShieldWarning, Question];

  return (
    <section className="my-14">
      <div className="overflow-hidden rounded-[32px] border border-[color:var(--border)] bg-card shadow-[0_28px_72px_-52px_rgba(17,24,39,0.4)]">
        <div className="grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          {/* Intro — one dark plane, not a competing card wall */}
          <div className="ink-surface relative overflow-hidden px-6 py-8 md:px-8 md:py-10 lg:px-10">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(232,78,66,0.22),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_40%)]"
              aria-hidden="true"
            />
            <div className="relative flex h-full flex-col">
              <div className="brand-kicker border-white/10 bg-white/5 text-white">{t("eyebrow")}</div>
              <h2 className="mt-5 max-w-xl text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                {t("title")}
              </h2>
              <p className="mt-4 max-w-lg text-base leading-7 text-white/72 md:text-lg">
                {t("description")}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:mt-auto lg:pt-10">
                <Button asChild size="lg" className="group">
                  <Link href="/how-we-verify-promocodes">
                    {t("primaryCta")}
                    <CtaIcon className="bg-white/15">
                      <ArrowRight size={16} weight="light" />
                    </CtaIcon>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="group border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/faq">
                    {t("secondaryCta")}
                    <CtaIcon className="bg-white/10">
                      <ArrowRight size={16} weight="light" />
                    </CtaIcon>
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Steps — vertical list reads better than 3 cramped cards */}
          <ol className="divide-border flex flex-col divide-y bg-card">
            {items.map((item, index) => {
              const Icon = icons[index % icons.length];
              const step = String(index + 1).padStart(2, "0");

              return (
                <li key={item.title} className="group flex gap-4 px-6 py-6 md:gap-5 md:px-8 md:py-7">
                  <div className="flex shrink-0 flex-col items-center gap-3">
                    <span className="text-xs font-semibold tracking-[0.16em] text-[color:var(--accent-red)]">
                      {step}
                    </span>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent)] text-[color:var(--accent-red)] transition-colors group-hover:bg-[color:var(--accent-red)] group-hover:text-white">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <h3 className="text-foreground text-lg font-semibold leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground mt-2 text-sm leading-6 md:text-[0.95rem]">
                      {item.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
