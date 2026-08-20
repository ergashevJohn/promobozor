"use client";

import { Button } from "@/components/ui/button";
import { XIcon } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type Source = "card" | "detail";
type FailureReason =
  | "invalid_or_expired"
  | "new_customer_only"
  | "min_order_or_product"
  | "region_app_or_payment"
  | "other";

type FeedbackTranslations = {
  question: string;
  worked: string;
  failed: string;
  chooseReason: string;
  send: string;
  close: string;
  thanks: string;
  error: string;
  reasons: Record<FailureReason, string>;
};

type PendingFeedback = { promocodeId: string; source: Source };
const storageKey = (id: string) => `promobozor:feedback:${id}`;

export function dispatchPromocodeFeedback(promocodeId: string, source: Source) {
  window.dispatchEvent(
    new CustomEvent<PendingFeedback>("promobozor:feedback-ready", {
      detail: { promocodeId, source },
    })
  );
}

export function PromocodeFeedbackPrompt({ translations }: { translations: FeedbackTranslations }) {
  const [pending, setPending] = useState<PendingFeedback | null>(null);
  const [reason, setReason] = useState<FailureReason | null>(null);
  const [showReasons, setShowReasons] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const timer = useRef<number | null>(null);

  const dismiss = () => {
    if (pending) localStorage.setItem(storageKey(pending.promocodeId), "dismissed");
    setPending(null);
    setReason(null);
    setShowReasons(false);
  };

  useEffect(() => {
    const handle = (event: Event) => {
      const detail = (event as CustomEvent<PendingFeedback>).detail;
      if (!detail?.promocodeId || localStorage.getItem(storageKey(detail.promocodeId))) return;
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setPending(detail), 15_000);
    };
    window.addEventListener("promobozor:feedback-ready", handle);
    return () => {
      window.removeEventListener("promobozor:feedback-ready", handle);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const submit = async (result: "worked" | "failed") => {
    if (!pending || (result === "failed" && !reason)) return;
    setSubmitting(true);
    try {
      const csrfResponse = await fetch("/api/csrf", { cache: "no-store" });
      const csrf = (await csrfResponse.json()) as { token?: string };
      if (!csrfResponse.ok || !csrf.token) throw new Error();
      const response = await fetch(`/api/promocodes/${pending.promocodeId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf.token },
        body: JSON.stringify({
          result,
          failureReason: result === "failed" ? reason : null,
          source: pending.source,
        }),
      });
      if (!response.ok) throw new Error();
      localStorage.setItem(storageKey(pending.promocodeId), "answered");
      toast.success(translations.thanks);
      setPending(null);
      setReason(null);
      setShowReasons(false);
    } catch {
      toast.error(translations.error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!pending) return null;
  return (
    <aside
      className="bg-card fixed right-4 bottom-4 z-50 w-[min(23rem,calc(100vw-2rem))] rounded-2xl border border-[color:var(--border)] p-4 shadow-2xl"
      aria-live="polite"
    >
      <button
        type="button"
        onClick={dismiss}
        className="text-muted-foreground hover:text-foreground absolute top-3 right-3 rounded p-1"
        aria-label={translations.close}
      >
        <XIcon size={18} aria-hidden="true" />
      </button>
      <p className="text-foreground pr-7 text-sm font-semibold">{translations.question}</p>
      {showReasons ? (
        <div className="mt-3 space-y-3">
          <p className="text-muted-foreground text-sm">{translations.chooseReason}</p>
          <div className="grid gap-2">
            {(Object.keys(translations.reasons) as FailureReason[]).map((key) => (
              <label key={key} className="text-foreground flex cursor-pointer gap-2 text-sm">
                <input
                  type="radio"
                  name="feedback-reason"
                  checked={reason === key}
                  onChange={() => setReason(key)}
                />
                {translations.reasons[key]}
              </label>
            ))}
          </div>
          <Button
            className="w-full"
            disabled={submitting || !reason}
            onClick={() => submit("failed")}
          >
            {translations.send}
          </Button>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button disabled={submitting} onClick={() => submit("worked")}>
            {translations.worked}
          </Button>
          <Button variant="outline" disabled={submitting} onClick={() => setShowReasons(true)}>
            {translations.failed}
          </Button>
        </div>
      )}
    </aside>
  );
}
