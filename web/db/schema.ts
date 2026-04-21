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
