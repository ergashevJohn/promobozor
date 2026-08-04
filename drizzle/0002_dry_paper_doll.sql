DO $$ BEGIN
 ALTER TABLE "brand_translations" ADD COLUMN "description" text;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "category_translations" ADD COLUMN "description" text;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;
