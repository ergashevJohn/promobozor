DO $$ BEGIN
 ALTER TABLE "promocodes" ADD COLUMN "likes_count" integer DEFAULT 0 NOT NULL;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "promocodes" ADD COLUMN "dislikes_count" integer DEFAULT 0 NOT NULL;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;
