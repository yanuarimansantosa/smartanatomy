import {
  pgTable,
  uuid,
  text,
  varchar,
  date,
  timestamp,
  index,
  uniqueIndex,
  pgEnum,
  jsonb,
  boolean,
  smallint,
  integer,
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
