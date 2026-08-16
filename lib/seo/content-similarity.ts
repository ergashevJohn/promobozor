import { plainText } from "@/lib/seo/content-rewrite";

export type SimilarityBucket = "exact" | "near-duplicate" | "similar" | "unique";

export const NEAR_DUPLICATE_THRESHOLD = 0.85;
export const SIMILAR_THRESHOLD = 0.65;

/** Normalize text for fingerprinting and similarity. */
export function normalizeForCompare(value: string | null | undefined): string {
  return plainText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function contentFingerprint(value: string | null | undefined): string {
  const normalized = normalizeForCompare(value);
  let hash = 2166136261;
  for (let i = 0; i < normalized.length; i += 1) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function tokenize(value: string): Set<string> {
  return new Set(normalizeForCompare(value).split(" ").filter(Boolean));
}

/** Jaccard similarity over whitespace tokens. */
export function tokenJaccard(a: string | null | undefined, b: string | null | undefined): number {
  const left = tokenize(a ?? "");
  const right = tokenize(b ?? "");
  if (left.size === 0 && right.size === 0) return 1;
  if (left.size === 0 || right.size === 0) return 0;

  let intersection = 0;
  for (const token of left) {
    if (right.has(token)) intersection += 1;
  }
  const union = left.size + right.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function shingles(value: string, size = 3): Set<string> {
  const tokens = normalizeForCompare(value).split(" ").filter(Boolean);
  const out = new Set<string>();
  if (tokens.length < size) {
    if (tokens.length > 0) out.add(tokens.join(" "));
    return out;
  }
  for (let i = 0; i <= tokens.length - size; i += 1) {
    out.add(tokens.slice(i, i + size).join(" "));
  }
  return out;
}

/** Jaccard over word trigrams (more sensitive to phrase reuse). */
export function shingleJaccard(
  a: string | null | undefined,
  b: string | null | undefined,
  size = 3
): number {
  const left = shingles(a ?? "", size);
  const right = shingles(b ?? "", size);
  if (left.size === 0 && right.size === 0) return 1;
  if (left.size === 0 || right.size === 0) return 0;

  let intersection = 0;
  for (const shingle of left) {
    if (right.has(shingle)) intersection += 1;
  }
  const union = left.size + right.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function combinedSimilarity(
  a: string | null | undefined,
  b: string | null | undefined
): number {
  const token = tokenJaccard(a, b);
  const shingle = shingleJaccard(a, b);
  return Math.max(token, shingle * 0.7 + token * 0.3);
}

export function classifySimilarity(score: number): SimilarityBucket {
  if (score >= 0.999) return "exact";
  if (score >= NEAR_DUPLICATE_THRESHOLD) return "near-duplicate";
  if (score >= SIMILAR_THRESHOLD) return "similar";
  return "unique";
}

export function normalizeSlugKey(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/-(promokod|promocode|chegirmalar|skidki|deals)$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type FieldSimilarity = {
  field: string;
  score: number;
  bucket: SimilarityBucket;
  leftFingerprint: string;
  rightFingerprint: string;
};

export function compareFields(
  left: Record<string, string | null | undefined>,
  right: Record<string, string | null | undefined>
): FieldSimilarity[] {
  const fields = Array.from(new Set([...Object.keys(left), ...Object.keys(right)]));
  return fields.map((field) => {
    const score = combinedSimilarity(left[field], right[field]);
    return {
      field,
      score,
      bucket: classifySimilarity(score),
      leftFingerprint: contentFingerprint(left[field]),
      rightFingerprint: contentFingerprint(right[field]),
    };
  });
}

export function worstBucket(fields: FieldSimilarity[]): SimilarityBucket {
  const order: SimilarityBucket[] = ["exact", "near-duplicate", "similar", "unique"];
  let worst: SimilarityBucket = "unique";
  for (const field of fields) {
    if (order.indexOf(field.bucket) < order.indexOf(worst)) {
      worst = field.bucket;
    }
  }
  return worst;
}
