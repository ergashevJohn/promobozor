import type { Promocode } from "../types";
import type { PromocodeDisplayData } from "@/lib/promocode-utils";

export function PromocodeDiscount({
  promocode,
  translations,
  displayData,
}: {
  promocode: Promocode;
  translations: Record<string, Record<string, string>>;
  displayData: PromocodeDisplayData;
}) {
  const { discountDisplay } = displayData;
  const t = translations.promocode;

  return (
    <div className="space-y-3">
      <div className="via-card flex items-center justify-center rounded-[24px] border border-[color:var(--accent-red)]/10 bg-gradient-to-br from-[color:var(--accent)] to-[color:var(--secondary)] px-6 py-6 shadow-[0_20px_48px_-38px_rgba(255,90,79,0.55)]">
        <div className="text-center">
          <p className="text-muted-foreground text-sm font-medium">
            {promocode.discountType === "percent" ? t.percentage : t.amount}
          </p>
          <p className="text-accent-red text-3xl font-bold sm:text-5xl md:text-4xl lg:text-5xl">
            {discountDisplay}
          </p>
        </div>
      </div>
    </div>
  );
}
