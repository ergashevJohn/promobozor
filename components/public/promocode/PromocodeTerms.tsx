import type { PromocodeDisplayData } from "@/lib/promocode-utils";

export function PromocodeTerms({
  translations,
  displayData,
  minOrderAmount,
  currency,
}: {
  translations: Record<string, Record<string, string>>;
  displayData: PromocodeDisplayData;
  minOrderAmount?: number | null;
  currency?: string | null;
}) {
  const { translation } = displayData;
  const t = translations.promocode;
  const shortDescription = translation?.shortDescription?.trim();
  const conditions = translation?.conditions?.trim();
  const editorVerdict = translation?.editorVerdict?.trim();
  const hasMinOrder = typeof minOrderAmount === "number" && minOrderAmount > 0;

  if (!shortDescription && !conditions && !editorVerdict && !hasMinOrder) {
    return null;
  }

  return (
    <div className="border-border mt-8 space-y-4 border-t pt-6">
      {shortDescription ? (
        <div className="space-y-2">
          <h3 className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
            {t.shortDescription || t.description || t.terms}
          </h3>
          <p className="text-foreground/80 text-sm leading-relaxed">{shortDescription}</p>
        </div>
      ) : null}

      {editorVerdict ? (
        <div className="space-y-2">
          <h3 className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
            {t.editorVerdict}
          </h3>
          <p className="text-foreground text-sm leading-relaxed font-medium">{editorVerdict}</p>
        </div>
      ) : null}

      {hasMinOrder ? (
        <p className="text-muted-foreground text-sm leading-relaxed">
          {t.minOrder}: {minOrderAmount.toLocaleString("en-US")} {currency || "UZS"}
        </p>
      ) : null}

      {conditions ? (
        <div className="space-y-2">
          <h3 className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
            {t.terms}
          </h3>
          <p className="text-foreground/80 text-sm leading-relaxed">{conditions}</p>
        </div>
      ) : null}
    </div>
  );
}
