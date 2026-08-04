DO $$ BEGIN
 CREATE TYPE "public"."currency" AS ENUM('UZS', 'USD', 'EUR');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "promocodes" ADD COLUMN "currency" "currency" DEFAULT 'UZS' NOT NULL;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;
