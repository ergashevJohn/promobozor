import { FAQSchema } from "@/components/public/FAQSchema";
import { Button } from "@/components/ui/button";
import { CtaIcon } from "@/components/ui/cta-icon";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
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
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="brand-section-heading text-center">{t("title")}</h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-[48ch] text-base leading-7 md:text-lg">
            {t("description")}
          </p>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <li
              key={item.question}
              className="bg-card border-border rounded-2xl border p-5 shadow-[0_18px_48px_-40px_rgba(15,20,25,0.28)] md:p-6"
            >
              <h3 className="text-foreground text-base leading-snug font-semibold text-balance md:text-lg">
                <span
                  className="mb-3 block h-1 w-8 rounded-full bg-[color:var(--accent-red)]"
                  aria-hidden="true"
                />
                {item.question}
              </h3>
              <p className="text-muted-foreground mt-3 text-sm leading-7">{item.answer}</p>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
