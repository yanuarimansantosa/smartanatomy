CREATE TYPE "public"."diagnosis_type" AS ENUM('primary', 'secondary', 'comorbid');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('umum', 'bpjs', 'asuransi');--> statement-breakpoint
CREATE TYPE "public"."visit_status" AS ENUM('waiting', 'called', 'in_progress', 'done', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."visit_type" AS ENUM('outpatient', 'home_visit');--> statement-breakpoint
CREATE TABLE "soap_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visit_id" uuid NOT NULL,
	"subjective" text,
	"history_present" text,
	"past_history" text,
	"family_history" text,
	"social_history" text,
	"objective" text,
	"ent_examination" jsonb,
	"atlas_drawings" jsonb,
	"exam_photos" jsonb,
	"assessment" text,
	"scoring_results" jsonb,
	"plan" text,
	"ai_suggested" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visit_diagnoses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visit_id" uuid NOT NULL,
	"icd10_code" varchar(10) NOT NULL,
	"icd10_name_id" text,
	"icd10_name_en" text,
	"diagnosis_type" "diagnosis_type" DEFAULT 'primary' NOT NULL,
	"is_chronic" boolean DEFAULT false NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"doctor_id" uuid NOT NULL,
	"visit_number" varchar(32) NOT NULL,
	"queue_number" smallint,
	"visit_date" date NOT NULL,
	"visit_time" time,
	"visit_type" "visit_type" DEFAULT 'outpatient' NOT NULL,
	"payment_type" "payment_type" DEFAULT 'umum' NOT NULL,
	"chief_complaint" text,
	"status" "visit_status" DEFAULT 'waiting' NOT NULL,
	"current_step" smallint DEFAULT 1 NOT NULL,
	"weight_kg" numeric(5, 2),
	"height_cm" numeric(5, 2),
	"bmi" numeric(5, 2),
	"blood_pressure" varchar(20),
	"heart_rate" smallint,
	"temperature_c" numeric(4, 1),
	"spo2" smallint,
	"satusehat_encounter_id" varchar(100),
	"satusehat_synced_at" timestamp with time zone,
	"signed_at" timestamp with time zone,
	"signed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "soap_notes" ADD CONSTRAINT "soap_notes_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visit_diagnoses" ADD CONSTRAINT "visit_diagnoses_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_signed_by_users_id_fk" FOREIGN KEY ("signed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "soap_notes_visit_idx" ON "soap_notes" USING btree ("visit_id");--> statement-breakpoint
CREATE INDEX "visit_diagnoses_visit_idx" ON "visit_diagnoses" USING btree ("visit_id","sort_order");--> statement-breakpoint
CREATE INDEX "visit_diagnoses_icd10_idx" ON "visit_diagnoses" USING btree ("icd10_code");--> statement-breakpoint
CREATE UNIQUE INDEX "visits_tenant_visit_number_idx" ON "visits" USING btree ("tenant_id","visit_number");--> statement-breakpoint
CREATE INDEX "visits_tenant_date_idx" ON "visits" USING btree ("tenant_id","visit_date");--> statement-breakpoint
CREATE INDEX "visits_patient_idx" ON "visits" USING btree ("patient_id","visit_date");--> statement-breakpoint
CREATE INDEX "visits_doctor_date_idx" ON "visits" USING btree ("doctor_id","visit_date");--> statement-breakpoint
CREATE INDEX "visits_status_idx" ON "visits" USING btree ("location_id","visit_date","status");--> statement-breakpoint
-- ============================================================
-- BMI as a Postgres GENERATED column (Drizzle doesn't model this yet).
-- Drop the plain column and re-add as STORED computed column so app
-- never has to recalculate. Formula: weight_kg / (height_m^2), 1 decimal.
-- NULL when either input is null — matches app expectation.
-- ============================================================
ALTER TABLE "visits" DROP COLUMN "bmi";--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "bmi" numeric(5, 2)
  GENERATED ALWAYS AS (
    CASE
      WHEN "weight_kg" IS NULL OR "height_cm" IS NULL OR "height_cm" = 0 THEN NULL
      ELSE ROUND( ("weight_kg" / (("height_cm" / 100.0) * ("height_cm" / 100.0)))::numeric, 2)
    END
  ) STORED;