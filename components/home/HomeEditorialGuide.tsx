import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { ArrowRight, BadgeHelp, ShieldAlert, TicketPercent } from "lucide-react";
import { getTranslations } from "next-intl/server";

interface HomeEditorialGuideProps {
  locale: string;
}

export async function HomeEditorialGuide({ locale }: HomeEditorialGuideProps) {
  const t = await getTranslations({ locale, namespace: "home.overhaul.guide" });
  const items = (await t.raw("items")) as Array<{ title: string; description: string }>;
  const icons = [TicketPercent, ShieldAlert, BadgeHelp];

  return (
    <section className="my-14 grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
      <div className="rounded-[32px] bg-[#111827] p-6 text-white shadow-[0_30px_80px_-46px_rgba(17,24,39,0.72)] md:p-8">
        <div className="brand-kicker border-white/10 bg-white/5 text-white">{t("eyebrow")}</div>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">{t("title")}</h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-white/72 md:text-lg">
          {t("description")}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="rounded-full bg-[color:var(--accent-red)]">
            <Link href="/how-we-verify-promocodes">
              {t("primaryCta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/faq">
              {t("secondaryCta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item, index) => {
          const Icon = icons[index % icons.length];
          return (
            <article
              key={item.title}
              className="rounded-[28px] border border-[color:var(--border)] bg-white p-5 shadow-[0_22px_56px_-44px_rgba(17,24,39,0.32)]"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent)] text-[color:var(--accent-red)]">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-foreground text-lg font-semibold">{item.title}</h3>
              <p className="text-muted-foreground mt-3 text-sm leading-6">{item.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
