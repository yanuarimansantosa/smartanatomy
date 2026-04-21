CREATE TABLE "visit_procedures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visit_id" uuid NOT NULL,
	"icd9_code" varchar(10) NOT NULL,
	"icd9_name_id" text,
	"icd9_name_en" text,
	"is_operative" boolean DEFAULT false NOT NULL,
	"fee_idr" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "visit_procedures" ADD CONSTRAINT "visit_procedures_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "visit_procedures_visit_idx" ON "visit_procedures" USING btree ("visit_id","sort_order");--> statement-breakpoint
CREATE INDEX "visit_procedures_icd9_idx" ON "visit_procedures" USING btree ("icd9_code");