export const CONSENT_STORAGE_KEY = "cookie-consent" as const;

export type ConsentPreferences = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
};

/** Client-side guard shared by optional analytics integrations. */
export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { preferences?: Partial<ConsentPreferences> };
    return Boolean(parsed.preferences?.analytics || parsed.preferences?.marketing);
  } catch {
    return false;
  }
}
