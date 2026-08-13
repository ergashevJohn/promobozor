import { Card, CardContent } from "@/components/ui/card";

interface Stat {
  label: string;
  value: string;
}

interface AboutStatsProps {
  statsTitle: string;
  stats: Stat[];
}

export function AboutStats({ statsTitle, stats }: AboutStatsProps) {
  return (
    <section className="mb-16">
      <div className="mb-8 text-center">
        <h2 className="text-foreground text-2xl font-semibold">{statsTitle}</h2>
      </div>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="metric-card">
            <CardContent className="p-6 text-center">
              <p className="mb-1 text-3xl font-bold text-[color:var(--accent-red)]">{stat.value}</p>
              <p className="text-muted-foreground text-sm">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
