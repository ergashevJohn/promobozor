import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import {
  ArrowRight,
  ArrowsClockwise,
  CheckCircle,
  Envelope,
  Users,
  YoutubeLogo,
} from "@phosphor-icons/react/dist/ssr";

interface FounderExperience {
  title: string;
  description: string;
}

interface AboutFounderProps {
  badge: string;
  name: string;
  role: string;
  credentials?: string;
  bio: string;
  quote: string;
  highlightsTitle: string;
  highlights: string[];
  experienceTitle: string;
  experience: FounderExperience[];
  cta: string;
}

export function AboutFounder({
  badge,
  name,
  role,
  credentials,
  bio,
  quote,
  highlightsTitle,
  highlights,
  experienceTitle,
  experience,
  cta,
}: AboutFounderProps) {
  return (
    <section className="mb-16">
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-4 py-1.5 text-sm font-semibold text-[color:var(--accent-red)]">
          <Users className="h-4 w-4" />
          <span>{badge}</span>
        </div>
        <h2 className="text-foreground text-3xl font-semibold md:text-4xl">{name}</h2>
        <p className="text-muted-foreground mt-3 text-lg">{role}</p>
        {credentials && <p className="text-muted-foreground mt-2 text-sm">{credentials}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="brand-panel overflow-hidden">
          <CardContent className="via-card bg-gradient-to-br from-[color:var(--accent)] to-[color:var(--secondary)] p-8">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[color:var(--foreground)] text-2xl font-bold text-white">
              JE
            </div>
            <p className="text-muted-foreground text-lg leading-8">{bio}</p>
            <blockquote className="border-primary/30 text-foreground mt-6 border-l-2 pl-4 text-lg font-medium italic">
              {quote}
            </blockquote>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="border-border hover:bg-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
              >
                <Envelope className="h-4 w-4" />
                Email: jahongirergawev2@gmail.com
              </Link>
              <a
                href="https://t.me/promokoduz_app"
                target="_blank"
                rel="noopener noreferrer"
                className="border-border hover:bg-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
              >
                <ArrowsClockwise className="h-4 w-4" />
                PromoBozor Telegram
              </a>
              <a
                href="https://instagram.com/promokoduz_app"
                target="_blank"
                rel="noopener noreferrer"
                className="border-border hover:bg-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
              >
                PromoBozor Instagram
              </a>
              <a
                href="https://www.youtube.com/@promokoduz_app"
                target="_blank"
                rel="noopener noreferrer"
                className="border-border hover:bg-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
              >
                <YoutubeLogo className="h-4 w-4" />
                PromoBozor YouTube
              </a>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card className="brand-panel">
            <CardContent className="p-8">
              <h3 className="text-foreground mb-5 text-xl font-semibold">{highlightsTitle}</h3>
              <ul className="space-y-4">
                {highlights.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-[color:var(--accent)] p-1 text-[color:var(--accent-red)]">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <span className="text-muted-foreground leading-7">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="brand-panel">
            <CardContent className="p-8">
              <h3 className="text-foreground mb-5 text-xl font-semibold">{experienceTitle}</h3>
              <div className="space-y-5">
                {experience.map((item) => (
                  <div key={item.title}>
                    <h4 className="text-foreground text-lg font-semibold">{item.title}</h4>
                    <p className="text-muted-foreground mt-2 leading-7">{item.description}</p>
                  </div>
                ))}
              </div>

              <Link href="/how-we-verify-promocodes" className="mt-6 inline-flex">
                <span className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-opacity hover:opacity-90">
                  {cta}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
