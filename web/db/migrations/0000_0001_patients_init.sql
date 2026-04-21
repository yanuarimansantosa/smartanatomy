CREATE TYPE "public"."jenis_kelamin" AS ENUM('L', 'P');--> statement-breakpoint
CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"no_rm" varchar(32) NOT NULL,
	"nama" text NOT NULL,
	"nik" varchar(16),
	"tgl_lahir" date NOT NULL,
	"jk" "jenis_kelamin" NOT NULL,
	"telepon" varchar(20),
	"email" varchar(120),
	"alamat" text,
	"catatan" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "patients_no_rm_idx" ON "patients" USING btree ("no_rm");--> statement-breakpoint
CREATE INDEX "patients_nama_idx" ON "patients" USING btree ("nama");--> statement-breakpoint
CREATE INDEX "patients_telepon_idx" ON "patients" USING btree ("telepon");--> statement-breakpoint
-- NIK unik kalau ada (partial index) — anak/bayi blm punya NIK jadi nullable
CREATE UNIQUE INDEX "patients_nik_unique_idx" ON "patients" ("nik") WHERE "nik" IS NOT NULL;