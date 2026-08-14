import type { FaqJsonItem } from "@/db/schema";

export type ContentFaqItem = {
  question: string;
  answer: string;
};

export type ContentHowToStep = {
  name: string;
  text: string;
};

/**
 * Resolve on-page / schema description: prefer bodyHtml, then shortSummary,
 * then a sufficiently long description, then hub/fallback text.
 */
export function resolveEntityBody(options: {
  bodyHtml?: string | null;
  shortSummary?: string | null;
  description?: string | null;
  hubDescription?: string | null;
  minDescriptionLength?: number;
}): string | null {
  const minLen = options.minDescriptionLength ?? 80;
  const body = options.bodyHtml?.trim();
  if (body) return body;

  const description = options.description?.trim();
  if (description && description.length >= minLen) return description;

  const hub = options.hubDescription?.trim();
  if (hub) return hub;

  if (description) return description;

  const summary = options.shortSummary?.trim();
  return summary || null;
}

export function isValidFaqJson(value: unknown): value is FaqJsonItem[] {
  if (!Array.isArray(value) || value.length === 0) return false;
  return value.every(
    (item) =>
      item &&
      typeof item === "object" &&
      typeof (item as FaqJsonItem).question === "string" &&
      (item as FaqJsonItem).question.trim().length > 0 &&
      typeof (item as FaqJsonItem).answer === "string" &&
      (item as FaqJsonItem).answer.trim().length > 0
  );
}

export function normalizeFaqItems(value: unknown): ContentFaqItem[] | null {
  if (!isValidFaqJson(value)) return null;
  return value.map((item) => ({
    question: item.question.trim(),
    answer: item.answer.trim(),
  }));
}

/** Strip tags for meta / HowTo fallback text */
export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Best-effort HowTo steps from HTML: prefer <li> items, else one step from plain text.
 */
export function howToHtmlToSteps(howToHtml: string | null | undefined): ContentHowToStep[] | null {
  const html = howToHtml?.trim();
  if (!html) return null;

  const liMatches = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
  if (liMatches.length > 0) {
    return liMatches.map((match, index) => {
      const text = stripHtml(match[1] || "").trim();
      return {
        name: `Step ${index + 1}`,
        text: text || `Step ${index + 1}`,
      };
    });
  }

  const plain = stripHtml(html);
  if (!plain) return null;
  return [{ name: "How to use", text: plain }];
}

// Cache Intl formatters at module scope for better performance
const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getDateFormatter(locale: string): Intl.DateTimeFormat {
  const localeTag = locale === "uz" ? "uz-UZ" : locale === "ru" ? "ru-RU" : "en-US";
  if (!dateFormatterCache.has(localeTag)) {
    dateFormatterCache.set(
      localeTag,
      new Intl.DateTimeFormat(localeTag, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    );
  }
  return dateFormatterCache.get(localeTag)!;
}

export function formatVerifiedDate(
  value: Date | string | null | undefined,
  locale: string
): string | null {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;

  return getDateFormatter(locale).format(date);
}
