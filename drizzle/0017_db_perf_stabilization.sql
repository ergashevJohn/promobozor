-- Schema sync + performance indexes + security harden
-- Categories self-referential FK
ALTER TABLE "categories"
  DROP CONSTRAINT IF EXISTS "categories_parent_id_fkey";
--> statement-breakpoint
ALTER TABLE "categories"
  ADD CONSTRAINT "categories_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "categories_parent_id_idx" ON "categories" ("parent_id");
--> statement-breakpoint

-- Partial indexes for public listing sorts (from orphaned 0014 SQL)
CREATE INDEX IF NOT EXISTS "promocodes_active_copy_count_idx"
  ON "promocodes" ("copy_count" DESC, "is_featured" DESC)
  WHERE "status" = 'active';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promocodes_active_expires_idx"
  ON "promocodes" ("expires_at" ASC, "is_featured" DESC)
  WHERE "status" = 'active' AND "expires_at" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promocodes_active_created_idx"
  ON "promocodes" ("created_at" DESC, "is_featured" DESC)
  WHERE "status" = 'active';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promocodes_active_views_idx"
  ON "promocodes" ("views_count" DESC, "is_featured" DESC)
  WHERE "status" = 'active';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promocodes_featured_active_idx"
  ON "promocodes" ("order" ASC, "expires_at" DESC)
  WHERE "is_featured" = true AND "status" = 'active';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promocode_translations_lang_title_idx"
  ON "promocode_translations" ("language", "title");
--> statement-breakpoint

-- Harden: revoke public execute on SECURITY DEFINER helper
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
--> statement-breakpoint
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;
