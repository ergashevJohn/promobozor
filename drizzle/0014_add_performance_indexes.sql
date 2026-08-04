-- Performance optimization indexes
-- Additional indexes for improved query performance

-- Index for popular sorting (copyCount DESC)
-- Helps with "sortBy=popular" queries
CREATE INDEX IF NOT EXISTS "promocodes_active_copy_count_idx" ON "promocodes" ("copy_count" DESC, "is_featured" DESC) WHERE "status" = 'active';

-- Index for ending soon sorting (expiresAt ASC)
-- Helps with "sortBy=ending" queries
CREATE INDEX IF NOT EXISTS "promocodes_active_expires_idx" ON "promocodes" ("expires_at" ASC, "is_featured" DESC) WHERE "status" = 'active' AND "expires_at" IS NOT NULL;

-- Index for created_at sorting (newest first)
-- Helps with "sortBy=newest" queries
CREATE INDEX IF NOT EXISTS "promocodes_active_created_idx" ON "promocodes" ("created_at" DESC, "is_featured" DESC) WHERE "status" = 'active';

-- Index for views count (trending/promoted sorting)
CREATE INDEX IF NOT EXISTS "promocodes_active_views_idx" ON "promocodes" ("views_count" DESC, "is_featured" DESC) WHERE "status" = 'active';

-- Partial index for active featured promocodes only
-- Improves homepage featured section queries
CREATE INDEX IF NOT EXISTS "promocodes_featured_active_idx" ON "promocodes" ("order" ASC, "expires_at" DESC) WHERE "is_featured" = true AND "status" = 'active';

-- Index for stores table (isActive filtering)
CREATE INDEX IF NOT EXISTS "stores_is_active_idx" ON "stores" ("is_active") WHERE "is_active" = true;

-- Index for promocode_translations (language + title prefix search)
-- Helps with title-based filtering and search
CREATE INDEX IF NOT EXISTS "promocode_translations_lang_title_idx" ON "promocode_translations" ("language", "title");

-- Index for store_translations (slug lookups)
CREATE INDEX IF NOT EXISTS "store_translations_lang_slug_idx" ON "store_translations" ("language", "slug");

-- Index for category_translations (slug lookups)
CREATE INDEX IF NOT EXISTS "category_translations_lang_slug_idx" ON "category_translations" ("language", "slug");

-- Index for brand_translations (slug lookups)
CREATE INDEX IF NOT EXISTS "brand_translations_lang_slug_idx" ON "brand_translations" ("language", "slug");
