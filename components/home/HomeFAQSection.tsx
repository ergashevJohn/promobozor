import { FAQSchema } from "@/components/public/FAQSchema";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { ArrowRight, BadgeHelp } from "lucide-react";
import { getTranslations } from "next-intl/server";

interface HomeFAQSectionProps {
  locale: string;
}

export async function HomeFAQSection({ locale }: HomeFAQSectionProps) {
  const t = await getTranslations({ locale, namespace: "home.faq" });
  const items = (await t.raw("items")) as Array<{ question: string; answer: string }>;

  return (
    <>
      <FAQSchema questions={items} />

      <section className="brand-panel mb-16 px-5 py-8 md:px-8 md:py-12">
        <div className="mx-auto max-w-4xl text-center">
          <div className="brand-kicker mb-4">
            <BadgeHelp className="h-4 w-4" />
            <span>{t("eyebrow")}</span>
          </div>
          <h2 className="brand-section-heading text-center">{t("title")}</h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-3xl text-base leading-7 md:text-lg">
            {t("description")}
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {items.map((item, index) => (
            <article
              key={item.question}
              className="rounded-[24px] border border-[color:var(--border)] bg-card/95 p-5 shadow-[0_22px_56px_-46px_rgba(17,24,39,0.45)]"
            >
              <div className="mb-4 text-sm font-semibold tracking-[0.24em] text-[color:var(--accent-red)] uppercase">
                {String(index + 1).padStart(2, "0")}
              </div>
              <h3 className="text-foreground text-xl font-semibold">{item.question}</h3>
              <p className="text-muted-foreground mt-3 leading-7">{item.answer}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="rounded-full">
            <Link href="/faq">
              {t("seeAll")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full">
            <Link href="/how-we-verify-promocodes">
              {t("verificationCta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
