import { Button } from "@/components/ui/button";
import { CtaIcon } from "@/components/ui/cta-icon";
import { Link } from "@/i18n/navigation";
import {
  ArrowRight,
  Buildings,
  CreditCard,
  MagnifyingGlass,
  Storefront,
} from "@phosphor-icons/react/dist/ssr";
import { getTranslations } from "next-intl/server";

interface HomeIntentRoutesProps {
  locale: string;
}

export async function HomeIntentRoutes({ locale }: HomeIntentRoutesProps) {
  const t = await getTranslations({ locale, namespace: "home.overhaul.routes" });
  const items = (await t.raw("items")) as Array<{
    title: string;
    description: string;
    kicker: string;
    href: string;
  }>;

  const icons = [MagnifyingGlass, Storefront, CreditCard, Buildings];

  return (
    <section className="section-rhythm border-border border-b">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl text-left">
          <div className="brand-kicker mb-3">{t("eyebrow")}</div>
          <h2 className="brand-section-heading text-left">{t("title")}</h2>
          <p className="text-muted-foreground mt-3 max-w-[55ch] text-base leading-7 md:text-lg">
            {t("description")}
          </p>
        </div>
        <Button asChild variant="outline" className="group shrink-0">
          <Link href="/promocodes">
            {t("cta")}
            <CtaIcon>
              <ArrowRight size={16} weight="light" />
            </CtaIcon>
          </Link>
        </Button>
      </div>

      <div className="stagger-reveal grid gap-6 md:grid-cols-2 xl:grid-cols-[1.2fr_0.9fr_1.05fr_0.95fr]">
        {items.map((item, index) => {
          const Icon = icons[index % icons.length];
          return (
            <Link
              key={item.title}
              href={item.href}
              className="group metric-card transition-colors hover:border-[color:var(--accent-red)]/30"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="text-[10px] font-semibold tracking-[0.16em] text-[color:var(--accent-red)] uppercase">
                  {item.kicker}
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--accent)] text-[color:var(--accent-red)]">
                  <Icon size={20} weight="light" aria-hidden="true" />
                </div>
              </div>
              <div className="text-foreground text-xl leading-tight font-semibold">
                {item.title}
              </div>
              <p className="text-muted-foreground mt-3 text-sm leading-6">{item.description}</p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--foreground)] transition-colors group-hover:text-[color:var(--accent-red)]">
                <span>{t("cardCta")}</span>
                <ArrowRight size={14} weight="light" aria-hidden="true" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
