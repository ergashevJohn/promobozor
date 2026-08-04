import { sql } from "drizzle-orm";

/**
 * Full-Text Search utilities for PostgreSQL
 *
 * Uses PostgreSQL's tsvector/tsquery for efficient full-text search.
 * The search_vector column is automatically maintained via GENERATED ALWAYS AS.
 */

/**
 * Convert search query to tsquery format
 * Handles multiple words by converting to prefix search with AND
 *
 * Example:
 *   "pizza delivery" -> "pizza:* & delivery:*"
 *   "50% скидка" -> "50:* & скидка:*"
 */
export function toTsQuery(query: string): string {
  if (!query || query.trim().length === 0) {
    return "";
  }

  // Sanitize and split into words
  const words = query
    .trim()
    .toLowerCase()
    // Remove special characters except letters, numbers, spaces
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0);

  if (words.length === 0) {
    return "";
  }

  // Convert to prefix search with AND operator
  // Each word becomes "word:*" for prefix matching
  return words.map((word) => `${word}:*`).join(" & ");
}

/**
 * Create SQL condition for full-text search
 * Returns a Drizzle SQL expression for WHERE clause
 *
 * @param searchVector - Column name containing tsvector (e.g., "search_vector")
 * @param query - User's search query
 * @param tableName - Optional table name for qualified column reference
 */
export function fullTextSearchCondition(
  query: string,
  tableName: string = "promocode_translations"
) {
  const tsQuery = toTsQuery(query);

  if (!tsQuery) {
    return null;
  }

  // Return SQL condition using @@ operator for tsvector match
  return sql`${sql.identifier(tableName)}."search_vector" @@ to_tsquery('simple', ${tsQuery})`;
}
