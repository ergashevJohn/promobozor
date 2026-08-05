import { CalendarBlank, Checks, ShieldCheck, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { getTranslations } from "next-intl/server";

interface HomeFreshnessProofProps {
  locale: string;
  todayLabel: string;
  localeForDate: string;
}

export async function HomeFreshnessProof({
  locale,
  todayLabel,
  localeForDate,
}: HomeFreshnessProofProps) {
  const t = await getTranslations({ locale, namespace: "home.overhaul.proof" });
  const items = (await t.raw("items")) as Array<{
    title: string;
    description: string;
  }>;
  const icons = [CalendarBlank, Checks, ShieldCheck, Sparkle];

  return (
    <section className="section-rhythm border-border border-b">
      <div className="mb-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div className="max-w-2xl text-left">
          <div className="brand-kicker mb-3">{t("eyebrow")}</div>
          <h2 className="brand-section-heading text-left">{t("title")}</h2>
          <p className="text-muted-foreground mt-3 max-w-[55ch] text-base leading-7 md:text-lg">
            {t("description")}
          </p>
        </div>

        <div className="metric-card">
          <div className="text-[10px] font-semibold tracking-[0.16em] text-[color:var(--accent-red)] uppercase">
            {todayLabel}
          </div>
          <div className="mt-2 font-mono text-lg font-semibold tabular-nums text-[color:var(--foreground)]">
            {new Date().toLocaleDateString(localeForDate, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </div>

      <div className="stagger-reveal grid gap-8 md:grid-cols-2 xl:grid-cols-[1.15fr_0.95fr_1.05fr_0.9fr]">
        {items.map((item, index) => {
          const Icon = icons[index % icons.length];
          return (
            <div key={item.title} className="metric-card">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--accent)] text-[color:var(--accent-red)]">
                <Icon size={20} weight="light" aria-hidden="true" />
              </div>
              <h3 className="text-foreground text-lg font-semibold">{item.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-6">{item.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
