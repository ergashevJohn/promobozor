"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { FeedbackTranslations } from "./PromocodeFeedbackPrompt";
import type { PendingFeedback } from "./promocode-feedback-utils";

const ReCaptchaProvider = dynamic(
  () =>
    import("@/components/providers/ReCaptchaProvider").then((module) => module.ReCaptchaProvider),
  { ssr: false }
);

const PromocodeFeedbackPrompt = dynamic(
  () => import("./PromocodeFeedbackPrompt").then((module) => module.PromocodeFeedbackPrompt),
  { ssr: false }
);

/** Loads reCAPTCHA and the feedback dialog only after a promocode card is used. */
export function LazyPromocodeFeedbackPrompt({
  translations,
}: {
  translations: FeedbackTranslations;
}) {
  const [initialFeedback, setInitialFeedback] = useState<PendingFeedback | null>(null);

  useEffect(() => {
    const handle = (event: Event) => {
      const detail = (event as CustomEvent<PendingFeedback>).detail;
      if (detail?.promocodeId) setInitialFeedback(detail);
    };

    window.addEventListener("promobozor:feedback-ready", handle);
    return () => window.removeEventListener("promobozor:feedback-ready", handle);
  }, []);

  if (!initialFeedback) return null;

  return (
    <ReCaptchaProvider>
      <PromocodeFeedbackPrompt translations={translations} initialFeedback={initialFeedback} />
    </ReCaptchaProvider>
  );
}
