CREATE TYPE "public"."promocode_feedback_result" AS ENUM('worked', 'failed');
CREATE TYPE "public"."promocode_feedback_reason" AS ENUM('invalid_or_expired', 'new_customer_only', 'min_order_or_product', 'region_app_or_payment', 'other');
CREATE TYPE "public"."promocode_feedback_source" AS ENUM('card', 'detail');
CREATE TYPE "public"."partner_inquiry_type" AS ENUM('direct_brand', 'cpa_network');
CREATE TYPE "public"."partner_inquiry_status" AS ENUM('new', 'in_progress', 'closed');

ALTER TABLE "promocodes" ADD COLUMN "worked_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "promocodes" ADD COLUMN "failed_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "promocodes" ADD COLUMN "needs_review" boolean DEFAULT false NOT NULL;
ALTER TABLE "promocodes" ADD COLUMN "published_at" timestamp with time zone;

-- Historical offers keep their original availability date; publication never follows edits.
UPDATE "promocodes"
SET "published_at" = COALESCE("starts_at" AT TIME ZONE 'UTC', "created_at" AT TIME ZONE 'UTC')
WHERE "published_at" IS NULL;

CREATE OR REPLACE FUNCTION public.set_promocode_published_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'active' AND NEW.published_at IS NULL THEN
    NEW.published_at := COALESCE(NEW.starts_at AT TIME ZONE 'UTC', NOW());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER promocodes_set_published_at
BEFORE INSERT OR UPDATE OF status ON "promocodes"
FOR EACH ROW EXECUTE FUNCTION public.set_promocode_published_at();

CREATE INDEX "promocodes_active_published_idx" ON "promocodes" USING btree ("published_at" DESC) WHERE "promocodes"."status" = 'active' AND "promocodes"."published_at" IS NOT NULL;

CREATE TABLE "offer_tags" (
  "key" varchar(64) PRIMARY KEY NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "promocode_tags" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "promocode_id" text NOT NULL REFERENCES "promocodes"("id") ON DELETE cascade,
  "tag_key" varchar(64) NOT NULL REFERENCES "offer_tags"("key") ON DELETE cascade,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "promocode_tags_promocode_tag_unique" UNIQUE("promocode_id", "tag_key")
);
CREATE INDEX "promocode_tags_tag_promocode_idx" ON "promocode_tags" USING btree ("tag_key", "promocode_id");

CREATE TABLE "promocode_feedback" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "promocode_id" text NOT NULL REFERENCES "promocodes"("id") ON DELETE cascade,
  "result" "promocode_feedback_result" NOT NULL,
  "failure_reason" "promocode_feedback_reason",
  "source" "promocode_feedback_source" NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "promocode_feedback_reason_matches_result" CHECK (("result" = 'failed') = ("failure_reason" IS NOT NULL))
);
CREATE INDEX "promocode_feedback_promocode_created_idx" ON "promocode_feedback" USING btree ("promocode_id", "created_at");
CREATE INDEX "promocode_feedback_result_created_idx" ON "promocode_feedback" USING btree ("result", "created_at");

CREATE TABLE "partner_inquiries" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company" varchar(255) NOT NULL,
  "contact_person" varchar(255) NOT NULL,
  "work_email" varchar(255) NOT NULL,
  "phone" varchar(50),
  "telegram" varchar(100),
  "website" varchar(500),
  "partner_type" "partner_inquiry_type" NOT NULL,
  "requested_formats" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "campaign_description" text NOT NULL,
  "valid_until" timestamp with time zone,
  "tracking_details" text,
  "privacy_accepted_at" timestamp with time zone NOT NULL,
  "status" "partner_inquiry_status" DEFAULT 'new' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX "partner_inquiries_status_created_idx" ON "partner_inquiries" USING btree ("status", "created_at");
CREATE INDEX "partner_inquiries_work_email_idx" ON "partner_inquiries" USING btree ("work_email");

-- These tables are written only by server-side code; the Supabase Data API has no access.
ALTER TABLE "offer_tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "promocode_tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "promocode_feedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "partner_inquiries" ENABLE ROW LEVEL SECURITY;
