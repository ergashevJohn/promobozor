CREATE TYPE "public"."telegram_post_status" AS ENUM('pending', 'scheduled', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."telegram_template_type" AS ENUM('minimal', 'standard', 'rich');--> statement-breakpoint
CREATE TABLE "telegram_posts" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "telegram_post_status" DEFAULT 'pending' NOT NULL,
	"template_type" "telegram_template_type" NOT NULL,
	"custom_message" text,
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"channel_message_id" text,
	"channel_username" varchar(255),
	"broadcast_count" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"promocode_id" text,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telegram_templates" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "telegram_template_type" NOT NULL,
	"content_uz" text NOT NULL,
	"content_ru" text NOT NULL,
	"content_en" text NOT NULL,
	"include_image" boolean DEFAULT true NOT NULL,
	"include_store_link" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "telegram_templates_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "telegram_posts" ADD CONSTRAINT "telegram_posts_promocode_id_promocodes_id_fk" FOREIGN KEY ("promocode_id") REFERENCES "public"."promocodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_posts" ADD CONSTRAINT "telegram_posts_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_templates" ADD CONSTRAINT "telegram_templates_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "telegram_posts_status_idx" ON "telegram_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "telegram_posts_scheduled_at_idx" ON "telegram_posts" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "telegram_posts_promocode_id_idx" ON "telegram_posts" USING btree ("promocode_id");--> statement-breakpoint
CREATE INDEX "telegram_posts_created_by_id_idx" ON "telegram_posts" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "telegram_templates_is_active_idx" ON "telegram_templates" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "telegram_templates_type_idx" ON "telegram_templates" USING btree ("type");