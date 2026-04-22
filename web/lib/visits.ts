import "server-only";
import { db } from "@/db/client";
import {
  visits,
  soapNotes,
  visitDiagnoses,
  visitProcedures,
  prescriptions,
  patients,
  type Visit,
  type SoapNote,
  type VisitDiagnosis,
  type VisitProcedure,
  type Prescription,
} from "@/db/schema";
import { and, desc, eq, inArray, like, sql } from "drizzle-orm";

export type VisitRow = Visit;
export type SoapNoteRow = SoapNote;
export type VisitDiagnosisRow = VisitDiagnosis;
export type VisitProcedureRow = VisitProcedure;
export type PrescriptionRow = Prescription;

export type FullVisit = {
  visit: VisitRow;
  soap: SoapNoteRow | null;
  diagnoses: VisitDiagnosisRow[];
  procedures: VisitProcedureRow[];
  prescriptions: PrescriptionRow[];
};

// ---------- Lookups ----------

export async function getVisitById(id: string): Promise<FullVisit | null> {
  const v = await db
    .select()
    .from(visits)
    .where(eq(visits.id, id))
    .limit(1)
    .then((r) => r[0]);
  if (!v) return null;

  const [s, dxs, txs, rxs] = await Promise.all([
    db
      .select()
      .from(soapNotes)
      .where(eq(soapNotes.visitId, id))
      .limit(1)
      .then((r) => r[0] ?? null),
    db
      .select()
      .from(visitDiagnoses)
      .where(eq(visitDiagnoses.visitId, id))
      .orderBy(visitDiagnoses.sortOrder),
    db
      .select()
      .from(visitProcedures)
      .where(eq(visitProcedures.visitId, id))
      .orderBy(visitProcedures.sortOrder),
    db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.visitId, id))
      .orderBy(prescriptions.sortOrder),
  ]);

  return { visit: v, soap: s, diagnoses: dxs, procedures: txs, prescriptions: rxs };
}

export async function listVisitsByPatient(patientId: string) {
  return await db
    .select()
    .from(visits)
    .where(eq(visits.patientId, patientId))
    .orderBy(desc(visits.visitDate), desc(visits.createdAt))
    .limit(100);
}

export type VisitWithContext = {
  visit: VisitRow;
  primaryDx: VisitDiagnosisRow | null;
  rxCount: number;
};

export async function listVisitsByPatientWithContext(
  patientId: string,
): Promise<VisitWithContext[]> {
  const vs = await listVisitsByPatient(patientId);
  if (vs.length === 0) return [];
  const visitIds = vs.map((v) => v.id);
  const [dxs, rxCounts] = await Promise.all([
    db
      .select()
      .from(visitDiagnoses)
      .where(
        and(
          inArray(visitDiagnoses.visitId, visitIds),
          eq(visitDiagnoses.diagnosisType, "primary"),
        ),
      ),
    db
      .select({
        visitId: prescriptions.visitId,
        count: sql<number>`count(*)::int`,
      })
      .from(prescriptions)
      .where(inArray(prescriptions.visitId, visitIds))
      .groupBy(prescriptions.visitId),
  ]);
  const dxMap = new Map(dxs.map((d) => [d.visitId, d]));
  const rxMap = new Map(rxCounts.map((r) => [r.visitId, r.count]));
  return vs.map((v) => ({
    visit: v,
    primaryDx: dxMap.get(v.id) ?? null,
    rxCount: rxMap.get(v.id) ?? 0,
  }));
}

// Riwayat seluruh kunjungan tenant — newest first. Untuk halaman /sesi.
export async function listVisitsByTenant(tenantId: string, limit = 80) {
  const rows = await db
    .select({
      v: visits,
      patientName: patients.nama,
      patientNoRm: patients.noRm,
    })
    .from(visits)
    .leftJoin(patients, eq(patients.id, visits.patientId))
    .where(eq(visits.tenantId, tenantId))
    .orderBy(desc(visits.visitDate), desc(visits.createdAt))
    .limit(limit);
  return rows;
}

// Top-of-day queue across all locations of a tenant.
export async function listTodayVisits(tenantId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const rows = await db
    .select({
      v: visits,
      patientName: patients.nama,
      patientNoRm: patients.noRm,
    })
    .from(visits)
    .leftJoin(patients, eq(patients.id, visits.patientId))
    .where(and(eq(visits.tenantId, tenantId), eq(visits.visitDate, today)))
    .orderBy(visits.queueNumber, visits.createdAt);
  return rows;
}

// ---------- Generators ----------

export async function nextVisitNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `KNJ-${year}-`;
  const last = await db
    .select({ vn: visits.visitNumber })
    .from(visits)
    .where(
      and(eq(visits.tenantId, tenantId), like(visits.visitNumber, `${prefix}%`)),
    )
    .orderBy(desc(visits.visitNumber))
    .limit(1)
    .then((r) => r[0]?.vn);
  const lastSeq = last ? parseInt(last.slice(prefix.length), 10) : 0;
  const seq = (Number.isFinite(lastSeq) ? lastSeq : 0) + 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export async function nextPrescriptionNumber(
  tenantId: string,
): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const dd = String(now.getDate()).padStart(2, "0");
  const prefix = `R-${year}-`;
  // Counter is per-tenant via visits.tenant_id join — but for MVP we count
  // existing prescriptions across tenant by prefix only. Good enough until
  // multi-tenant traffic actually exists.
  const last = await db
    .select({ pn: prescriptions.prescriptionNumber })
    .from(prescriptions)
    .where(like(prescriptions.prescriptionNumber, `${prefix}%`))
    .orderBy(desc(prescriptions.prescriptionNumber))
    .limit(1)
    .then((r) => r[0]?.pn);

  // last is shaped R-YYYY-NNNN-DD; extract NNNN
  let lastSeq = 0;
  if (last) {
    const tail = last.slice(prefix.length);
    const m = /^(\d{4})-/.exec(tail);
    if (m) lastSeq = parseInt(m[1], 10);
  }
  const seq = (Number.isFinite(lastSeq) ? lastSeq : 0) + 1;
  return `${prefix}${String(seq).padStart(4, "0")}-${dd}`;
}

// ---------- Formatters ----------

const fmtTanggalLong = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function fmtTanggalKunjungan(s: string): string {
  const dt = new Date(s + "T00:00:00");
  if (isNaN(dt.getTime())) return s;
  return fmtTanggalLong.format(dt);
}

export function fmtJam(s: string | null | undefined): string {
  if (!s) return "—";
  return s.slice(0, 5);
}

export function statusLabel(
  status: VisitRow["status"],
): { label: string; tone: "amber" | "blue" | "indigo" | "green" | "muted" } {
  switch (status) {
    case "waiting":
      return { label: "Menunggu", tone: "amber" };
    case "called":
      return { label: "Dipanggil", tone: "blue" };
    case "in_progress":
      return { label: "Diperiksa", tone: "indigo" };
    case "done":
      return { label: "Selesai", tone: "green" };
    case "no_show":
      return { label: "Tidak hadir", tone: "muted" };
  }
}
