import { Card, CardContent } from "@/components/ui/card";
import type { Icon } from "@phosphor-icons/react";

interface Reason {
  icon: Icon;
  title: string;
  description: string;
}

interface AboutReasonsProps {
  whyUsTitle: string;
  reasons: Reason[];
}

export function AboutReasons({ whyUsTitle, reasons }: AboutReasonsProps) {
  return (
    <section className="mb-16">
      <div className="mb-8 text-center">
        <h2 className="text-foreground text-2xl font-semibold">{whyUsTitle}</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {reasons.map((reason) => (
          <Card key={reason.title} className="brand-panel">
            <CardContent className="flex items-start gap-4 p-6">
              <div className="flex-shrink-0 rounded-2xl bg-[color:var(--accent)] p-3 text-[color:var(--accent-red)]">
                <reason.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-foreground mb-2 text-lg font-semibold">{reason.title}</h3>
                <p className="text-muted-foreground text-sm">{reason.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
