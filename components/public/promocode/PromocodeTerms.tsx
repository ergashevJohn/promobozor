import type { PromocodeDisplayData } from "@/lib/promocode-utils";

export function PromocodeTerms({
  translations,
  displayData,
}: {
  translations: Record<string, Record<string, string>>;
  displayData: PromocodeDisplayData;
}) {
  const { translation } = displayData;
  const t = translations.promocode;

  if (!translation?.conditions) {
    return null;
  }

  return (
    <div className="border-border mt-8 space-y-3 border-t pt-6">
      <h3 className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
        {t.terms}
      </h3>
      <div className="mt-2">
        <p className="text-foreground/80 text-sm leading-relaxed">{translation.conditions}</p>
      </div>
    </div>
  );
}
