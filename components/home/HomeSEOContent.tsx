import { CheckCircle, CreditCard, CursorClick, ShieldCheck, ShoppingBag, Sparkle, Star, TrendUp, Users, Lightning } from "@phosphor-icons/react/dist/ssr";
import { getTranslations } from "next-intl/server";

interface HomeSEOProps {
  locale: string;
}

/**
 * High-impact introductory Section for SEO and main value proposition
 */
export async function HomeSEOIntro({ locale }: HomeSEOProps) {
  const t = await getTranslations({ locale, namespace: "home.seo.intro" });
  const benefits = (await t.raw("benefits")) as string[];

  return (
    <section className="section-rhythm border-border border-b">
      <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div className="text-left">
          <div className="brand-kicker mb-4">
            <Sparkle size={16} weight="light" aria-hidden="true" />
            <span>{t("premiumDeals")}</span>
          </div>
          <h2 className="brand-section-heading mb-6 text-left">{t("title")}</h2>
          <p className="text-muted-foreground mb-8 max-w-[55ch] text-lg leading-relaxed">
            {t("content")}
          </p>
          <p className="text-foreground/80 border-border border-l-2 border-[color:var(--accent-red)] pl-4 font-medium italic">
            &quot;{t("experience")}&quot;
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="mb-2 text-xl font-semibold">
            {t("benefitsTitle" as Parameters<typeof t>[0]) || "Nima uchun bizni tanlash kerak:"}
          </h3>
          <div className="divide-border divide-y">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3 py-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--accent)] text-[color:var(--accent-red)]">
                  <CheckCircle size={18} weight="light" aria-hidden="true" />
                </div>
                <span className="text-foreground/90 pt-1 text-base leading-snug font-medium">
                  {benefit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Extended SEO content including How It Works, Stats, Categories and Trust signals
 */
export async function HomeSEOExtended({ locale }: HomeSEOProps) {
  const t = await getTranslations({ locale, namespace: "home.seo" });
  const steps = (await t.raw("howItWorks.steps")) as Array<{ title: string; description: string }>;
  const categories = (await t.raw("categories.items")) as Array<{
    title: string;
    description: string;
  }>;
  const stats = (await t.raw("results.items")) as Array<{ label: string; value: string }>;

  const stepIcons = [
    <ShoppingBag key="1" />,
    <CursorClick key="2" />,
    <CreditCard key="3" />,
    <Lightning key="4" />,
  ];

  return (
    <div className="section-rhythm space-y-20">
      <section>
        <div className="mb-10 max-w-2xl text-left">
          <h2 className="brand-section-heading text-left text-2xl md:text-3xl">
            {t("howItWorks.title")}
          </h2>
          <p className="text-muted-foreground mt-3 text-base leading-7">{t("howItWorks.footer")}</p>
        </div>
        <ol className="stagger-reveal grid gap-8 md:grid-cols-2 xl:grid-cols-[1.15fr_0.95fr_1.05fr_0.9fr]">
          {steps.map((step, index) => (
            <li key={index} className="metric-card text-left">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--accent)] text-[color:var(--accent-red)]">
                {stepIcons[index % stepIcons.length]}
              </div>
              <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-6">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="brand-section-heading mb-8 text-left text-2xl md:text-3xl">
          {t("categories.title")}
        </h2>
        <div className="stagger-reveal grid gap-8 lg:grid-cols-[1.2fr_0.95fr_1.05fr]">
          {categories.map((cat, index) => (
            <div key={index} className="metric-card">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--accent)] text-[color:var(--accent-red)]">
                <Star size={20} weight="light" aria-hidden="true" />
              </div>
              <h3 className="text-foreground mb-2 text-lg font-semibold">{cat.title}</h3>
              <p className="text-muted-foreground text-sm leading-6">{cat.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="brand-section-heading mb-8 text-left text-2xl md:text-3xl">
          {t("results.title")}
        </h2>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-[1.1fr_0.9fr_1.05fr_0.95fr_1fr]">
          {stats.map((stat, index) => (
            <div key={index} className="metric-card">
              <div className="font-mono text-2xl font-semibold tracking-tight tabular-nums text-[color:var(--accent-red)] md:text-3xl">
                {stat.value}
              </div>
              <div className="text-muted-foreground mt-1 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="ticket-stub p-6 md:p-10">
        <div className="max-w-3xl text-left">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[color:var(--accent)] text-[color:var(--accent-red)]">
            <ShieldCheck size={28} weight="light" aria-hidden="true" />
          </div>
          <h2 className="brand-section-heading mb-4 text-left text-2xl md:text-3xl">
            {t("trust.title")}
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">{t("trust.content")}</p>
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="text-foreground flex min-h-11 items-center gap-2 text-sm font-medium">
              <CheckCircle className="text-[color:var(--accent-red)]" size={18} weight="light" />
              <span>{t("trust.successRate")}</span>
            </div>
            <div className="text-foreground flex min-h-11 items-center gap-2 text-sm font-medium">
              <TrendUp className="text-[color:var(--accent-red)]" size={18} weight="light" />
              <span>{t("trust.verifiedDaily")}</span>
            </div>
            <div className="text-foreground flex min-h-11 items-center gap-2 text-sm font-medium">
              <Users size={18} weight="light" />
              <span>{t("trust.monthlyUsers")}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
