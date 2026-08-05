import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Database Connection Pool Configuration
 *
 * Environment variables:
 * - DATABASE_URL: PostgreSQL connection string (required)
 * - DB_POOL_MAX: Maximum connections (default: 5 for production and development; 1 during build)
 * - DB_POOL_IDLE_TIMEOUT: Idle timeout in seconds (default: 20)
 * - DB_POOL_CONNECT_TIMEOUT: Connection timeout in seconds (default: 10)
 * - DB_POOL_MAX_LIFETIME: Max connection lifetime in seconds (default: 1800 = 30 min)
 */

const isProduction = process.env.NODE_ENV === "production";
const isBuild =
  process.env.NEXT_BUILD === "1" ||
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NEXT_PHASE?.includes("build");

function getDefaultPoolMax(): string {
  if (isBuild) return "1"; // Limit to 1 connection per worker during build to avoid Supabase limits
  // Serverless + Supabase pooler: keep low to avoid connection exhaustion across instances
  if (isProduction) return "5";
  return "5";
}

function shouldUseSsl(dbUrl: string): boolean | "require" {
  try {
    const host = new URL(dbUrl).hostname;
    return host === "localhost" || host === "127.0.0.1" ? false : "require";
  } catch {
    return false;
  }
}

const poolConfig = {
  max: parseInt(process.env.DB_POOL_MAX || getDefaultPoolMax(), 10),
  idle_timeout: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || (isBuild ? "2" : "20"), 10),
  connect_timeout: parseInt(process.env.DB_POOL_CONNECT_TIMEOUT || "15", 10),
  max_lifetime: parseInt(process.env.DB_POOL_MAX_LIFETIME || (isBuild ? "60" : "1800"), 10),
};

// Singleton pattern for database client in development/HMR
declare global {
  var dbClient: postgres.Sql | undefined;
  var dbExitHandlersRegistered: boolean | undefined;
}

let client: postgres.Sql;

if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL is not set. Please set it in your .env file");
  // Create a dummy connection for development (will fail on actual queries)
  client = postgres("postgresql://dummy:dummy@localhost:5432/dummy", {
    prepare: false,
    max: 1,
  });
} else {
  const dbUrl = process.env.DATABASE_URL;

  const ssl = shouldUseSsl(dbUrl);

  if (isProduction) {
    // Production: Always create a new client (serverless handles its own lifecycle)
    client = postgres(dbUrl, {
      prepare: false,
      max: poolConfig.max,
      idle_timeout: poolConfig.idle_timeout,
      connect_timeout: poolConfig.connect_timeout,
      max_lifetime: poolConfig.max_lifetime,
      onnotice: () => {}, // Suppress notices
      transform: {
        undefined: null,
      },
      ssl,
    });
  } else {
    // Development: Use singleton to prevent connection leaks during HMR
    if (!globalThis.dbClient) {
      console.log(
        `📊 Initializing database pool: max=${poolConfig.max}, idle_timeout=${poolConfig.idle_timeout}s`
      );
      globalThis.dbClient = postgres(dbUrl, {
        prepare: false,
        max: poolConfig.max,
        idle_timeout: poolConfig.idle_timeout,
        connect_timeout: poolConfig.connect_timeout,
        max_lifetime: poolConfig.max_lifetime,
        onnotice: () => {},
        transform: {
          undefined: null,
        },
        ssl,
      });

      // Test connection
      globalThis.dbClient`SELECT 1`
        .then(() => {
          console.log("✅ Database connection established");
        })
        .catch((err) => {
          console.error("❌ Database connection error:", err.message);
        });
    }
    client = globalThis.dbClient;
  }
}

// Create drizzle instance
export const db = drizzle(client, { schema });

// Close connection on process exit (register once to avoid HMR MaxListeners leaks)
if (typeof process !== "undefined" && !isProduction && !globalThis.dbExitHandlersRegistered) {
  const handleExit = async () => {
    if (globalThis.dbClient) {
      console.log("🔌 Closing database connections...");
      await globalThis.dbClient.end();
      globalThis.dbClient = undefined;
    }
  };
  process.on("SIGINT", handleExit);
  process.on("SIGTERM", handleExit);
  globalThis.dbExitHandlersRegistered = true;
}
