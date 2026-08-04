import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Building2, CreditCard, Search, Store } from "lucide-react";
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

  const icons = [Search, Store, CreditCard, Building2];

  return (
    <section className="mt-10 mb-14">
      <div className="mb-6 flex flex-col gap-3 md:mb-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <div className="brand-kicker mb-3">{t("eyebrow")}</div>
          <h2 className="brand-section-heading text-left">{t("title")}</h2>
          <p className="text-muted-foreground mt-3 text-base leading-7 md:text-lg">
            {t("description")}
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/promocodes">
            {t("cta")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item, index) => {
          const Icon = icons[index % icons.length];
          return (
            <Link
              key={item.title}
              href={item.href}
              className="group rounded-[28px] border border-[color:var(--border)] bg-white p-5 shadow-[0_24px_60px_-44px_rgba(17,24,39,0.35)] transition-all duration-200 hover:-translate-y-1 hover:border-[color:var(--accent-red)]/40"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="text-xs font-semibold tracking-[0.16em] text-[color:var(--accent-red)] uppercase">
                    {item.kicker}
                  </div>
                  <div className="text-foreground text-xl leading-tight font-semibold">
                    {item.title}
                  </div>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent)] text-[color:var(--accent-red)]">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-muted-foreground mt-4 text-sm leading-6">{item.description}</p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--foreground)] transition-colors group-hover:text-[color:var(--accent-red)]">
                <span>{t("cardCta")}</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
