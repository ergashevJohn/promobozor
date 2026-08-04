import * as dotenv from "dotenv";
import type { Config } from "drizzle-kit";

dotenv.config();

function getDatabaseUrl(): string {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    // For generate command, we don't need database connection
    // Return a dummy URL to avoid errors
    if (process.argv.includes("generate")) {
      return "postgresql://dummy:dummy@localhost:5432/dummy";
    }
    throw new Error("DATABASE_URL is not set in .env file");
  }

  return dbUrl;
}

export default {
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./drizzle",
  // Only provide dbCredentials if DATABASE_URL is set and not generating
  // For generate command, drizzle-kit doesn't need database connection
  ...(process.env.DATABASE_URL && !process.argv.includes("generate")
    ? {
        dbCredentials: {
          url: getDatabaseUrl(),
        },
      }
    : {}),
} satisfies Config;
