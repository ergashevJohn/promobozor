/**
 * In-memory rate limiter for API routes.
 *
 * Note: On multi-instance serverless deployments each instance has its own
 * counter, so limits are per-instance rather than globally shared. This is
 * intentional until a distributed store is reintroduced.
 *
 * Environment variables:
 * - RATE_LIMIT_DISABLED: Set to "true" to disable rate limiting (testing only)
 */
import { NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const inMemoryStore = new Map<string, RateLimitEntry>();

/**
 * Clean up expired in-memory entries
 */
function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, entry] of inMemoryStore.entries()) {
    if (now > entry.resetTime) {
      inMemoryStore.delete(key);
    }
  }
}

// Cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  /** Number of requests allowed */
  limit: number;
  /** Time window in milliseconds */
  window: number;
}

/**
 * Check if request is rate limited
 * @param identifier Unique identifier (IP address, user ID, etc.)
 * @param config Rate limit configuration
 * @returns Object with success status and info
 */
async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ success: boolean; limit: number; remaining: number; resetTime: number }> {
  const now = Date.now();

  // Skip rate limiting if disabled (testing only)
  const isRateLimitDisabled = process.env.RATE_LIMIT_DISABLED === "true";
  if (isRateLimitDisabled) {
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit,
      resetTime: now + config.window,
    };
  }

  const key = `ratelimit:${identifier}`;
  let entry = inMemoryStore.get(key);

  // Reset if window expired
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + config.window,
    };
    inMemoryStore.set(key, entry);
  }

  // Increment counter
  entry.count++;

  // Check if limit exceeded
  const success = entry.count <= config.limit;
  const remaining = Math.max(0, config.limit - entry.count);

  return {
    success,
    limit: config.limit,
    remaining,
    resetTime: entry.resetTime,
  };
}

/**
 * Rate limit middleware for API routes
 * Usage in route handlers:
 *
 * export async function POST(request: NextRequest) {
 *   const result = await checkRateLimit(request);
 *   if (!result.success) {
 *     return NextResponse.json(
 *       { error: "Too many requests" },
 *       { status: 429, headers: { "X-RateLimit-Limit": String(result.limit) } }
 *     );
 *   }
 *   // ... rest of handler
 * }
 */
export async function checkRateLimit(
  request: Request,
  config: RateLimitConfig = { limit: 10, window: 60000 } // 10 requests per minute by default
): Promise<{ success: boolean; limit: number; remaining: number; resetTime: number }> {
  // Use IP address as identifier
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous";

  return rateLimit(ip, config);
}

/**
 * Predefined rate limit configurations
 */
export const RateLimits = {
  // Login: 5 attempts per 15 minutes
  login: { limit: 5, window: 15 * 60 * 1000 },

  // API endpoints: 60 requests per minute
  api: { limit: 60, window: 60 * 1000 },

  // Public actions (like, copy, dislike): 10 per minute
  publicAction: { limit: 10, window: 60 * 1000 },

  // Views: slightly higher, still capped per IP
  publicView: { limit: 30, window: 60 * 1000 },

  // View dedup window per IP + promocode (skip increment if exceeded)
  viewDedup: { limit: 1, window: 10 * 60 * 1000 },

  // Contact form: 3 per hour
  contact: { limit: 3, window: 60 * 60 * 1000 },

  // Search: 20 per minute (stricter for expensive operations)
  search: { limit: 20, window: 60 * 1000 },

  // Admin API: 60 requests per minute
  admin: { limit: 60, window: 60 * 1000 },
} as const;

/**
 * Rate limit by arbitrary key (IP + resource id, etc.)
 */
export async function checkRateLimitKey(
  key: string,
  config: RateLimitConfig
): Promise<{ success: boolean; limit: number; remaining: number; resetTime: number }> {
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
