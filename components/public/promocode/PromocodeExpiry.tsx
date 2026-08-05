import type { PromocodeDisplayData } from "@/lib/promocode-utils";

export function PromocodeExpiry({
  translations,
  displayData,
  lang,
}: {
  translations: Record<string, Record<string, string>>;
  displayData: PromocodeDisplayData;
  lang?: string;
}) {
  const { expiryDate, isExpired, daysUntilExpiry } = displayData;
  const t = translations.promocode;

  if (!expiryDate) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="rounded-[24px] border border-[color:var(--border)] bg-card/95 p-4 shadow-[0_18px_48px_-42px_rgba(17,24,39,0.35)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">{t.expiryDate}</p>
            <p className="text-foreground font-semibold">{formatExpiryDate(expiryDate, lang)}</p>
          </div>
          {!isExpired && daysUntilExpiry !== null && (
            <div className="text-right">
              <p className="text-muted-foreground text-xs">{t.daysRemaining}</p>
              <p
                className={`text-2xl font-bold ${
                  daysUntilExpiry > 30
                    ? "text-[color:var(--accent-red)]"
                    : daysUntilExpiry > 7
                      ? "text-amber-500"
                      : "text-[color:var(--accent-red)]"
                }`}
              >
                {daysUntilExpiry}
              </p>
            </div>
          )}
          {isExpired && (
            <div className="text-right">
              <p className="text-sm font-semibold text-[color:var(--accent-red)]">{t.expired}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function - format date based on language
function formatExpiryDate(date: Date, lang: string = "uz"): string {
  const day = date.getDate();
  const year = date.getFullYear();
  const monthIndex = date.getMonth();

  const uzMonths = [
    "Yanvar",
    "Fevral",
    "Mart",
    "Aprel",
    "May",
    "Iyun",
    "Iyul",
    "Avgust",
    "Sentyabr",
    "Oktyabr",
    "Noyabr",
    "Dekabr",
  ];

  if (lang === "uz") {
    return `${day} ${uzMonths[monthIndex]} ${year}`;
  } else if (lang === "ru") {
    const locale = "ru-RU";
    const month = date.toLocaleDateString(locale, { month: "long" });
    return `${day} ${month} ${year}`;
  } else {
    const locale = "en-US";
    const month = date.toLocaleDateString(locale, { month: "long" });
    return `${day} ${month} ${year}`;
  }
}
