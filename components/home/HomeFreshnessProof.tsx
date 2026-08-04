import { CalendarDays, CheckCheck, ShieldCheck, Sparkles } from "lucide-react";
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
  const icons = [CalendarDays, CheckCheck, ShieldCheck, Sparkles];

  return (
    <section className="mb-14 rounded-[32px] border border-[color:var(--border)] bg-[linear-gradient(135deg,rgba(255,90,79,0.07),rgba(248,250,252,0.92)_38%,rgba(17,24,39,0.02)_100%)] p-6 shadow-[0_28px_72px_-52px_rgba(17,24,39,0.4)] md:p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="brand-kicker mb-3">{t("eyebrow")}</div>
          <h2 className="brand-section-heading text-left">{t("title")}</h2>
          <p className="text-muted-foreground mt-3 text-base leading-7 md:text-lg">
            {t("description")}
          </p>
        </div>

        <div className="rounded-[24px] border border-white/80 bg-white/90 px-5 py-4 shadow-[0_18px_48px_-40px_rgba(17,24,39,0.32)]">
          <div className="text-xs font-semibold tracking-[0.16em] text-[color:var(--accent-red)] uppercase">
            {todayLabel}
          </div>
          <div className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
            {new Date().toLocaleDateString(localeForDate, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item, index) => {
          const Icon = icons[index % icons.length];
          return (
            <div
              key={item.title}
              className="rounded-[24px] border border-white/80 bg-white/92 p-5 shadow-[0_22px_56px_-44px_rgba(17,24,39,0.32)]"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent)] text-[color:var(--accent-red)]">
                <Icon className="h-5 w-5" />
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
