import { CtaIcon } from "@/components/ui/cta-icon";
import { Link } from "@/i18n/navigation";
import {
  ArrowRightIcon,
  BuildingsIcon,
  MagnifyingGlassIcon,
  SquaresFourIcon,
  StorefrontIcon,
} from "@phosphor-icons/react/dist/ssr";
import { getTranslations } from "next-intl/server";

const icons = [MagnifyingGlassIcon, StorefrontIcon, SquaresFourIcon, BuildingsIcon];

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

  return (
    <section className="section-rhythm">
      <div className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl text-left">
          <h2 className="brand-section-heading text-left">{t("title")}</h2>
          <p className="text-muted-foreground mt-3 max-w-[55ch] text-base leading-7 md:text-lg">
            {t("description")}
          </p>
        </div>
        <Link
          href="/promocodes"
          className="group text-foreground inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-medium transition-colors hover:text-[color:var(--accent-red)]"
        >
          {t("cta")}
          <CtaIcon>
            <ArrowRightIcon size={16} weight="light" />
          </CtaIcon>
        </Link>
      </div>

      <div className="bg-card overflow-hidden rounded-[28px] border border-[color:var(--border)] shadow-[0_28px_72px_-52px_rgba(17,24,39,0.4)]">
        <ul className="grid md:grid-cols-2">
          {items.map((item, index) => {
            const Icon = icons[index % icons.length];
            const step = String(index + 1).padStart(2, "0");

            return (
              <li
                key={item.href}
                className="border-border border-b last:border-b-0 md:[&:nth-child(n+3)]:border-b-0 md:[&:nth-child(odd)]:border-r"
              >
                <Link
                  href={item.href}
                  className="group focus-visible:bg-accent flex h-full flex-col gap-5 p-6 transition-colors hover:bg-[color:var(--accent)]/50 focus-visible:outline-none md:p-7"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-xs font-semibold tracking-[0.16em] text-[color:var(--accent-red)]">
                      {step}
                    </span>
                    <span className="text-muted-foreground flex size-10 items-center justify-center rounded-xl bg-[color:var(--secondary)] transition-colors group-hover:bg-[color:var(--accent-red)] group-hover:text-white">
                      <Icon size={20} weight="light" aria-hidden="true" />
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-sm font-medium">{item.kicker}</p>
                    <h3 className="text-foreground mt-2 text-lg leading-snug font-semibold text-balance transition-colors group-hover:text-[color:var(--accent-red)] md:text-xl">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground mt-3 text-sm leading-6">
                      {item.description}
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--foreground)] transition-colors group-hover:text-[color:var(--accent-red)]">
                    <span>{t("cardCta")}</span>
                    <ArrowRightIcon
                      size={14}
                      weight="light"
                      className="transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
