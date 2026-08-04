DO $$ BEGIN
 ALTER TABLE "promocodes" DROP CONSTRAINT "promocodes_store_id_stores_id_fk";
EXCEPTION
 WHEN undefined_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "brand_translations" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "brand_translations" ALTER COLUMN "slug" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "brand_translations" ALTER COLUMN "meta_title" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "brand_translations" ALTER COLUMN "meta_description" SET DATA TYPE varchar(500);--> statement-breakpoint
ALTER TABLE "category_translations" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "category_translations" ALTER COLUMN "slug" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "category_translations" ALTER COLUMN "meta_title" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "category_translations" ALTER COLUMN "meta_description" SET DATA TYPE varchar(500);--> statement-breakpoint
ALTER TABLE "contacts" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "contacts" ALTER COLUMN "phone" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "contacts" ALTER COLUMN "ip_address" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "promocode_translations" ALTER COLUMN "title" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "promocode_translations" ALTER COLUMN "slug" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "promocode_translations" ALTER COLUMN "meta_title" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "promocode_translations" ALTER COLUMN "meta_description" SET DATA TYPE varchar(500);--> statement-breakpoint
ALTER TABLE "promocodes" ALTER COLUMN "code" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "promocodes" ALTER COLUMN "store_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "store_translations" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "store_translations" ALTER COLUMN "slug" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "store_translations" ALTER COLUMN "meta_title" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "store_translations" ALTER COLUMN "meta_description" SET DATA TYPE varchar(500);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET DATA TYPE varchar(255);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "promocodes" ADD CONSTRAINT "promocodes_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promocodes_code_idx" ON "promocodes" USING btree ("code");
