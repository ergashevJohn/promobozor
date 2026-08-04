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
        className={`relative flex items-center justify-center rounded-[24px] border border-dashed px-4 py-5 ${
          isInactive
            ? "border-slate-300 bg-slate-100"
            : "border-[color:var(--accent-red)]/35 bg-[color:var(--accent)]/75"
        }`}
      >
        <code
          aria-label={`Promo code: ${promocode.code}`}
          className={`break-all text-center font-mono text-xl font-bold sm:text-2xl md:text-3xl ${
            isInactive ? "text-slate-500 blur-[1px]" : "text-[color:var(--primary)]"
          }`}
        >
          {promocode.code}
        </code>
        {isInactive && (
          <div className="absolute inset-0 flex items-center justify-center rounded-[24px] bg-white/55 backdrop-blur-[1px]">
            <span className="text-xl font-semibold text-slate-600">
              {isInactive ? t.expired : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
