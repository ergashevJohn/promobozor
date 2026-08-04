import sanitize from "sanitize-html";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "a",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "code",
  "pre",
  "span",
  "div",
  "sub",
  "sup",
] as const;

/**
 * Server-side HTML sanitizer using sanitize-html
 * Works in Node.js environment without ESM/CommonJS issues
 */
export function sanitizeHtmlServer(html: string | null | undefined): string {
  if (!html) return "";

  return sanitize(html, {
    allowedTags: [...ALLOWED_TAGS],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      "*": ["class", "style", "data-*"],
    },
  });
}
