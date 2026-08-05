import type { Promocode } from "../types";
import type { PromocodeDisplayData } from "@/lib/promocode-utils";

export function PromocodeCodeBox({
  promocode,
  translations,
  displayData,
}: {
  promocode: Promocode;
  translations: Record<string, Record<string, string>>;
  displayData: PromocodeDisplayData;
}) {
  const { isInactive } = displayData;
  const t = translations.card;

  if (promocode.type !== "code" || !promocode.code) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div
        className={`relative flex items-center justify-center rounded-xl border border-dashed px-4 py-5 ${
          isInactive
            ? "border-[color:var(--border)] bg-[color:var(--secondary)]"
            : "border-[color:var(--accent-red)]/35 bg-[color:var(--accent)]/75"
        }`}
      >
        <code
          aria-label={`Promo code: ${promocode.code}`}
          className={`text-center font-mono text-xl font-bold break-all sm:text-2xl md:text-3xl ${
            isInactive
              ? "text-[color:var(--muted-foreground)] blur-[1px]"
              : "text-[color:var(--primary)]"
          }`}
        >
          {promocode.code}
        </code>
        {isInactive && (
          <div className="bg-card/70 absolute inset-0 flex items-center justify-center rounded-xl backdrop-blur-[1px]">
            <span className="text-xl font-semibold text-[color:var(--muted-foreground)]">
              {isInactive ? t.expired : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
