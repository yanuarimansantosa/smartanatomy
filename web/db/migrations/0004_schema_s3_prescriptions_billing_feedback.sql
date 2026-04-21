CREATE TYPE "public"."correction_reason" AS ENUM('not_relevant', 'already_known', 'other_finding', 'personal_pref');--> statement-breakpoint
CREATE TYPE "public"."drug_form" AS ENUM('tablet', 'kapsul', 'sirup', 'tetes', 'spray', 'salep', 'injeksi', 'lainnya');--> statement-breakpoint
CREATE TYPE "public"."drug_reject_reason" AS ENUM('side_effect', 'not_in_formulary', 'personal_pref', 'patient_preference');--> statement-breakpoint
CREATE TYPE "public"."drug_route" AS ENUM('oral', 'topical', 'inhalasi', 'tetes', 'injeksi', 'lainnya');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'transfer', 'qris', 'kartu');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('unpaid', 'paid', 'partial');--> statement-breakpoint
CREATE TABLE "billing_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"visit_id" uuid NOT NULL,
	"invoice_number" varchar(32) NOT NULL,
	"subtotal_idr" integer DEFAULT 0 NOT NULL,
	"discount_idr" integer DEFAULT 0 NOT NULL,
	"total_idr" integer DEFAULT 0 NOT NULL,
	"payment_method" "payment_method",
	"payment_status" "payment_status" DEFAULT 'unpaid' NOT NULL,
	"paid_at" timestamp with time zone,
	"paid_amount_idr" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"doctor_id" uuid NOT NULL,
	"specialty" varchar(100),
	"suggested_dx" jsonb,
	"suggested_drugs" jsonb,
	"chosen_dx_rank" smallint,
	"chosen_dx_icd10" varchar(10),
	"dx_was_suggested" boolean DEFAULT false NOT NULL,
	"final_drugs" jsonb,
	"drug_override" boolean DEFAULT false NOT NULL,
	"engagement_ms" integer,
	"suggestion_viewed" boolean DEFAULT false NOT NULL,
	"correction_reason" "correction_reason",
	"drug_reject_reason" "drug_reject_reason",
	"contributed_to_global" boolean DEFAULT false NOT NULL,
	"anonymized_weight" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prescriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visit_id" uuid NOT NULL,
	"prescription_number" varchar(32) NOT NULL,
	"drug_name" varchar(200) NOT NULL,
	"generic_name" varchar(200),
	"drug_form" "drug_form",
	"strength" varchar(60),
	"dose" varchar(60),
	"frequency" varchar(60),
	"duration" varchar(60),
	"route" "drug_route",
	"instructions" text,
	"quantity" smallint,
	"unit" varchar(30),
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "billing_invoices" ADD CONSTRAINT "billing_invoices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_invoices" ADD CONSTRAINT "billing_invoices_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_logs" ADD CONSTRAINT "feedback_logs_session_id_visits_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_logs" ADD CONSTRAINT "feedback_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_logs" ADD CONSTRAINT "feedback_logs_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "billing_invoices_visit_idx" ON "billing_invoices" USING btree ("visit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_invoices_tenant_number_idx" ON "billing_invoices" USING btree ("tenant_id","invoice_number");--> statement-breakpoint
CREATE INDEX "billing_invoices_status_idx" ON "billing_invoices" USING btree ("tenant_id","payment_status","created_at");--> statement-breakpoint
CREATE INDEX "feedback_logs_session_idx" ON "feedback_logs" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "feedback_logs_doctor_idx" ON "feedback_logs" USING btree ("doctor_id","created_at");--> statement-breakpoint
CREATE INDEX "feedback_logs_specialty_idx" ON "feedback_logs" USING btree ("specialty","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "prescriptions_number_idx" ON "prescriptions" USING btree ("prescription_number");--> statement-breakpoint
CREATE INDEX "prescriptions_visit_idx" ON "prescriptions" USING btree ("visit_id","sort_order");--> statement-breakpoint
CREATE INDEX "prescriptions_drug_name_idx" ON "prescriptions" USING btree ("drug_name");