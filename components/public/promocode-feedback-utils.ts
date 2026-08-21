type Source = "card" | "detail";

type PendingFeedback = { promocodeId: string; source: Source };

export function dispatchPromocodeFeedback(promocodeId: string, source: Source) {
  window.dispatchEvent(
    new CustomEvent<PendingFeedback>("promobozor:feedback-ready", {
      detail: { promocodeId, source },
    })
  );
}

export type { PendingFeedback };
