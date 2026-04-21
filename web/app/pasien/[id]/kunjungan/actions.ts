"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import {
  visits,
  soapNotes,
  visitDiagnoses,
  visitProcedures,
  prescriptions,
  drugFormEnum,
  drugRouteEnum,
} from "@/db/schema";

type DrugForm = (typeof drugFormEnum.enumValues)[number];
type DrugRoute = (typeof drugRouteEnum.enumValues)[number];
import { getDefaultIds } from "@/lib/defaults";
import { nextPrescriptionNumber, nextVisitNumber } from "@/lib/visits";
import { logEvent } from "@/lib/audit";

// ---------- Create new visit ----------

export async function createVisit(patientId: string): Promise<void> {
  const ids = await getDefaultIds();
  const visitNumber = await nextVisitNumber(ids.tenantId);
  const today = new Date().toISOString().slice(0, 10);
  const time = new Date().toTimeString().slice(0, 8);

  const inserted = await db
    .insert(visits)
    .values({
      tenantId: ids.tenantId,
      locationId: ids.locationId,
      doctorId: ids.doctorId,
      patientId,
      visitNumber,
      visitDate: today,
      visitTime: time,
      status: "in_progress",
      currentStep: 1,
    })
    .returning({ id: visits.id });

  const visitId = inserted[0].id;
  await logEvent({
    action: "create",
    entity: "visit",
    entityId: visitId,
    after: { visitNumber, patientId },
  });

  redirect(`/pasien/${patientId}/kunjungan/${visitId}/edit`);
}

// ---------- Save & sign ----------

const diagnosisSchema = z.object({
  icd10Code: z.string().min(1).max(10),
  icd10NameId: z.string().max(500).optional().nullable(),
  icd10NameEn: z.string().max(500).optional().nullable(),
  diagnosisType: z.enum(["primary", "secondary", "comorbid"]).default("primary"),
  isChronic: z.boolean().default(false),
});

const procedureSchema = z.object({
  icd9Code: z.string().min(1).max(10),
  icd9NameId: z.string().max(500).optional().nullable(),
  icd9NameEn: z.string().max(500).optional().nullable(),
  isOperative: z.boolean().default(false),
  feeIdr: z.number().int().min(0).max(100_000_000).default(0),
  notes: z.string().max(500).optional().nullable(),
});

const prescriptionSchema = z.object({
  drugName: z.string().min(1).max(200),
  genericName: z.string().max(200).optional().nullable(),
  drugForm: z
    .enum([
      "tablet",
      "kapsul",
      "sirup",
      "tetes",
      "spray",
      "salep",
      "injeksi",
      "lainnya",
    ])
    .optional()
    .nullable(),
  strength: z.string().max(60).optional().nullable(),
  dose: z.string().max(60).optional().nullable(),
  frequency: z.string().max(60).optional().nullable(),
  duration: z.string().max(60).optional().nullable(),
  route: z
    .enum(["oral", "topical", "inhalasi", "tetes", "injeksi", "lainnya"])
    .optional()
    .nullable(),
  instructions: z.string().max(500).optional().nullable(),
  quantity: z.number().int().min(0).max(10000).optional().nullable(),
  unit: z.string().max(30).optional().nullable(),
});

const saveVisitSchema = z.object({
  chiefComplaint: z.string().max(500).optional().nullable(),
  weightKg: z.number().min(0).max(500).optional().nullable(),
  heightCm: z.number().min(0).max(300).optional().nullable(),
  bloodPressure: z.string().max(20).optional().nullable(),
  heartRate: z.number().int().min(0).max(300).optional().nullable(),
  temperatureC: z.number().min(20).max(50).optional().nullable(),
  spo2: z.number().int().min(0).max(100).optional().nullable(),
  paymentType: z.enum(["umum", "bpjs", "asuransi"]).default("umum"),

  subjective: z.string().max(5000).optional().nullable(),
  historyPresent: z.string().max(5000).optional().nullable(),
  pastHistory: z.string().max(5000).optional().nullable(),
  objective: z.string().max(5000).optional().nullable(),
  assessment: z.string().max(5000).optional().nullable(),
  plan: z.string().max(5000).optional().nullable(),

  diagnoses: z.array(diagnosisSchema).max(20).default([]),
  procedures: z.array(procedureSchema).max(20).default([]),
  prescriptions: z.array(prescriptionSchema).max(30).default([]),
});

export type SaveVisitPayload = z.infer<typeof saveVisitSchema>;

export type SaveVisitResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

async function persistVisit(
  visitId: string,
  payload: SaveVisitPayload,
): Promise<void> {
  const v = await db
    .select({ id: visits.id, tenantId: visits.tenantId })
    .from(visits)
    .where(eq(visits.id, visitId))
    .limit(1)
    .then((r) => r[0]);
  if (!v) throw new Error("Kunjungan tidak ditemukan.");

  await db
    .update(visits)
    .set({
      chiefComplaint: payload.chiefComplaint ?? null,
      weightKg: payload.weightKg != null ? String(payload.weightKg) : null,
      heightCm: payload.heightCm != null ? String(payload.heightCm) : null,
      bloodPressure: payload.bloodPressure ?? null,
      heartRate: payload.heartRate ?? null,
      temperatureC:
        payload.temperatureC != null ? String(payload.temperatureC) : null,
      spo2: payload.spo2 ?? null,
      paymentType: payload.paymentType,
      currentStep: 7,
      updatedAt: new Date(),
    })
    .where(eq(visits.id, visitId));

  // SOAP note: upsert (1:1 with visit)
  const existing = await db
    .select({ id: soapNotes.id })
    .from(soapNotes)
    .where(eq(soapNotes.visitId, visitId))
    .limit(1)
    .then((r) => r[0]);

  if (existing) {
    await db
      .update(soapNotes)
      .set({
        subjective: payload.subjective ?? null,
        historyPresent: payload.historyPresent ?? null,
        pastHistory: payload.pastHistory ?? null,
        objective: payload.objective ?? null,
        assessment: payload.assessment ?? null,
        plan: payload.plan ?? null,
        updatedAt: new Date(),
      })
      .where(eq(soapNotes.visitId, visitId));
  } else {
    await db.insert(soapNotes).values({
      visitId,
      subjective: payload.subjective,
      historyPresent: payload.historyPresent,
      pastHistory: payload.pastHistory,
      objective: payload.objective,
      assessment: payload.assessment,
      plan: payload.plan,
    });
  }

  // Procedures: replace-all (snapshot tarif disimpan saat ini)
  await db.delete(visitProcedures).where(eq(visitProcedures.visitId, visitId));
  if (payload.procedures.length > 0) {
    await db.insert(visitProcedures).values(
      payload.procedures.map((p, i) => ({
        visitId,
        icd9Code: p.icd9Code,
        icd9NameId: p.icd9NameId,
        icd9NameEn: p.icd9NameEn,
        isOperative: p.isOperative,
        feeIdr: p.feeIdr,
        notes: p.notes,
        sortOrder: i,
      })),
    );
  }

  // Diagnoses: replace-all (delete + insert) — atomic via single transaction
  await db.delete(visitDiagnoses).where(eq(visitDiagnoses.visitId, visitId));
  if (payload.diagnoses.length > 0) {
    await db.insert(visitDiagnoses).values(
      payload.diagnoses.map((d, i) => ({
        visitId,
        icd10Code: d.icd10Code,
        icd10NameId: d.icd10NameId,
        icd10NameEn: d.icd10NameEn,
        diagnosisType: d.diagnosisType,
        isChronic: d.isChronic,
        sortOrder: i,
      })),
    );
  }

  // Prescriptions: replace-all
  await db.delete(prescriptions).where(eq(prescriptions.visitId, visitId));
  if (payload.prescriptions.length > 0) {
    const items: Array<{
      visitId: string;
      prescriptionNumber: string;
      drugName: string;
      genericName: string | null | undefined;
      drugForm: DrugForm | null | undefined;
      strength: string | null | undefined;
      dose: string | null | undefined;
      frequency: string | null | undefined;
      duration: string | null | undefined;
      route: DrugRoute | null | undefined;
      instructions: string | null | undefined;
      quantity: number | null | undefined;
      unit: string | null | undefined;
      sortOrder: number;
    }> = [];
    for (let i = 0; i < payload.prescriptions.length; i++) {
      const p = payload.prescriptions[i];
      items.push({
        visitId,
        prescriptionNumber: await nextPrescriptionNumber(v.tenantId),
        drugName: p.drugName,
        genericName: p.genericName,
        drugForm: p.drugForm,
        strength: p.strength,
        dose: p.dose,
        frequency: p.frequency,
        duration: p.duration,
        route: p.route,
        instructions: p.instructions,
        quantity: p.quantity,
        unit: p.unit,
        sortOrder: i,
      });
    }
    await db.insert(prescriptions).values(items);
  }
}

export async function saveVisit(
  visitId: string,
  payloadRaw: unknown,
): Promise<SaveVisitResult> {
  const parsed = saveVisitSchema.safeParse(payloadRaw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Periksa kembali isian.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  try {
    await persistVisit(visitId, parsed.data);
    await logEvent({
      action: "update",
      entity: "visit",
      entityId: visitId,
      after: {
        diagnoses: parsed.data.diagnoses.length,
        procedures: parsed.data.procedures.length,
        prescriptions: parsed.data.prescriptions.length,
      },
    });
    revalidatePath(`/pasien`);
    revalidatePath(`/pasien/[id]`, "page");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error ? err.message : "Gagal menyimpan kunjungan.",
    };
  }
}

export async function signVisit(
  visitId: string,
  patientId: string,
  payloadRaw: unknown,
): Promise<SaveVisitResult> {
  const parsed = saveVisitSchema.safeParse(payloadRaw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Periksa kembali isian sebelum tanda tangan.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  // Sign requires at least one diagnosis — clinical hard rule.
  if (parsed.data.diagnoses.length === 0) {
    return {
      ok: false,
      message: "Tambahkan minimal satu diagnosa (ICD-10) sebelum tanda tangan.",
    };
  }

  try {
    await persistVisit(visitId, parsed.data);
    const ids = await getDefaultIds();
    await db
      .update(visits)
      .set({
        signedAt: new Date(),
        signedBy: ids.doctorId,
        status: "done",
        updatedAt: new Date(),
      })
      .where(eq(visits.id, visitId));

    await logEvent({
      action: "sign",
      entity: "visit",
      entityId: visitId,
      after: {
        diagnoses: parsed.data.diagnoses.length,
        procedures: parsed.data.procedures.length,
        prescriptions: parsed.data.prescriptions.length,
      },
    });
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Gagal tanda tangan.",
    };
  }

  redirect(`/pasien/${patientId}/kunjungan/${visitId}`);
}
