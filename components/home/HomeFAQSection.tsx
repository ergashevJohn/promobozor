import { FAQSchema } from "@/components/public/FAQSchema";
import { Button } from "@/components/ui/button";
import { CtaIcon } from "@/components/ui/cta-icon";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Question } from "@phosphor-icons/react/dist/ssr";
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

      <section className="section-rhythm">
        <div className="mb-10 max-w-2xl text-left">
          <div className="brand-kicker mb-4">
            <Question size={14} weight="light" aria-hidden="true" />
            <span>{t("eyebrow")}</span>
          </div>
          <h2 className="brand-section-heading text-left">{t("title")}</h2>
          <p className="text-muted-foreground mt-4 max-w-[55ch] text-base leading-7 md:text-lg">
            {t("description")}
          </p>
        </div>

        <div className="divide-border divide-y">
          {items.map((item) => (
            <article
              key={item.question}
              className="grid gap-3 py-6 md:grid-cols-[0.9fr_1.1fr] md:gap-10"
            >
              <h3 className="text-foreground text-lg font-semibold text-balance md:text-xl">
                {item.question}
              </h3>
              <p className="text-muted-foreground leading-7">{item.answer}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="group">
            <Link href="/faq">
              {t("seeAll")}
              <CtaIcon>
                <ArrowRight size={16} weight="light" />
              </CtaIcon>
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="group">
            <Link href="/how-we-verify-promocodes">
              {t("verificationCta")}
              <CtaIcon>
                <ArrowRight size={16} weight="light" />
              </CtaIcon>
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
