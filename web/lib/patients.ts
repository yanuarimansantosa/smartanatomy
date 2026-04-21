import "server-only";
import { db } from "@/db/client";
import { patients, type Patient } from "@/db/schema";
import { desc, eq, ilike, or } from "drizzle-orm";

export type PatientRow = Patient;

export async function listPatients(q?: string): Promise<PatientRow[]> {
  const term = (q ?? "").trim();
  const base = db
    .select()
    .from(patients)
    .orderBy(desc(patients.createdAt))
    .limit(100);

  if (!term) return await base;

  const like = `%${term}%`;
  return await db
    .select()
    .from(patients)
    .where(
      or(
        ilike(patients.nama, like),
        ilike(patients.noRm, like),
        ilike(patients.telepon, like),
        ilike(patients.nik, like),
      ),
    )
    .orderBy(desc(patients.createdAt))
    .limit(100);
}

export async function getPatientById(id: string): Promise<PatientRow | null> {
  const rows = await db
    .select()
    .from(patients)
    .where(eq(patients.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function nextNoRm(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `RM-${year}-`;
  const rows = await db
    .select({ noRm: patients.noRm })
    .from(patients)
    .where(ilike(patients.noRm, `${prefix}%`))
    .orderBy(desc(patients.noRm))
    .limit(1);

  const last = rows[0]?.noRm;
  const lastSeq = last ? parseInt(last.slice(prefix.length), 10) : 0;
  const seq = (Number.isFinite(lastSeq) ? lastSeq : 0) + 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export function umurDariTglLahir(tgl: string): string {
  const [y, m, d] = tgl.split("-").map(Number);
  if (!y || !m || !d) return "-";
  const now = new Date();
  let years = now.getFullYear() - y;
  let months = now.getMonth() + 1 - m;
  if (now.getDate() < d) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years <= 0) return `${Math.max(months, 0)} bln`;
  if (years < 5) return `${years} th ${months} bln`;
  return `${years} th`;
}

export function fmtTanggal(tgl: string): string {
  const dt = new Date(tgl + "T00:00:00");
  if (isNaN(dt.getTime())) return tgl;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(dt);
}

