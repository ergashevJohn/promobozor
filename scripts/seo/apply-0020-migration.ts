import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const sql = postgres(process.env.DATABASE_URL, { max: 1 });
  const migrationPath = resolve("drizzle/0020_content_seo_fields.sql");
  const raw = readFileSync(migrationPath, "utf8");
  const statements = raw
    .split("--> statement-breakpoint")
    .map((part) => part.trim())
    .filter(Boolean);

  for (const statement of statements) {
    console.log("Running:", statement.slice(0, 80).replace(/\s+/g, " "), "...");
    await sql.unsafe(statement);
  }

  console.log("Applied 0020_content_seo_fields.sql");
  await sql.end();
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
