export const CONSENT_STORAGE_KEY = "cookie-consent" as const;

export type ConsentPreferences = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
};
