ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "last_reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "last_reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "last_reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "promocodes" ADD COLUMN IF NOT EXISTS "last_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "promocodes" ADD COLUMN IF NOT EXISTS "min_order_amount" integer;--> statement-breakpoint
ALTER TABLE "store_translations" ADD COLUMN IF NOT EXISTS "short_summary" text;--> statement-breakpoint
ALTER TABLE "store_translations" ADD COLUMN IF NOT EXISTS "body_html" text;--> statement-breakpoint
ALTER TABLE "store_translations" ADD COLUMN IF NOT EXISTS "how_to_html" text;--> statement-breakpoint
ALTER TABLE "store_translations" ADD COLUMN IF NOT EXISTS "faq_json" jsonb;--> statement-breakpoint
ALTER TABLE "category_translations" ADD COLUMN IF NOT EXISTS "short_summary" text;--> statement-breakpoint
ALTER TABLE "category_translations" ADD COLUMN IF NOT EXISTS "body_html" text;--> statement-breakpoint
ALTER TABLE "category_translations" ADD COLUMN IF NOT EXISTS "how_to_html" text;--> statement-breakpoint
ALTER TABLE "category_translations" ADD COLUMN IF NOT EXISTS "faq_json" jsonb;--> statement-breakpoint
ALTER TABLE "brand_translations" ADD COLUMN IF NOT EXISTS "short_summary" text;--> statement-breakpoint
ALTER TABLE "brand_translations" ADD COLUMN IF NOT EXISTS "body_html" text;--> statement-breakpoint
ALTER TABLE "brand_translations" ADD COLUMN IF NOT EXISTS "how_to_html" text;--> statement-breakpoint
ALTER TABLE "brand_translations" ADD COLUMN IF NOT EXISTS "faq_json" jsonb;--> statement-breakpoint
ALTER TABLE "promocode_translations" ADD COLUMN IF NOT EXISTS "how_to_html" text;--> statement-breakpoint
ALTER TABLE "promocode_translations" ADD COLUMN IF NOT EXISTS "faq_json" jsonb;--> statement-breakpoint
ALTER TABLE "promocode_translations" ADD COLUMN IF NOT EXISTS "editor_verdict" varchar(300);
