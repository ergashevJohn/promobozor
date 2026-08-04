import {
  CheckCircle2,
  CreditCard,
  MousePointer2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
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
    <section className="brand-panel mt-4 mb-8 p-5 md:mt-6 lg:p-8 2xl:p-12">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="brand-kicker mb-4">
            <Sparkles size={16} />
            <span>{t("premiumDeals")}</span>
          </div>
          <h2 className="brand-section-heading mb-6 text-left">{t("title")}</h2>
          <p className="text-muted-foreground mb-8 text-lg leading-relaxed">{t("content")}</p>
          <div className="rounded-[24px] border border-[color:var(--border)] bg-[color:var(--secondary)]/80 p-4 lg:p-6">
            <p className="text-foreground/80 font-medium italic">&quot;{t("experience")}&quot;</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="mb-6 text-xl font-semibold">
            {t("benefitsTitle" as Parameters<typeof t>[0]) || "Nima uchun bizni tanlash kerak:"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-1">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="group rounded-[24px] border border-[color:var(--border)] bg-card/95 p-4 shadow-[0_22px_56px_-46px_rgba(17,24,39,0.45)] transition-all hover:-translate-y-0.5 hover:border-[color:var(--accent-red)]/25"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent)] text-[color:var(--accent-red)] transition-colors">
                  <CheckCircle2 size={20} />
                </div>
                <span className="text-foreground/90 text-base leading-tight font-medium">
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
    <MousePointer2 key="2" />,
    <CreditCard key="3" />,
    <Zap key="4" />,
  ];

  return (
    <div className="space-y-12 py-12">
      {/* How It Works */}
      <section>
        <div className="mb-6 text-center md:mb-12">
          <h2 className="brand-section-heading text-center text-2xl md:text-3xl">
            {t("howItWorks.title")}
          </h2>
          <div className="mx-auto mt-4 h-1.5 w-24 rounded-full bg-[color:var(--accent)]">
            <div className="h-full w-1/2 rounded-full bg-[color:var(--accent-red)]"></div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className="metric-card relative flex flex-col items-center text-center transition-transform hover:-translate-y-1"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[20px] bg-[color:var(--accent)] text-[color:var(--accent-red)]">
                {stepIcons[index % stepIcons.length]}
              </div>
              <h3 className="mb-2 text-xl font-bold">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-[24px] border border-dashed border-[color:var(--border)] bg-card/80 p-4 text-center text-sm text-[color:var(--muted-foreground)] md:mt-12">
          <p>{t("howItWorks.footer")}</p>
        </div>
      </section>

      {/* Popular Categories Descriptions */}
      <section className="p-0 md:p-8 md:py-0 2xl:p-12 2xl:py-0">
        <h2 className="brand-section-heading mb-6 text-center text-2xl md:mb-12 md:text-3xl">
          {t("categories.title")}
        </h2>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-3">
          {categories.map((cat, index) => (
            <div
              key={index}
              className="metric-card p-4 transition-transform hover:-translate-y-1 md:p-6"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent)] text-[color:var(--accent-red)]">
                <Star size={24} />
              </div>
              <h3 className="text-foreground mb-3 text-xl font-bold">{cat.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{cat.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Statistics */}
      <section>
        <h2 className="brand-section-heading mb-6 text-center text-2xl md:mb-12 md:text-3xl">
          {t("results.title")}
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5 md:gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="metric-card flex flex-col items-center justify-center p-4 text-center sm:p-6"
            >
              <div className="mb-2 text-xl font-black text-[color:var(--accent-red)] md:text-4xl">
                {stat.value}
              </div>
              <div className="text-muted-foreground text-sm font-semibold tracking-tight uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="brand-panel relative overflow-hidden p-5 md:p-8 2xl:p-12">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[color:var(--accent-red)]/8 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[color:var(--primary)]/6 blur-3xl"></div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-[color:var(--accent)] text-[color:var(--accent-red)]">
            <ShieldCheck size={48} />
          </div>
          <h2 className="brand-section-heading mb-4 text-center text-2xl md:mb-6 md:text-3xl lg:text-4xl">
            {t("trust.title")}
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed md:text-xl">
            {t("trust.content")}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-6 md:mt-10">
            <div className="text-foreground flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="text-green-600" size={20} />
              <span>{t("trust.successRate")}</span>
            </div>
            <div className="text-foreground flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="text-[color:var(--accent-red)]" size={20} />
              <span>{t("trust.verifiedDaily")}</span>
            </div>
            <div className="text-foreground flex items-center gap-2 text-sm font-semibold">
              <Users className="text-[color:var(--primary)]" size={20} />
              <span>{t("trust.monthlyUsers")}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
