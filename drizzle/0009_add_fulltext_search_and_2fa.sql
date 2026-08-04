-- Add Two-Factor Authentication table
CREATE TABLE IF NOT EXISTS "user_two_factor" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "secret" text NOT NULL,
  "enabled" boolean NOT NULL DEFAULT false,
  "backup_codes" text,
  "last_used_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "user_two_factor_user_id_idx" ON "user_two_factor" ("user_id");--> statement-breakpoint

-- Add Full-Text Search support for promocode translations
-- Add tsvector column for full-text search
ALTER TABLE "promocode_translations"
ADD COLUMN IF NOT EXISTS "search_vector" tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('simple', coalesce("title", '')), 'A') ||
  setweight(to_tsvector('simple', coalesce("short_description", '')), 'B')
) STORED;--> statement-breakpoint

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS "promocode_translations_search_idx"
ON "promocode_translations" USING GIN("search_vector");--> statement-breakpoint

-- Add full-text search for store translations
ALTER TABLE "store_translations"
ADD COLUMN IF NOT EXISTS "search_vector" tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('simple', coalesce("name", '')), 'A') ||
  setweight(to_tsvector('simple', coalesce("description", '')), 'B')
) STORED;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "store_translations_search_idx"
ON "store_translations" USING GIN("search_vector");--> statement-breakpoint

-- Add full-text search for category translations
ALTER TABLE "category_translations"
ADD COLUMN IF NOT EXISTS "search_vector" tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('simple', coalesce("name", '')), 'A') ||
  setweight(to_tsvector('simple', coalesce("description", '')), 'B')
) STORED;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "category_translations_search_idx"
ON "category_translations" USING GIN("search_vector");--> statement-breakpoint

-- Add full-text search for brand translations
ALTER TABLE "brand_translations"
ADD COLUMN IF NOT EXISTS "search_vector" tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('simple', coalesce("name", '')), 'A') ||
  setweight(to_tsvector('simple', coalesce("description", '')), 'B')
) STORED;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "brand_translations_search_idx"
ON "brand_translations" USING GIN("search_vector");
