import { afterEach, describe, expect, it } from "vitest";
import { CONSENT_STORAGE_KEY, hasAnalyticsConsent } from "./consent";

describe("hasAnalyticsConsent", () => {
  afterEach(() => localStorage.clear());

  it("returns false without an optional consent choice", () => {
    expect(hasAnalyticsConsent()).toBe(false);
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ preferences: { necessary: true } }));
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("accepts analytics or marketing consent", () => {
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ preferences: { necessary: true, analytics: true, marketing: false } })
    );

    expect(hasAnalyticsConsent()).toBe(true);
  });
});
