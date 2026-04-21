import {
  pgTable,
  uuid,
  text,
  varchar,
  date,
  time,
  timestamp,
  index,
  uniqueIndex,
  pgEnum,
  jsonb,
  boolean,
  smallint,
  integer,
  decimal,
} from "drizzle-orm/pg-core";

// ============================================================
// Pasien — minimal v1 schema for solo-dokter MVP.
// Nanti extend: tenant_id (multi-tenant), no_rm per-tenant, FHIR mapping.
// ============================================================

export const jenisKelaminEnum = pgEnum("jenis_kelamin", ["L", "P"]);

export const patients = pgTable(
  "patients",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // nomor rekam medis — auto-incremented-like via sequence later; untuk MVP, pakai text bebas
    noRm: varchar("no_rm", { length: 32 }).notNull(),

    // identitas
    nama: text("nama").notNull(),
    nik: varchar("nik", { length: 16 }), // Indonesian national ID — optional (bayi/anak blm punya)
    tglLahir: date("tgl_lahir", { mode: "string" }).notNull(), // YYYY-MM-DD
    jk: jenisKelaminEnum("jk").notNull(),

    // kontak
    telepon: varchar("telepon", { length: 20 }),
    email: varchar("email", { length: 120 }),
    alamat: text("alamat"),

    // meta klinis (free-text v1 — nanti pisahin ke tabel sendiri)
    catatan: text("catatan"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("patients_no_rm_idx").on(t.noRm),
    // NIK unique-when-not-null — enforced via partial index below in SQL;
    // Drizzle tidak punya partial index builder langsung, kita tambahin manual di migration.
    index("patients_nama_idx").on(t.nama),
    index("patients_telepon_idx").on(t.telepon),
  ]
);

export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;

// ============================================================
// Audit log — append-only.
// PRD prinsip #6 Accountability: setiap akses RM (termasuk RAG query) tercatat.
// PRD HARD RULE: immutable — DELETE/UPDATE diblokir di level Postgres trigger
// (lihat migration). App hanya boleh INSERT.
// Multi-tenant fields (tenant_id) ditambah saat schema S1 ship.
// ============================================================
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Pelaku — nullable sampai auth ship; saat itu actorId = users.id
    actorId: varchar("actor_id", { length: 200 }),
    actorLabel: varchar("actor_label", { length: 200 }), // human readable: "dr. Yanuar"

    // create | update | delete | view | sign | ai_query | login | export | ...
    action: varchar("action", { length: 60 }).notNull(),

    // patient | visit | prescription | soap_note | feedback_log | session | ...
    entity: varchar("entity", { length: 60 }).notNull(),
    entityId: uuid("entity_id"), // nullable untuk event yang bukan baris (mis. session login)

    beforeJson: jsonb("before_json"),
    afterJson: jsonb("after_json"),

    ipAddress: varchar("ip_address", { length: 64 }),
    userAgent: text("user_agent"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("audit_logs_entity_idx").on(t.entity, t.entityId),
    index("audit_logs_actor_idx").on(t.actorId, t.createdAt),
    index("audit_logs_created_idx").on(t.createdAt),
  ],
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

// ============================================================
// Stage S1 — Multi-tenant foundation: tenants, users, locations.
// Per DB Schema spec v1.0. RLS policies + tenant_id wiring on existing
// tables (patients, audit_logs) deferred to a later stage so /pasien
// keeps working in single-tenant mode.
// ============================================================

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trial",
  "active",
  "suspended",
]);

export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // subdomain slug — must be URL-safe, lowercase
    slug: varchar("slug", { length: 64 }).notNull(),

    name: varchar("name", { length: 200 }).notNull(),
    logoUrl: text("logo_url"),

    subscriptionStatus: subscriptionStatusEnum("subscription_status")
      .notNull()
      .default("trial"),
    subscriptionUntil: date("subscription_until", { mode: "string" }),

    flatRateIdr: integer("flat_rate_idr"), // bulanan flat-rate (IDR)
    satusehatOrgId: varchar("satusehat_org_id", { length: 64 }),

    settings: jsonb("settings").$type<Record<string, unknown>>().default({}),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("tenants_slug_idx").on(t.slug)],
);

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

// ----------------------------------------------------------------
// Users — staff scoped per tenant. Email is unique per tenant
// (a doctor email can exist in two unrelated tenants legitimately).
// Password stored as bcrypt hash (cost ≥12 enforced at app layer).
// ----------------------------------------------------------------

export const userRoleEnum = pgEnum("user_role", [
  "doctor",
  "nurse",
  "tenant_admin",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),

    name: varchar("name", { length: 200 }).notNull(),
    email: varchar("email", { length: 200 }).notNull(),

    // bcrypt hash — never plain text. App enforces cost=12.
    passwordHash: text("password_hash").notNull(),

    role: userRoleEnum("role").notNull(),

    // doctor-only fields
    specialty: varchar("specialty", { length: 100 }), // e.g. "THT-KL", "Sp.A"
    strNumber: varchar("str_number", { length: 60 }),
    sipNumber: varchar("sip_number", { length: 60 }),

    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("users_tenant_email_idx").on(t.tenantId, t.email),
    index("users_tenant_role_idx").on(t.tenantId, t.role),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ----------------------------------------------------------------
// Locations — physical clinic branches per tenant.
// operating_hours: { mon: {open:"08:00", close:"17:00"}, ... }
// slot_duration_minutes drives schedules generation (Stage S4).
// ----------------------------------------------------------------

export type OperatingHours = Partial<
  Record<
    "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun",
    { open: string; close: string } | null
  >
>;

export const locations = pgTable(
  "locations",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 200 }).notNull(),
    address: text("address"),
    city: varchar("city", { length: 100 }),
    phone: varchar("phone", { length: 30 }),

    operatingHours: jsonb("operating_hours").$type<OperatingHours>(),

    slotDurationMinutes: smallint("slot_duration_minutes").notNull().default(15),

    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("locations_tenant_idx").on(t.tenantId, t.isActive)],
);

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;

// ============================================================
// Stage S2 — Clinical visit core: visits, soap_notes, visit_diagnoses.
// Per DB Schema spec v1.0.
//
// Single-screen 7-step workflow lives here (visits.current_step 1..7).
// SOAP is 1:1 with visit (PUT semantics — upsert).
// BMI is a Postgres GENERATED column (auto-computed from weight/height).
// JSONB fields hold structured exam data + atlas drawings + photos so the
// shape can evolve without migrations during MVP.
// ============================================================

export const visitTypeEnum = pgEnum("visit_type", ["outpatient", "home_visit"]);
export const paymentTypeEnum = pgEnum("payment_type", [
  "umum",
  "bpjs",
  "asuransi",
]);
export const visitStatusEnum = pgEnum("visit_status", [
  "waiting",
  "called",
  "in_progress",
  "done",
  "no_show",
]);
export const diagnosisTypeEnum = pgEnum("diagnosis_type", [
  "primary",
  "secondary",
  "comorbid",
]);

export const visits = pgTable(
  "visits",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "restrict" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "restrict" }),
    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),

    // KNJ-YYYY-NNNN — unique per tenant; app generates atomically
    visitNumber: varchar("visit_number", { length: 32 }).notNull(),
    queueNumber: smallint("queue_number"),

    visitDate: date("visit_date", { mode: "string" }).notNull(),
    visitTime: time("visit_time"),

    visitType: visitTypeEnum("visit_type").notNull().default("outpatient"),
    paymentType: paymentTypeEnum("payment_type").notNull().default("umum"),

    chiefComplaint: text("chief_complaint"),
    status: visitStatusEnum("status").notNull().default("waiting"),
    currentStep: smallint("current_step").notNull().default(1), // 1..7

    // vitals
    weightKg: decimal("weight_kg", { precision: 5, scale: 2 }),
    heightCm: decimal("height_cm", { precision: 5, scale: 2 }),
    // bmi auto-generated by Postgres — see migration ALTER below.
    // Drizzle doesn't model GENERATED columns yet; we still expose the read.
    bmi: decimal("bmi", { precision: 5, scale: 2 }),
    bloodPressure: varchar("blood_pressure", { length: 20 }),
    heartRate: smallint("heart_rate"),
    temperatureC: decimal("temperature_c", { precision: 4, scale: 1 }),
    spo2: smallint("spo2"),

    satusehatEncounterId: varchar("satusehat_encounter_id", { length: 100 }),
    satusehatSyncedAt: timestamp("satusehat_synced_at", { withTimezone: true }),

    signedAt: timestamp("signed_at", { withTimezone: true }),
    signedBy: uuid("signed_by").references(() => users.id, {
      onDelete: "restrict",
    }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("visits_tenant_visit_number_idx").on(t.tenantId, t.visitNumber),
    index("visits_tenant_date_idx").on(t.tenantId, t.visitDate),
    index("visits_patient_idx").on(t.patientId, t.visitDate),
    index("visits_doctor_date_idx").on(t.doctorId, t.visitDate),
    index("visits_status_idx").on(t.locationId, t.visitDate, t.status),
  ],
);

export type Visit = typeof visits.$inferSelect;
export type NewVisit = typeof visits.$inferInsert;

// ----------------------------------------------------------------
// SOAP note — exactly one per visit (visit_id UNIQUE).
// JSONB shapes are app-controlled; refer to API contract for keys.
// ----------------------------------------------------------------

export type EntExamination = {
  ear_left?: Record<string, unknown>;
  ear_right?: Record<string, unknown>;
  nose?: Record<string, unknown>;
  throat?: Record<string, unknown>;
  neck?: Record<string, unknown>;
};

export type AtlasDrawing = {
  structure: string; // "ear_left" | "nose" | ...
  paths: string[]; // SVG path strings
};

export type ExamPhoto = {
  url: string;
  label?: string;
  side?: "left" | "right" | "midline";
  timestamp: string; // ISO
};

export type ScoringResults = {
  sfar?: { score: number; class: string; date: string };
  stopbang?: { score: number; risk: string; date: string };
  paradise?: { score: number; recommendation: string; date: string };
  vas_aria?: { vas: number; total_aria: number; date: string };
};

export const soapNotes = pgTable(
  "soap_notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    visitId: uuid("visit_id")
      .notNull()
      .references(() => visits.id, { onDelete: "cascade" }),

    // Subjective
    subjective: text("subjective"),
    historyPresent: text("history_present"),
    pastHistory: text("past_history"),
    familyHistory: text("family_history"),
    socialHistory: text("social_history"),

    // Objective
    objective: text("objective"),
    entExamination: jsonb("ent_examination").$type<EntExamination>(),
    atlasDrawings: jsonb("atlas_drawings").$type<AtlasDrawing[]>(),
    examPhotos: jsonb("exam_photos").$type<ExamPhoto[]>(),

    // Assessment
    assessment: text("assessment"),
    scoringResults: jsonb("scoring_results").$type<ScoringResults>(),

    // Plan
    plan: text("plan"),

    aiSuggested: boolean("ai_suggested").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("soap_notes_visit_idx").on(t.visitId)],
);

export type SoapNote = typeof soapNotes.$inferSelect;
export type NewSoapNote = typeof soapNotes.$inferInsert;

// ----------------------------------------------------------------
// Visit diagnoses — 1:N with visit, ordered (sortOrder), typed.
// ICD-10 codes denormalized at write time so a visit's history
// remains intact even if reference table changes.
// ----------------------------------------------------------------

export const visitDiagnoses = pgTable(
  "visit_diagnoses",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    visitId: uuid("visit_id")
      .notNull()
      .references(() => visits.id, { onDelete: "cascade" }),

    icd10Code: varchar("icd10_code", { length: 10 }).notNull(),
    icd10NameId: text("icd10_name_id"),
    icd10NameEn: text("icd10_name_en"),

    diagnosisType: diagnosisTypeEnum("diagnosis_type")
      .notNull()
      .default("primary"),
    isChronic: boolean("is_chronic").notNull().default(false),
    sortOrder: smallint("sort_order").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("visit_diagnoses_visit_idx").on(t.visitId, t.sortOrder),
    index("visit_diagnoses_icd10_idx").on(t.icd10Code),
  ],
);

export type VisitDiagnosis = typeof visitDiagnoses.$inferSelect;
export type NewVisitDiagnosis = typeof visitDiagnoses.$inferInsert;
