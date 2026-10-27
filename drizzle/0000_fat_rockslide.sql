CREATE TYPE "public"."accommodation_key" AS ENUM('SHARED_BUNK', 'PRIVATE_ROOM');--> statement-breakpoint
CREATE TYPE "public"."article_status" AS ENUM('DRAFT', 'PUBLISHED', 'SCHEDULED');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."event_kind" AS ENUM('WORKSHOP', 'MEETUP', 'COMMUNITY');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('DRAFT', 'PUBLISHED', 'FULL', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."kyc_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('BANK_TRANSFER', 'RAAST', 'CARD_LINK', 'CASH_ON_ARRIVAL');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."proposal_status" AS ENUM('NEW', 'REVIEWED', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."registration_status" AS ENUM('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('ADMIN', 'USER');--> statement-breakpoint
CREATE TYPE "public"."social_platform" AS ENUM('INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'FACEBOOK', 'LINKEDIN');--> statement-breakpoint
CREATE TYPE "public"."studio_resource" AS ENUM('STUDIO', 'CALL_POD');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('PENDING', 'SENT', 'FAILED', 'SKIPPED');--> statement-breakpoint
CREATE TABLE "accommodation_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"key" "accommodation_key" NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"tagline" text NOT NULL,
	"description" text NOT NULL,
	"image" text NOT NULL,
	"features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"capacity_label" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "accommodation_types_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "agreements" (
	"id" serial PRIMARY KEY NOT NULL,
	"version" integer NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "article_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" integer NOT NULL,
	"tag_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "article_translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" integer NOT NULL,
	"lang" text NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text DEFAULT '' NOT NULL,
	"content" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer,
	"cover_image" text,
	"author_name" text DEFAULT 'Content Colony' NOT NULL,
	"author_role" text,
	"status" "article_status" DEFAULT 'DRAFT' NOT NULL,
	"published_at" timestamp with time zone,
	"featured" boolean DEFAULT false NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"og_image" text,
	"reading_minutes" integer DEFAULT 4 NOT NULL,
	"related_event_slug" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "beds" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" integer NOT NULL,
	"label" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_guests" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"full_name" text NOT NULL,
	"relationship" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference" text NOT NULL,
	"property_id" integer NOT NULL,
	"accommodation_type_id" integer NOT NULL,
	"room_id" integer,
	"bed_id" integer,
	"guest_name" text NOT NULL,
	"guest_email" text NOT NULL,
	"guest_phone" text NOT NULL,
	"guests_count" integer DEFAULT 1 NOT NULL,
	"check_in" date NOT NULL,
	"check_out" date NOT NULL,
	"nights" integer NOT NULL,
	"price_breakdown" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_pkr" integer NOT NULL,
	"currency" text DEFAULT 'PKR' NOT NULL,
	"status" "booking_status" DEFAULT 'PENDING_PAYMENT' NOT NULL,
	"min_stay_override" boolean DEFAULT false NOT NULL,
	"min_stay_override_reason" text,
	"source" text DEFAULT 'website',
	"utm" jsonb,
	"notes" text,
	"compliance_hotel_eye" boolean DEFAULT false NOT NULL,
	"compliance_temp_resident" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name_en" text NOT NULL,
	"name_ur" text,
	"description" text,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "check_in_outs" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"type" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	"by_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deposits" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"amount_pkr" integer NOT NULL,
	"status" text DEFAULT 'HELD' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_proposals" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizer_name" text NOT NULL,
	"email" text NOT NULL,
	"whatsapp" text NOT NULL,
	"brand" text,
	"social_url" text,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"preferred_date" date,
	"expected_attendees" integer,
	"ticket_suggestion" text,
	"requirements" text,
	"speaker_bio" text,
	"cover_image" text,
	"status" "proposal_status" DEFAULT 'NEW' NOT NULL,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"is_resident" boolean DEFAULT false NOT NULL,
	"booking_reference" text,
	"discount_pct" integer DEFAULT 0 NOT NULL,
	"price_pkr" integer DEFAULT 0 NOT NULL,
	"amount_due_pkr" integer DEFAULT 0 NOT NULL,
	"status" "registration_status" DEFAULT 'PENDING_PAYMENT' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"kind" "event_kind" DEFAULT 'WORKSHOP' NOT NULL,
	"category" text NOT NULL,
	"host_name" text,
	"host_role" text,
	"host_image" text,
	"image" text,
	"excerpt" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"outcomes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"schedule" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"start_date" date,
	"end_date" date,
	"time_label" text,
	"duration_label" text,
	"venue" text DEFAULT 'Content Colony, Johar Town' NOT NULL,
	"capacity" integer DEFAULT 30 NOT NULL,
	"ticket_pkr" integer DEFAULT 0 NOT NULL,
	"resident_discount_pct" integer,
	"status" "event_status" DEFAULT 'DRAFT' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"compliance_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "ghl_syncs" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" integer NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "sync_status" DEFAULT 'PENDING' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" integer,
	"bed_id" integer,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"reason" text NOT NULL,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kyc_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"doc_type" text NOT NULL,
	"id_number_last4" text,
	"file_path" text NOT NULL,
	"file_name" text NOT NULL,
	"mime" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"status" "kyc_status" DEFAULT 'PENDING' NOT NULL,
	"reviewed_by" integer,
	"reviewed_at" timestamp with time zone,
	"review_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel" text NOT NULL,
	"to_ref" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"status" text DEFAULT 'QUEUED' NOT NULL,
	"entity_type" text,
	"entity_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer,
	"event_registration_id" integer,
	"kind" text DEFAULT 'STAY' NOT NULL,
	"method" "payment_method" NOT NULL,
	"amount_pkr" integer NOT NULL,
	"status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"payer_reference" text,
	"note" text,
	"confirmed_by" integer,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"city" text DEFAULT 'Lahore' NOT NULL,
	"neighborhood" text DEFAULT 'Johar Town, H Block' NOT NULL,
	"address" text,
	"address_approved" boolean DEFAULT false NOT NULL,
	"map_embed_url" text,
	"map_directions_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "properties_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "rate_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"accommodation_type_id" integer NOT NULL,
	"name" text NOT NULL,
	"unit_nights" integer NOT NULL,
	"price_pkr" integer NOT NULL,
	"min_booking_nights" integer DEFAULT 3 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" serial PRIMARY KEY NOT NULL,
	"payment_id" integer NOT NULL,
	"amount_pkr" integer NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'REQUESTED' NOT NULL,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"name" text NOT NULL,
	"type" "accommodation_key" NOT NULL,
	"max_occupants" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signed_agreements" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"agreement_id" integer NOT NULL,
	"agreement_version" integer NOT NULL,
	"signer_name" text NOT NULL,
	"consent" boolean DEFAULT false NOT NULL,
	"signed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_hash" text,
	"document_html" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"platform" "social_platform" NOT NULL,
	"url" text DEFAULT '' NOT NULL,
	"thumbnail" text NOT NULL,
	"creator_name" text NOT NULL,
	"creator_handle" text,
	"caption" text DEFAULT '' NOT NULL,
	"category" text,
	"featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "studio_reservations" (
	"id" serial PRIMARY KEY NOT NULL,
	"resource" "studio_resource" NOT NULL,
	"date" date NOT NULL,
	"slot" text NOT NULL,
	"booking_id" integer,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"purpose" text,
	"status" text DEFAULT 'CONFIRMED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'USER' NOT NULL,
	"mfa_secret" text,
	"mfa_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "accommodation_types" ADD CONSTRAINT "accommodation_types_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_translations" ADD CONSTRAINT "article_translations_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beds" ADD CONSTRAINT "beds_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_guests" ADD CONSTRAINT "booking_guests_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_accommodation_type_id_accommodation_types_id_fk" FOREIGN KEY ("accommodation_type_id") REFERENCES "public"."accommodation_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_bed_id_beds_id_fk" FOREIGN KEY ("bed_id") REFERENCES "public"."beds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_in_outs" ADD CONSTRAINT "check_in_outs_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_blocks" ADD CONSTRAINT "inventory_blocks_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_blocks" ADD CONSTRAINT "inventory_blocks_bed_id_beds_id_fk" FOREIGN KEY ("bed_id") REFERENCES "public"."beds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rate_plans" ADD CONSTRAINT "rate_plans_accommodation_type_id_accommodation_types_id_fk" FOREIGN KEY ("accommodation_type_id") REFERENCES "public"."accommodation_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signed_agreements" ADD CONSTRAINT "signed_agreements_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signed_agreements" ADD CONSTRAINT "signed_agreements_agreement_id_agreements_id_fk" FOREIGN KEY ("agreement_id") REFERENCES "public"."agreements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "studio_reservations" ADD CONSTRAINT "studio_reservations_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "translation_slug_lang" ON "article_translations" USING btree ("slug","lang");--> statement-breakpoint
CREATE INDEX "articles_status_idx" ON "articles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bookings_bed_dates_idx" ON "bookings" USING btree ("bed_id","check_in","check_out");--> statement-breakpoint
CREATE INDEX "bookings_room_dates_idx" ON "bookings" USING btree ("room_id","check_in","check_out");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bookings_email_idx" ON "bookings" USING btree ("guest_email");--> statement-breakpoint
CREATE INDEX "reg_event_idx" ON "event_registrations" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "reg_email_idx" ON "event_registrations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "events_status_idx" ON "events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "events_start_idx" ON "events" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "blocks_dates_idx" ON "inventory_blocks" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");