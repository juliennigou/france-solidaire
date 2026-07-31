CREATE TYPE "public"."announcement_kind" AS ENUM('need', 'offer');--> statement-breakpoint
CREATE TYPE "public"."announcement_status" AS ENUM('pending', 'active', 'matched', 'closed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."outbox_status" AS ENUM('pending', 'sending', 'sent', 'failed');--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid,
	"kind" "announcement_kind" NOT NULL,
	"category" varchar(40) NOT NULL,
	"title" varchar(100) NOT NULL,
	"description" varchar(1000) NOT NULL,
	"first_name" varchar(80) NOT NULL,
	"email" varchar(320) NOT NULL,
	"commune" varchar(120) NOT NULL,
	"availability" varchar(160) NOT NULL,
	"status" "announcement_status" DEFAULT 'active' NOT NULL,
	"moderation_note" text,
	"management_token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone DEFAULT now() + interval '90 days' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "announcements_category_check" CHECK ("announcements"."category" in ('Transport', 'Matériel', 'Nettoyage', 'Travaux', 'Hébergement', 'Animaux', 'Démarches', 'Autre'))
);
--> statement-breakpoint
CREATE TABLE "email_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" varchar(40) NOT NULL,
	"to_email" varchar(320) NOT NULL,
	"subject" varchar(180) NOT NULL,
	"text_body" text NOT NULL,
	"html_body" text NOT NULL,
	"status" "outbox_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_error" varchar(800),
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "magic_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"first_name" varchar(80),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"key_hash" varchar(64) NOT NULL,
	"action" varchar(40) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"announcement_id" uuid NOT NULL,
	"reason" varchar(40) NOT NULL,
	"details" varchar(600),
	"reporter_key_hash" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"announcement_id" uuid NOT NULL,
	"first_name" varchar(80) NOT NULL,
	"email" varchar(320) NOT NULL,
	"message" varchar(1200) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "announcements_management_token_unique" ON "announcements" USING btree ("management_token_hash");--> statement-breakpoint
CREATE INDEX "announcements_feed_idx" ON "announcements" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "announcements_kind_category_feed_idx" ON "announcements" USING btree ("kind","category","status","created_at");--> statement-breakpoint
CREATE INDEX "announcements_owner_idx" ON "announcements" USING btree ("profile_id","created_at");--> statement-breakpoint
CREATE INDEX "email_outbox_delivery_idx" ON "email_outbox" USING btree ("status","next_attempt_at","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "magic_links_token_hash_unique" ON "magic_links" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "magic_links_email_created_idx" ON "magic_links" USING btree ("email","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_email_lower_unique" ON "profiles" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "rate_limits_lookup_idx" ON "rate_limits" USING btree ("key_hash","action","created_at");--> statement-breakpoint
CREATE INDEX "reports_announcement_created_idx" ON "reports" USING btree ("announcement_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "reports_announcement_reporter_unique" ON "reports" USING btree ("announcement_id","reporter_key_hash");--> statement-breakpoint
CREATE INDEX "responses_announcement_created_idx" ON "responses" USING btree ("announcement_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_hash_unique" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "sessions_profile_expiry_idx" ON "sessions" USING btree ("profile_id","expires_at");