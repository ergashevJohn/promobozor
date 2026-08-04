CREATE TABLE IF NOT EXISTS "clients" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"telegram_id" varchar(64) NOT NULL,
	"username" varchar(255),
	"first_name" varchar(255),
	"last_name" varchar(255),
	"language_code" varchar(10),
	"is_bot" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clients_telegram_id_unique" UNIQUE("telegram_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_settings" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" text NOT NULL,
	"preferred_language" "language",
	"notifications_enabled" boolean DEFAULT true NOT NULL,
	"recent_searches" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"recent_promocode_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_seen_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "client_settings_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_two_factor" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"secret" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"backup_codes" text,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_two_factor_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "promocodes" ADD COLUMN "order" integer NOT NULL;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "client_settings" ADD CONSTRAINT "client_settings_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_two_factor" ADD CONSTRAINT "user_two_factor_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "client_settings_client_id_idx" ON "client_settings" USING btree ("client_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "clients_telegram_id_idx" ON "clients" USING btree ("telegram_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "clients_created_at_idx" ON "clients" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_two_factor_user_id_idx" ON "user_two_factor" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promocodes_order_idx" ON "promocodes" USING btree ("order");
--> statement-breakpoint
-- If the unique index already exists, attach it as a constraint instead of erroring.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'promocodes_order_unique'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_index i ON i.indexrelid = c.oid
      WHERE c.relname = 'promocodes_order_unique'
    ) THEN
      ALTER TABLE "promocodes"
        ADD CONSTRAINT "promocodes_order_unique"
        UNIQUE USING INDEX "promocodes_order_unique";
    ELSE
      ALTER TABLE "promocodes"
        ADD CONSTRAINT "promocodes_order_unique"
        UNIQUE("order");
    END IF;
  END IF;
END $$;
