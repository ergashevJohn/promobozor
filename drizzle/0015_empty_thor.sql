CREATE TABLE "redirects" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_path" varchar(500) NOT NULL,
	"to_path" varchar(500) NOT NULL,
	"entity_type" varchar(20) NOT NULL,
	"status_code" integer DEFAULT 301 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL,
	"last_hit_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "redirects_from_path_unique" UNIQUE("from_path")
);
--> statement-breakpoint
CREATE INDEX "redirects_from_path_idx" ON "redirects" USING btree ("from_path");--> statement-breakpoint
CREATE INDEX "redirects_entity_type_idx" ON "redirects" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "redirects_is_active_idx" ON "redirects" USING btree ("is_active");