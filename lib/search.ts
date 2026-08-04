export function sanitizeSearchQuery(query?: string | null): string | null {
  if (!query) return null;

  const sanitized = query
    .trim()
    .replace(/[^\p{L}\p{N}\s\-_.@]/gu, "")
    .replace(/\s+/g, " ")
    .substring(0, 100);

  return sanitized.length > 0 ? sanitized : null;
}
