"use client";

/**
 * Global Card Actions Provider
 * Single client component that handles ALL promocode card interactions
 * Dramatically reduces hydration overhead compared to per-card components
 */
import { useEffect, useRef } from "react";
import { toast } from "sonner";

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

export function CardActionsProvider({ translations }: { translations: Translations }) {
  const pendingRequests = useRef(new Set<string>());

  useEffect(() => {
    // Skip if already initialized (prevents duplicate listeners in React Strict Mode)
    if (isInitialized) return;
    isInitialized = true;

    // Store translations for global access
    window.__cardActionsTranslations = translations;

    // Global click handler for all card actions
    const handleCardAction = async (e: MouseEvent) => {
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
            const buttonText = button.querySelector("[data-button-text]") as HTMLElement;

            await navigator.clipboard.writeText(code);
            toast.success(translations.codeCopied);

            // Update button text temporarily
            if (buttonText) {
              buttonText.textContent = translations.codeCopied;
            }
            button.classList.add("bg-green-600");
            button.disabled = true;

            // Track copy
            await fetch(`/api/promocodes/${promocodeId}/copy`, { method: "POST" });

            // Reset after 2 seconds
            setTimeout(() => {
              if (buttonText) {
                buttonText.textContent = button.dataset.originalText || "Copy";
              }
              button.classList.remove("bg-green-600");
              button.disabled = disabled;
            }, 2000);
            break;
          }

          case "open-link": {
            const link = button.dataset.link || "";
            window.open(link, "_blank", "noopener,noreferrer");

            // Track click
            await fetch(`/api/promocodes/${promocodeId}/copy`, { method: "POST" });
            break;
          }

          case "like": {
            const response = await fetch(`/api/promocodes/${promocodeId}/like`, { method: "POST" });
            if (response.ok) {
              const countSpan = button.querySelector("[data-count]") as HTMLElement;
              const currentCount = parseInt(button.dataset.count || "0");

              // Update UI
              if (countSpan) {
                countSpan.textContent = (currentCount + 1).toLocaleString();
              }
              button.classList.add("bg-green-100", "text-green-700");
              button.classList.remove("bg-muted", "text-muted-foreground");
              button.dataset.disabled = "true"; // Prevent multiple likes
            }
            break;
          }

          case "dislike": {
            const response = await fetch(`/api/promocodes/${promocodeId}/dislike`, {
              method: "POST",
            });
            if (response.ok) {
              const countSpan = button.querySelector("[data-count]") as HTMLElement;
              const currentCount = parseInt(button.dataset.count || "0");

              // Update UI
              if (countSpan) {
                countSpan.textContent = (currentCount + 1).toLocaleString();
              }
              button.classList.add("bg-red-100", "text-red-700");
              button.classList.remove("bg-muted", "text-muted-foreground");
              button.dataset.disabled = "true"; // Prevent multiple dislikes
            }
            break;
          }
        }
      } catch (error) {
        console.error("Card action error:", error);
        toast.error(translations.copyError);
      } finally {
        pendingRequests.current.delete(requestKey);
      }
    };

    // Add global listener with capture for better performance
    document.addEventListener("click", handleCardAction, true);

    return () => {
      document.removeEventListener("click", handleCardAction, true);
      isInitialized = false;
    };
  }, [translations]);

  return null; // This component doesn't render anything
}
