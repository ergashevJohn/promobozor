import { Card, CardContent } from "@/components/ui/card";
import { ArrowsClockwiseIcon, ShieldIcon } from "@phosphor-icons/react/dist/ssr";

interface AboutCardsProps {
  missionTitle: string;
  missionDescription: string;
  howWeWork: string;
  howWeWorkDescription: string;
}

export function AboutCards({
  missionTitle,
  missionDescription,
  howWeWork,
  howWeWorkDescription,
}: AboutCardsProps) {
  return (
    <>
      <section className="mb-16">
        <Card className="brand-panel">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 rounded-2xl bg-[color:var(--accent)] p-3 text-[color:var(--accent-red)]">
                <ShieldIcon className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-foreground mb-3 text-2xl font-semibold">{missionTitle}</h2>
                <p className="text-muted-foreground leading-relaxed">{missionDescription}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mb-16">
        <Card className="brand-panel">
          <CardContent className="p-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 rounded-2xl bg-[color:var(--accent)] p-3 text-[color:var(--accent-red)]">
                <ArrowsClockwiseIcon className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-foreground mb-3 text-2xl font-semibold">{howWeWork}</h2>
                <p className="text-muted-foreground leading-relaxed">{howWeWorkDescription}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
