/**
 * Redis-based rate limiter for production
 * Uses Upstash Redis for distributed rate limiting
 *
 * IMPORTANT: Redis is REQUIRED in production!
 * In-memory fallback is only allowed in development.
 *
 * Environment variables:
 * - UPSTASH_REDIS_REST_URL: Redis REST API URL (required in production)
 * - UPSTASH_REDIS_REST_TOKEN: Redis authentication token (required in production)
 * - RATE_LIMIT_DISABLED: Set to "true" to disable rate limiting (testing only)
 */
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Initialize Redis client
let redis: Redis | null = null;
const inMemoryStore = new Map<string, RateLimitEntry>();

// Track if we've already warned about missing Redis
let hasWarnedAboutMissingRedis = false;

// Check for Redis configuration
const hasRedisConfig = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

if (hasRedisConfig) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  console.log("✅ Redis rate limiter initialized");
} else if (process.env.NODE_ENV !== "production") {
  console.warn("⚠️  Using in-memory rate limiting (development only)");
  console.warn("   This will NOT work correctly in multi-instance deployments!");
}

/**
 * Check Redis requirement for production at runtime
 * This allows the module to be imported during build
 */
function checkProductionRedisRequirement(): void {
  const isProduction = process.env.NODE_ENV === "production";
  const isRateLimitDisabled = process.env.RATE_LIMIT_DISABLED === "true";

  if (isProduction && !hasRedisConfig && !isRateLimitDisabled) {
    if (!hasWarnedAboutMissingRedis) {
      hasWarnedAboutMissingRedis = true;
      console.error("❌ CRITICAL: Redis is not configured in production!");
      console.error("   Rate limiting requires Redis for distributed environments.");
      console.error("   Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.");
      console.error("   Or set RATE_LIMIT_DISABLED=true to disable (NOT RECOMMENDED).");
    }

    throw new Error(
      "Redis configuration is required in production. " +
        "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables."
    );
  }
}

/**
 * Clean up expired in-memory entries (fallback only)
 */
function cleanupRateLimitStore() {
  if (redis) return; // Skip cleanup if using Redis

  const now = Date.now();
  for (const [key, entry] of inMemoryStore.entries()) {
    if (now > entry.resetTime) {
      inMemoryStore.delete(key);
    }
  }
}

// Cleanup every 5 minutes (in-memory fallback only)
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
  const windowStart = Math.floor(now / config.window) * config.window;
  const key = `ratelimit:${identifier}:${windowStart}`;

  // Skip rate limiting if disabled (testing only)
  const isRateLimitDisabled = process.env.RATE_LIMIT_DISABLED === "true";
  if (isRateLimitDisabled) {
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit,
      resetTime: windowStart + config.window,
    };
  }

  // Check Redis requirement for production at runtime (not during build)
  checkProductionRedisRequirement();

  // Use Redis for distributed rate limiting
  if (redis) {
    try {
      // Redis-based rate limiting with atomic increment
      const current = await redis.incr(key);

      // Set expiration on first request
      if (current === 1) {
        await redis.expireat(key, Math.floor((windowStart + config.window) / 1000));
      }

      const success = current <= config.limit;
      const remaining = Math.max(0, config.limit - current);

      return {
        success,
        limit: config.limit,
        remaining,
        resetTime: windowStart + config.window,
      };
    } catch (error) {
      // Log Redis error but don't fail the request
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("❌ Redis rate limit error:", errorMsg);

      // Check if it's a connection error (ENOTFOUND, ECONNREFUSED, etc.)
      const isConnectionError =
        errorMsg.includes("ENOTFOUND") ||
        errorMsg.includes("ECONNREFUSED") ||
        errorMsg.includes("ETIMEDOUT") ||
        errorMsg.includes("fetch failed");

      // For connection errors, fail open in all environments
      // Redis might be temporarily unavailable
      if (isConnectionError) {
        console.warn("⚠️  Redis unavailable - using fallback (request allowed)");
        return {
          success: true,
          limit: config.limit,
          remaining: config.limit,
          resetTime: windowStart + config.window,
        };
      }

      // In production, fail open for other Redis errors too
      if (process.env.NODE_ENV === "production") {
        console.error("⚠️  Rate limiting bypassed due to Redis error - monitor for abuse!");
        return {
          success: true,
          limit: config.limit,
          remaining: config.limit,
          resetTime: windowStart + config.window,
        };
      }

      // In development, fall through to in-memory
      console.warn("⚠️  Falling back to in-memory rate limiting");
    }
  }

  // Fallback to in-memory (development only)
  // This should never be reached in production due to the startup check
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

  // Public actions (like, view, copy): 10 per minute
  publicAction: { limit: 10, window: 60 * 1000 },

  // Contact form: 3 per hour
  contact: { limit: 3, window: 60 * 60 * 1000 },

  // Search: 20 per minute (stricter for expensive operations)
  search: { limit: 20, window: 60 * 1000 },

  // Admin API: 60 requests per minute
  admin: { limit: 60, window: 60 * 1000 },
} as const;

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
