import { Button } from "@/components/ui/button";
import { CtaIcon } from "@/components/ui/cta-icon";
import { Link } from "@/i18n/navigation";
import {
  ArrowRightIcon,
  QuestionIcon,
  ShieldWarningIcon,
  TicketIcon,
} from "@phosphor-icons/react/dist/ssr";
import { getTranslations } from "next-intl/server";

const icons = [TicketIcon, ShieldWarningIcon, QuestionIcon];

interface HomeEditorialGuideProps {
  locale: string;
}

export async function HomeEditorialGuide({ locale }: HomeEditorialGuideProps) {
  const t = await getTranslations({ locale, namespace: "home.overhaul.guide" });
  const items = (await t.raw("items")) as Array<{ title: string; description: string }>;

  return (
    <section className="my-14">
      <div className="bg-card relative overflow-hidden rounded-[32px] border border-[color:var(--border)] shadow-[0_28px_72px_-52px_rgba(17,24,39,0.4)]">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(232,78,66,0.1),transparent_42%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(232,78,66,0.18),transparent_42%)]"
          aria-hidden="true"
        />

        <div className="relative grid lg:grid-cols-2 lg:items-stretch">
          <div className="border-border flex flex-col px-6 py-8 md:px-8 md:py-10 lg:border-r lg:px-10">
            <div className="brand-kicker w-fit">{t("eyebrow")}</div>
            <h2 className="text-foreground mt-5 max-w-xl text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              {t("title")}
            </h2>
            <p className="text-muted-foreground mt-4 max-w-lg text-base leading-7 md:text-lg">
              {t("description")}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:mt-auto lg:pt-10">
              <Button asChild size="lg" className="group">
                <Link href="/how-we-verify-promocodes">
                  {t("primaryCta")}
                  <CtaIcon>
                    <ArrowRightIcon size={16} weight="light" />
                  </CtaIcon>
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="group">
                <Link href="/faq">
                  {t("secondaryCta")}
                  <CtaIcon>
                    <ArrowRightIcon size={16} weight="light" />
                  </CtaIcon>
                </Link>
              </Button>
            </div>
          </div>

          <ol className="divide-border flex h-full min-h-0 flex-col divide-y">
            {items.map((item, index) => {
              const Icon = icons[index % icons.length];
              const step = String(index + 1).padStart(2, "0");

              return (
                <li
                  key={item.title}
                  className="group flex min-h-0 flex-1 gap-4 px-6 py-6 md:gap-5 md:px-8 md:py-7"
                >
                  <div className="flex shrink-0 flex-col items-center gap-3">
                    <span className="text-xs font-semibold tracking-[0.16em] text-[color:var(--accent-red)]">
                      {step}
                    </span>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--secondary)] text-[color:var(--accent-red)] transition-colors group-hover:bg-[color:var(--accent-red)] group-hover:text-white">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center pt-0.5">
                    <h3 className="text-foreground text-lg leading-snug font-semibold">
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
