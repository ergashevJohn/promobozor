import { NextResponse } from "next/server";

/**
 * Unified error handling for API routes
 * Provides consistent error responses across all endpoints
 */

export class ApiError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const ErrorCodes = {
  // Validation Errors (400)
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_FIELD: "MISSING_FIELD",
  INVALID_FORMAT: "INVALID_FORMAT",
  INVALID_ENUM: "INVALID_ENUM",

  // Not Found Errors (404)
  NOT_FOUND: "NOT_FOUND",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",

  // Conflict Errors (409)
  CONFLICT: "CONFLICT",
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
  ALREADY_EXISTS: "ALREADY_EXISTS",

  // Auth Errors (401)
  UNAUTHORIZED: "UNAUTHORIZED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",

  // Forbidden Errors (403)
  FORBIDDEN: "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",

  // Rate Limit Errors (429)
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",

  // Server Errors (500)
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
} as const;

/**
 * Convert ApiError to NextResponse
 */
export function apiErrorToResponse(error: unknown): NextResponse {
  console.error("API Error:", error);

  // Handle ApiError instances
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(error.details && { details: error.details }),
      },
      { status: error.statusCode }
    );
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    // Check for specific error messages
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized", code: ErrorCodes.UNAUTHORIZED },
        {
          status: 401,
        }
      );
    }
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden", code: ErrorCodes.FORBIDDEN }, { status: 403 });
    }

    // Generic error
    return NextResponse.json(
      { error: "Internal server error", code: ErrorCodes.INTERNAL_ERROR },
      { status: 500 }
    );
  }

  // Unknown error type
  return NextResponse.json(
    { error: "Internal server error", code: ErrorCodes.INTERNAL_ERROR },
    { status: 500 }
  );
}

/**
 * Validate Content-Type header
 */
export function validateContentType(request: Request): NextResponse | null {
  const contentType = request.headers.get("content-type");

  // Only validate for POST, PUT, PATCH requests
  if (!["POST", "PUT", "PATCH"].includes(request.method)) {
    return null;
  }

  if (!contentType?.includes("application/json")) {
    return NextResponse.json(
      {
        error: "Content-Type must be application/json",
        code: ErrorCodes.INVALID_FORMAT,
      },
      { status: 415 }
    );
  }

  return null;
}
