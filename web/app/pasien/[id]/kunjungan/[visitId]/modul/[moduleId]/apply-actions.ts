"use server";

/**
 * Apply a ModuleSnapshot to a visit.
 *
 * Server action invoked from <ModuleRenderer /> after the doctor taps
 * "Apply ke kunjungan". It converts the snapshot into a SaveVisitPayload
 * patch via `toSavePayloadPatch()`, MERGES it into existing visit data
 * (does not destroy hand-typed SOAP or pre-existing diagnoses outside
 * the module's domain), then persists via `saveVisit()`.
 *
 * Audit: logs which CDSS suggestions were followed vs overridden — feeds
 * the override-vs-follow analytics that justify the per-pasien platform
 * fee in the "Free Forever" pricing tier (clinical quality signal).
 */

import { revalidatePath } from "next/cache";
import { saveVisit, type SaveVisitResult } from "../../../actions";
import { getVisitById } from "@/lib/visits";
import { getModuleSpec } from "@/lib/modules/registry";
import { toSavePayloadPatch } from "@/lib/modules/engine";
import type { ModuleSnapshot } from "@/lib/modules/types";
import { logEvent } from "@/lib/audit";

export async function applyModuleSnapshot(
  visitId: string,
  patientId: string,
  snapshot: ModuleSnapshot,
): Promise<SaveVisitResult> {
  const spec = await getModuleSpec(snapshot.moduleId);
  if (!spec) {
    return { ok: false, message: `Modul "${snapshot.moduleId}" tidak ditemukan.` };
  }

  const fv = await getVisitById(visitId);
  if (!fv || fv.visit.patientId !== patientId) {
    return { ok: false, message: "Kunjungan tidak ditemukan." };
  }

  if (fv.visit.signedAt) {
    return { ok: false, message: "Kunjungan sudah ditandatangani — tidak bisa diubah." };
  }

  const patch = toSavePayloadPatch(spec, snapshot);

  // ---------- Merge SOAP ----------
  // If doctor already typed something, append the engine-composed line so
  // we don't blow away their work.
  const mergedSoap = mergeSoap(
    {
      S: fv.soap?.subjective ?? null,
      O: fv.soap?.objective ?? null,
      A: fv.soap?.assessment ?? null,
      P: fv.soap?.plan ?? null,
    },
    patch.soap,
  );

  // ---------- Merge diagnoses ----------
  // Engine-supplied diagnoses replace any prior diagnoses with the same
  // ICD-10 code; existing dx outside the module's domain are preserved.
  const moduleDxCodes = new Set(patch.diagnoses.map((d) => d.icd10Code));
  const engineHasPrimary = patch.diagnoses.some((d) => d.diagnosisType === "primary");
  const keptDiagnoses = fv.diagnoses
    .filter((d) => !moduleDxCodes.has(d.icd10Code))
    .map((d) => ({
      icd10Code: d.icd10Code,
      icd10NameId: d.icd10NameId ?? null,
      icd10NameEn: d.icd10NameEn ?? null,
      // Demote pre-existing primary if engine asserts a new primary
      diagnosisType:
        engineHasPrimary && d.diagnosisType === "primary"
          ? ("secondary" as const)
          : (d.diagnosisType as "primary" | "secondary" | "comorbid"),
      isChronic: !!d.isChronic,
    }));
  const mergedDiagnoses = [...patch.diagnoses, ...keptDiagnoses];

  // ---------- Merge procedures ----------
  // De-dup by ICD-9 code; engine's snapshot fee/notes win for shared codes.
  const moduleTxCodes = new Set(patch.procedures.map((p) => p.icd9Code));
  const keptProcedures = fv.procedures
    .filter((p) => !moduleTxCodes.has(p.icd9Code))
    .map((p) => ({
      icd9Code: p.icd9Code,
      icd9NameId: p.icd9NameId ?? null,
      icd9NameEn: p.icd9NameEn ?? null,
      isOperative: !!p.isOperative,
      feeIdr: p.feeIdr ?? 0,
      notes: p.notes ?? null,
    }));
  const mergedProcedures = [...patch.procedures, ...keptProcedures];

  // ---------- Merge prescriptions ----------
  // Append all engine-templated prescriptions; don't drop prior rx the
  // doctor wrote manually.
  const keptRx = fv.prescriptions.map((r) => ({
    drugName: r.drugName,
    genericName: r.genericName ?? null,
    drugForm: r.drugForm ?? null,
    strength: r.strength ?? null,
    dose: r.dose ?? null,
    frequency: r.frequency ?? null,
    duration: r.duration ?? null,
    route: r.route ?? null,
    instructions: r.instructions ?? null,
    quantity: r.quantity ?? null,
    unit: r.unit ?? null,
  }));
  const mergedPrescriptions = [...patch.prescriptions, ...keptRx];

  // ---------- Build the SaveVisitPayload-shaped object ----------
  const v = fv.visit;
  const payload = {
    chiefComplaint: v.chiefComplaint ?? snapshot.context.chiefComplaint ?? null,
    weightKg: v.weightKg != null ? Number(v.weightKg) : null,
    heightCm: v.heightCm != null ? Number(v.heightCm) : null,
    bloodPressure: v.bloodPressure ?? null,
    heartRate: v.heartRate ?? null,
    temperatureC: v.temperatureC != null ? Number(v.temperatureC) : null,
    spo2: v.spo2 ?? null,
    paymentType: (v.paymentType ?? "umum") as "umum" | "bpjs" | "asuransi",

    subjective: mergedSoap.S,
    historyPresent: fv.soap?.historyPresent ?? null,
    pastHistory: fv.soap?.pastHistory ?? null,
    objective: mergedSoap.O,
    assessment: mergedSoap.A,
    plan: mergedSoap.P,

    diagnoses: mergedDiagnoses,
    procedures: mergedProcedures,
    prescriptions: mergedPrescriptions,
  };

  const result = await saveVisit(visitId, payload);
  if (!result.ok) return result;

  // ---------- Audit: snapshot of override-vs-follow ----------
  // What the engine suggested vs what the doctor actually applied.
  const suggestedTreatments = new Set<string>();
  for (const s of snapshot.suggestions) {
    for (const id of s.suggestTreatmentIds ?? []) suggestedTreatments.add(id);
  }
  const appliedTreatments = new Set(snapshot.applied.treatmentIds);
  const followed = [...suggestedTreatments].filter((id) => appliedTreatments.has(id));
  const overridden = [...suggestedTreatments].filter(
    (id) => !appliedTreatments.has(id),
  );
  const addedManual = [...appliedTreatments].filter(
    (id) => !suggestedTreatments.has(id),
  );

  await logEvent({
    action: "update",
    entity: "visit",
    entityId: visitId,
    after: {
      moduleApplied: snapshot.moduleId,
      capturedAt: snapshot.capturedAt,
      primaryIcd10: snapshot.applied.primaryIcd10 ?? null,
      followedSuggestions: followed,
      overriddenSuggestions: overridden,
      manualAdditions: addedManual,
      suggestionCount: snapshot.suggestions.length,
    },
  });

  revalidatePath(`/pasien/${patientId}/kunjungan/${visitId}/edit`);
  return { ok: true };
}

// ---------- Helpers ----------

function mergeSoap(
  prior: { S: string | null; O: string | null; A: string | null; P: string | null },
  next: { S: string; O: string; A: string; P: string },
): { S: string; O: string; A: string; P: string } {
  return {
    S: appendIfNew(prior.S, next.S),
    O: appendIfNew(prior.O, next.O),
    A: appendIfNew(prior.A, next.A),
    P: appendIfNew(prior.P, next.P),
  };
}

function appendIfNew(prior: string | null | undefined, next: string): string {
  const p = (prior ?? "").trim();
  const n = next.trim();
  if (!n) return p;
  if (!p) return n;
  if (p.includes(n)) return p;
  return `${p}\n${n}`;
}
