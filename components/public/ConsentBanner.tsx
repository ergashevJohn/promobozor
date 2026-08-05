"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CONSENT_STORAGE_KEY, type ConsentPreferences } from "@/lib/consent";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ChartBar, Megaphone, ShieldCheck } from "@phosphor-icons/react";

const CONSENT_EXPIRY_DAYS = 365;

// Type declaration for Google Analytics gtag
declare global {
  interface Window {
    gtag: (
      command: string,
      targetId: string | Date | Record<string, string>,
      config?: Record<string, string | boolean | number>
    ) => void;
  }
}

export function ConsentBanner() {
  const t = useTranslations("consent");
  // Initialize from localStorage to avoid hydration mismatch
  // Server and client will both start with the same default values
  const [showBanner, setShowBanner] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const storedConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (storedConsent) {
        const consentData = JSON.parse(storedConsent);
        const expiryDate = new Date(consentData.expiry);
        if (expiryDate > new Date()) {
          return false; // Don't show banner if consent exists
        }
      }
    } catch {
      // Invalid stored data
    }
    return true; // Show banner if no valid consent
  });
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>(() => {
    if (typeof window === "undefined") {
      return {
        necessary: true,
        analytics: false,
        marketing: false,
      };
    }
    try {
      const storedConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (storedConsent) {
        const consentData = JSON.parse(storedConsent);
        const expiryDate = new Date(consentData.expiry);
        if (expiryDate > new Date()) {
          return consentData.preferences;
        }
      }
    } catch {
      // Invalid stored data
    }
    return {
      necessary: true,
      analytics: false,
      marketing: false,
    };
  });

  const updateGoogleAnalytics = (prefs: ConsentPreferences) => {
    if (typeof window === "undefined" || !window.gtag) return;

    // Update Google Analytics consent mode
    window.gtag("consent", "update", {
      analytics_storage: prefs.analytics ? "granted" : "denied",
      ad_storage: prefs.marketing ? "granted" : "denied",
      ad_user_data: prefs.marketing ? "granted" : "denied",
      ad_personalization: prefs.marketing ? "granted" : "denied",
    });
  };

  useEffect(() => {
    // Update Google Analytics if consent exists (client-side only)
    // This runs after hydration, so no setState needed here
    if (!showBanner && preferences) {
      updateGoogleAnalytics(preferences);
      // Notify analytics loader to mount scripts lazily
      window.dispatchEvent(new Event("consent-updated"));
    }
  }, [showBanner, preferences]);

  const saveConsent = (prefs: ConsentPreferences) => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + CONSENT_EXPIRY_DAYS);

    const consentData = {
      preferences: prefs,
      expiry: expiryDate.toISOString(),
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentData));
    setPreferences(prefs);
    updateGoogleAnalytics(prefs);
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
    });
  };

  const handleRejectAll = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
    });
  };

  const handleSaveSettings = () => {
    saveConsent(preferences);
  };

  const togglePreference = (key: keyof ConsentPreferences) => {
    if (key === "necessary") return; // Cannot disable necessary cookies
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!showBanner) return null;

  const preferenceItems = [
    {
      key: "necessary" as const,
      title: t("necessary"),
      description: t("necessaryDescription"),
      icon: ShieldCheck,
      checked: true,
      disabled: true,
    },
    {
      key: "analytics" as const,
      title: t("analytics"),
      description: t("analyticsDescription"),
      icon: ChartBar,
      checked: preferences.analytics,
      disabled: false,
    },
    {
      key: "marketing" as const,
      title: t("marketing"),
      description: t("marketingDescription"),
      icon: Megaphone,
      checked: preferences.marketing,
      disabled: false,
    },
  ];

  return (
    <div className="fixed right-0 bottom-0 left-0 z-50 p-3 sm:p-4 md:p-6">
      <Card className="bg-card/95 mx-auto max-h-[calc(100vh-1.5rem)] max-w-4xl overflow-y-auto rounded-[1.25rem] border border-[color:var(--border)] p-3 shadow-[0_30px_90px_-52px_rgba(17,24,39,0.65)] backdrop-blur sm:p-4 md:max-h-[calc(100vh-3rem)] md:p-5">
        {!showSettings ? (
          <>
            <div className="mb-3 flex flex-col gap-2 md:mb-5 md:flex-row md:items-start md:justify-between">
              <div className="max-w-3xl">
                <div className="brand-kicker mb-2 md:mb-3">
                  <ShieldCheck className="h-4 w-4" />
                  <span>{t("title")}</span>
                </div>
                <p className="text-muted-foreground line-clamp-2 text-sm leading-6 md:line-clamp-none md:text-base">
                  {t("description")}
                </p>
              </div>
              <div className="hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--secondary)]/90 px-4 py-3 text-sm text-[color:var(--muted-foreground)] md:block">
                PromoBozor faqat kerakli cookie ruxsatlari bilan ishlaydi.
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:flex sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setShowSettings(true)}
                className="h-11 min-h-11 rounded-full px-2 text-xs sm:px-5 sm:text-sm"
              >
                {t("settings")}
              </Button>
              <Button
                variant="outline"
                onClick={handleRejectAll}
                className="h-11 min-h-11 rounded-full px-2 text-xs sm:px-5 sm:text-sm"
              >
                {t("reject")}
              </Button>
              <Button
                onClick={handleAcceptAll}
                className="h-11 min-h-11 rounded-full px-2 text-xs sm:px-5 sm:text-sm"
              >
                {t("accept")}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4">
              <h3 className="mb-4 text-lg font-semibold">{t("settings")}</h3>
              <div className="grid gap-3 md:grid-cols-3 md:gap-4">
                {preferenceItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <label
                      key={item.key}
                      className="flex h-full flex-col rounded-xl border border-[color:var(--border)] bg-[color:var(--secondary)]/65 p-4"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="bg-card flex h-11 w-11 items-center justify-center rounded-2xl text-[color:var(--accent-red)]">
                          <Icon className="h-5 w-5" />
                        </div>
                        <input
                          type="checkbox"
                          checked={item.checked}
                          disabled={item.disabled}
                          onChange={item.disabled ? undefined : () => togglePreference(item.key)}
                          className="border-input mt-1 h-5 w-5 rounded text-[color:var(--accent-red)] focus:ring-[color:var(--ring)]"
                        />
                      </div>
                      <span className="text-foreground text-base font-semibold">{item.title}</span>
                      <p className="text-muted-foreground mt-2 text-sm leading-6">
                        {item.description}
                      </p>
                    </label>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowSettings(false)}
                  className="h-11 min-h-11 rounded-full"
                >
                  {t("cancel")}
                </Button>
                <Button onClick={handleSaveSettings} className="h-11 min-h-11 rounded-full">
                  {t("save")}
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
