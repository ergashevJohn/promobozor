import { UsersIcon } from "@phosphor-icons/react/dist/ssr";

interface AboutHeroProps {
  heroKicker: string;
  heroTitle: string;
  heroDescription: string;
}

export function AboutHero({ heroKicker, heroTitle, heroDescription }: AboutHeroProps) {
  return (
    <div className="page-hero-surface mb-16 text-center">
      <div className="mb-4 flex justify-center">
        <div className="rounded-full bg-[color:var(--accent)] p-4 text-[color:var(--accent-red)]">
          <UsersIcon className="h-12 w-12" />
        </div>
      </div>
      <div className="brand-kicker mb-4">{heroKicker}</div>
      <h1 className="page-hero-heading mb-4">{heroTitle}</h1>
      <p className="page-hero-copy mx-auto">{heroDescription}</p>
    </div>
  );
}
