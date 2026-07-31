CREATE TYPE "public"."response_status" AS ENUM('pending_verification', 'verified');--> statement-breakpoint
DROP INDEX "responses_announcement_created_idx";--> statement-breakpoint
ALTER TABLE "responses" ADD COLUMN "status" "response_status" DEFAULT 'pending_verification' NOT NULL;--> statement-breakpoint
ALTER TABLE "responses" ADD COLUMN "verification_token_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "responses" ADD COLUMN "verification_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "responses" ADD COLUMN "verified_at" timestamp with time zone;--> statement-breakpoint
UPDATE "responses"
SET
  "status" = 'verified',
  "verification_token_hash" = md5(random()::text || clock_timestamp()::text || "id"::text) || md5("id"::text || random()::text),
  "verification_expires_at" = "created_at",
  "verified_at" = "created_at";--> statement-breakpoint
ALTER TABLE "responses" ALTER COLUMN "verification_token_hash" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "responses" ALTER COLUMN "verification_expires_at" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "responses_verification_token_unique" ON "responses" USING btree ("verification_token_hash");--> statement-breakpoint
CREATE INDEX "responses_announcement_created_idx" ON "responses" USING btree ("announcement_id","status","created_at");
