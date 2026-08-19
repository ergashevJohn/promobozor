import { Link } from "@/i18n/navigation";
import { EnvelopeIcon } from "@phosphor-icons/react/dist/ssr";

interface AboutContactProps {
  contactTitle: string;
  contactDescription: string;
}

export function AboutContact({ contactTitle, contactDescription }: AboutContactProps) {
  return (
    <section className="page-hero-surface text-center">
      <h2 className="text-foreground mb-4 text-2xl font-semibold">{contactTitle}</h2>
      <p className="text-muted-foreground mb-6">{contactDescription}</p>
      <div className="flex justify-center gap-4">
        <a
          href="https://t.me/promokoduz_app"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors"
        >
          PromoBozor Telegram
        </a>
        <Link
          href="/contact"
          className="bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors"
        >
          <EnvelopeIcon className="h-4 w-4" />
          Email: jahongirergawev2@gmail.com
        </Link>
      </div>
    </section>
  );
}
