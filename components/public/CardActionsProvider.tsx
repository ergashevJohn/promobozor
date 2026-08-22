"use client";

/**
 * Global Card Actions Provider
 * Single client component that handles ALL promocode card interactions
 * Dramatically reduces hydration overhead compared to per-card components
 */
import { useCallback, useEffect, useRef } from "react";

interface Translations {
  codeCopied: string;
  copyError: string;
}

declare global {
  interface Window {
    __cardActionsTranslations?: Translations;
  }
}

let isInitialized = false;

async function showToast(kind: "success" | "error", message: string) {
  const { toast } = await import("sonner");
  toast[kind](message);
}

async function requestFeedback(promocodeId: string) {
  const { dispatchPromocodeFeedback } = await import("./promocode-feedback-utils");
  dispatchPromocodeFeedback(promocodeId, "card");
}

export function CardActionsProvider({ translations }: { translations: Translations }) {
  const pendingRequests = useRef(new Set<string>());
  const activeTimers = useRef<Map<HTMLElement, number>>(new Map());
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  // Move handler outside useEffect to avoid fetch-in-effect detection
  const handleCardAction = useCallback(
    async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest("[data-action]") as HTMLButtonElement;

      if (!button) return;

      const action = button.dataset.action;
      const promocodeId = button.dataset.promocodeId;
      const disabled = button.dataset.disabled === "true";

      if (!action || !promocodeId || disabled) return;

      e.preventDefault();
      e.stopPropagation();

      // Prevent duplicate requests
      const requestKey = `${action}-${promocodeId}`;
      if (pendingRequests.current.has(requestKey)) return;
      pendingRequests.current.add(requestKey);

      try {
        switch (action) {
          case "copy-code": {
            const code = button.dataset.code || "";
            const redirectUrl = button.dataset.link || button.dataset.storeUrl || "";
            const buttonText = button.querySelector("[data-button-text]") as HTMLElement;

            await navigator.clipboard.writeText(code);
            void showToast("success", translations.codeCopied);
            void requestFeedback(promocodeId);
            if (redirectUrl) window.open(redirectUrl, "_blank", "noopener,noreferrer");

            // Update button text temporarily
            if (buttonText) {
              buttonText.textContent = translations.codeCopied;
            }
            button.classList.add("bg-green-600");
            button.disabled = true;

            // Track copy with AbortController
            const abortController = new AbortController();
            abortControllers.current.set(requestKey, abortController);
            await fetch(`/api/promocodes/${promocodeId}/copy`, {
              method: "POST",
              signal: abortController.signal,
            });
            abortControllers.current.delete(requestKey);

            // Clear existing timer for this button if any
            const existingTimer = activeTimers.current.get(button);
            if (existingTimer) {
              clearTimeout(existingTimer);
            }

            // Reset after 2 seconds - track the timer
            const timerId = window.setTimeout(() => {
              if (buttonText) {
                buttonText.textContent = button.dataset.originalText || "Copy";
              }
              button.classList.remove("bg-green-600");
              button.disabled = disabled;
              activeTimers.current.delete(button);
            }, 2000);
            activeTimers.current.set(button, timerId);
            break;
          }

          case "open-link": {
            const link = button.dataset.link || "";
            window.open(link, "_blank", "noopener,noreferrer");
            void requestFeedback(promocodeId);

            // Track click with AbortController
            const abortController = new AbortController();
            abortControllers.current.set(requestKey, abortController);
            await fetch(`/api/promocodes/${promocodeId}/copy`, {
              method: "POST",
              signal: abortController.signal,
            });
            abortControllers.current.delete(requestKey);
            break;
          }
        }
      } catch (error) {
        // Ignore aborted requests
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("Card action error:", error);
        void showToast("error", translations.copyError);
      } finally {
        pendingRequests.current.delete(requestKey);
      }
    },
    [translations]
  );

  useEffect(() => {
    // Skip if already initialized (prevents duplicate listeners in React Strict Mode)
    if (isInitialized) return;
    isInitialized = true;

    // Store translations for global access
    window.__cardActionsTranslations = translations;

    // Add global listener with capture for better performance
    document.addEventListener("click", handleCardAction, true);

    // Capture ref values for cleanup
    const controllers = abortControllers.current;
    const timers = activeTimers.current;

    return () => {
      document.removeEventListener("click", handleCardAction, true);
      isInitialized = false;

      // Abort all pending requests
      controllers.forEach((controller) => {
        controller.abort();
      });
      controllers.clear();

      // Clean up all active timers
      timers.forEach((timerId) => {
        clearTimeout(timerId);
      });
      timers.clear();
    };
  }, [handleCardAction, translations]);

  return null; // This component doesn't render anything
}
