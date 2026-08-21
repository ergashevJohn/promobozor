/**
 * Rate limiter for API routes.
 *
 * - Default: in-memory (per serverless instance) - fine for cheap GET lists
 * - `persistent: true`: Postgres-backed counters shared across instances
 *   (contact, like/dislike/copy/view, csrf, analytics, og, dedup keys)
 * - Each config `name` is part of the storage key so routes keep separate budgets
 *
 * Environment variables:
 * - RATE_LIMIT_DISABLED: Set to "true" to disable rate limiting (testing only;
 *   ignored in production)
 */
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import crypto from "node:crypto";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export interface RateLimitConfig {
  /**
   * Bucket name included in the storage key so unrelated routes do not share
   * one counter (e.g. `ratelimit:og:1.2.3.4` vs `ratelimit:analytics:1.2.3.4`).
   */
  name: string;
  /** Number of requests allowed */
  limit: number;
  /** Time window in milliseconds */
  timeWindow: number;
  /**
   * When true, counters are stored in Postgres so all instances share the same limit.
   * Use only for abuse-sensitive / mutating endpoints.
   */
  persistent?: boolean;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

const inMemoryStore = new Map<string, RateLimitEntry>();

function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, entry] of inMemoryStore.entries()) {
    if (now > entry.resetTime) {
      inMemoryStore.delete(key);
    }
  }
}

if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}

function isRateLimitDisabled(): boolean {
  return process.env.RATE_LIMIT_DISABLED === "true" && process.env.NODE_ENV !== "production";
}

function storeKey(identifier: string, config: RateLimitConfig): string {
  return `ratelimit:${config.name}:${identifier}`;
}

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous"
  );
}

/**
 * Never persist a raw client IP in rate-limit keys. The HMAC stays stable for
 * deduplication but cannot be reversed without the server-only secret.
 */
export function getHashedRateLimitIdentifier(request: Request): string {
  const secret = process.env.RATE_LIMIT_SECRET || process.env.CSRF_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "RATE_LIMIT_SECRET or CSRF_SECRET environment variable must be set in production. " +
          "This is required to secure rate limiting. Set a strong random secret in your environment."
      );
    }
    // Development fallback - only when explicitly not set
    console.warn(
      "Warning: RATE_LIMIT_SECRET and CSRF_SECRET are not set. " +
        "Using insecure fallback for development. Set these variables in production."
    );
    return crypto
      .createHmac("sha256", "dev-only-insecure")
      .update(getClientIp(request))
      .digest("hex");
  }

  return crypto.createHmac("sha256", secret).update(getClientIp(request)).digest("hex");
}

function memoryRateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const key = storeKey(identifier, config);
  let entry = inMemoryStore.get(key);

  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + config.timeWindow,
    };
    inMemoryStore.set(key, entry);
  }

  entry.count++;

  return {
    success: entry.count <= config.limit,
    limit: config.limit,
    remaining: Math.max(0, config.limit - entry.count),
    resetTime: entry.resetTime,
  };
}

function parseResetAt(value: unknown): number {
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value).getTime();
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return Date.now();
}

/**
 * Atomic fixed-window counter in Postgres.
 * Falls back to in-memory if the DB is unavailable (availability over strictness).
 */
async function persistentRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = storeKey(identifier, config);
  const windowMs = config.timeWindow;

  try {
    const result = await db.execute(sql`
      INSERT INTO rate_limits AS rl ("key", "count", "reset_at")
      VALUES (
        ${key},
        1,
        NOW() + (${windowMs}::double precision * INTERVAL '1 millisecond')
      )
      ON CONFLICT ("key") DO UPDATE
      SET
        "count" = CASE
          WHEN rl."reset_at" <= NOW() THEN 1
          ELSE rl."count" + 1
        END,
        "reset_at" = CASE
          WHEN rl."reset_at" <= NOW()
            THEN NOW() + (${windowMs}::double precision * INTERVAL '1 millisecond')
          ELSE rl."reset_at"
        END
      RETURNING "count", "reset_at"
    `);

    const rows = result as unknown as Array<{ count: number; reset_at: unknown }>;
    const row = rows[0];

    if (!row || typeof row.count !== "number") {
      throw new Error("Unexpected rate_limits RETURNING shape");
    }

    // Opportunistic cleanup of stale rows (best-effort)
    if (Math.random() < 0.01) {
      void db
        .execute(sql`DELETE FROM rate_limits WHERE "reset_at" < NOW() - INTERVAL '1 day'`)
        .catch(() => {
          /* ignore cleanup errors */
        });
    }

    const resetTime = parseResetAt(row.reset_at);

    return {
      success: row.count <= config.limit,
      limit: config.limit,
      remaining: Math.max(0, config.limit - row.count),
      resetTime,
    };
  } catch (error) {
    console.error("Persistent rate limit failed; falling back to in-memory:", error);
    return memoryRateLimit(identifier, config);
  }
}

async function rateLimit(identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const now = Date.now();

  if (isRateLimitDisabled()) {
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit,
      resetTime: now + config.timeWindow,
    };
  }

  if (config.persistent) {
    return persistentRateLimit(identifier, config);
  }

  return memoryRateLimit(identifier, config);
}

/**
 * Rate limit by client IP from the request.
 */
export async function checkRateLimit(
  request: Request,
  config: RateLimitConfig = { name: "default", limit: 10, timeWindow: 60000 }
): Promise<RateLimitResult> {
  return rateLimit(getClientIp(request), config);
}

/**
 * Predefined rate limit configurations.
 * Each entry has a distinct `name` so counters are not shared across routes.
 */
export const RateLimits = {
  // Login: 5 attempts per 15 minutes (memory - no login UI currently)
  login: { name: "login", limit: 5, timeWindow: 15 * 60 * 1000 },

  // Cheap public GETs: per-instance is acceptable
  api: { name: "api", limit: 60, timeWindow: 60 * 1000 },

  // Public actions (like, copy, dislike) - shared across instances
  publicAction: { name: "publicAction", limit: 10, timeWindow: 60 * 1000, persistent: true },

  // Views - shared
  publicView: { name: "publicView", limit: 30, timeWindow: 60 * 1000, persistent: true },

  // View dedup window per IP + promocode
  viewDedup: { name: "viewDedup", limit: 1, timeWindow: 10 * 60 * 1000, persistent: true },

  // Like/dislike dedup per IP + promocode
  actionDedup: { name: "actionDedup", limit: 1, timeWindow: 60 * 60 * 1000, persistent: true },

  // Contact form
  contact: { name: "contact", limit: 3, timeWindow: 60 * 60 * 1000, persistent: true },

  feedbackBurst: { name: "feedbackBurst", limit: 3, timeWindow: 10 * 60 * 1000, persistent: true },
  feedbackDaily: {
    name: "feedbackDaily",
    limit: 20,
    timeWindow: 24 * 60 * 60 * 1000,
    persistent: true,
  },
  feedbackDedup: {
    name: "feedbackDedup",
    limit: 1,
    timeWindow: 7 * 24 * 60 * 60 * 1000,
    persistent: true,
  },
  partnerInquiry: {
    name: "partnerInquiry",
    limit: 3,
    timeWindow: 60 * 60 * 1000,
    persistent: true,
  },

  // Search - memory (read-only, already sanitized)
  search: { name: "search", limit: 20, timeWindow: 60 * 1000 },

  // CSRF token issuance
  csrf: { name: "csrf", limit: 30, timeWindow: 60 * 1000, persistent: true },

  // Analytics ingest
  analytics: { name: "analytics", limit: 60, timeWindow: 60 * 1000, persistent: true },

  // Dynamic OG image generation (CPU-heavy) - shared + CDN cache on success
  og: { name: "og", limit: 60, timeWindow: 60 * 1000, persistent: true },

  // Admin API (unused currently)
  admin: { name: "admin", limit: 60, timeWindow: 60 * 1000 },
} as const satisfies Record<string, RateLimitConfig>;

/**
 * Rate limit by arbitrary key (IP + resource id, etc.)
 */
export async function checkRateLimitKey(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  return rateLimit(key, config);
}

/**
 * Helper to enforce rate limiting with a standard JSON response
 */
export async function enforceRateLimit(
  request: Request,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  const result = await checkRateLimit(request, config);
  if (result.success) return null;

  return NextResponse.json(
    {
      error: "Too many requests. Please try again later.",
      retryAfter: new Date(result.resetTime).toISOString(),
    },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.resetTime),
        "Retry-After": String(Math.ceil((result.resetTime - Date.now()) / 1000)),
      },
    }
  );
}
