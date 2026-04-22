/**
 * Pure compute helpers for ModuleSpec — no React, no DB.
 * Used both client-side (live recompute on tap) and server-side (apply to visit).
 */

import type {
  CdssSuggestion,
  ModuleContext,
  ModuleSnapshot,
  ModuleSpec,
  ScoringResult,
} from "./types";

/** Re-run all scoring instruments after `values` change. */
export function recomputeScoring(
  spec: ModuleSpec,
  ctx: ModuleContext,
): ModuleContext {
  const scoring: ModuleContext["scoring"] = { ...ctx.scoring };
  for (const s of spec.scoring ?? []) {
    const values = scoring[s.id]?.values ?? {};
    scoring[s.id] = { values, result: s.compute(values) };
  }
  return { ...ctx, scoring };
}

/** Run all CDSS rules and return suggestions in declaration order. */
export function evaluateCdss(
  spec: ModuleSpec,
  ctx: ModuleContext,
): CdssSuggestion[] {
  const out: CdssSuggestion[] = [];
  for (const rule of spec.cdssRules ?? []) {
    const s = rule.evaluate(ctx);
    if (s) out.push(s);
  }
  return out;
}

/** Pick the active emergency trigger (first match wins) — null if none. */
export function activeEmergency(spec: ModuleSpec, ctx: ModuleContext) {
  for (const e of spec.emergencyTriggers ?? []) {
    if (e.trigger(ctx)) return e;
  }
  return null;
}

/** Compose SOAP narrative from current context + selected treatments. */
export function composeSoap(spec: ModuleSpec, ctx: ModuleContext) {
  return {
    S: spec.soapMapping.subjective(ctx),
    O: spec.soapMapping.objective(ctx),
    A: spec.soapMapping.assessment(ctx),
    P: spec.soapMapping.plan(ctx),
  };
}

/** Sum fee of currently selected treatments with feeIdr. */
export function billingTotal(spec: ModuleSpec, ctx: ModuleContext): number {
  let total = 0;
  for (const t of spec.treatments) {
    if (ctx.treatments[t.id] && t.feeIdr) total += t.feeIdr;
  }
  return total;
}

/** Build a snapshot ready to persist (and audit). */
export function buildSnapshot(
  spec: ModuleSpec,
  ctx: ModuleContext,
): ModuleSnapshot {
  const suggestions = evaluateCdss(spec, ctx);
  const soap = composeSoap(spec, ctx);
  const primary = ctx.diagnoses.find((d) => d.primary);
  const treatmentIds = spec.treatments
    .filter((t) => ctx.treatments[t.id])
    .map((t) => t.id);
  return {
    moduleId: spec.id,
    capturedAt: new Date().toISOString(),
    context: ctx,
    suggestions,
    applied: {
      primaryIcd10: primary?.icd10Code,
      treatmentIds,
      soap,
    },
  };
}

/** Convenience: ScoringResult severity ↔ tone-token for UI. */
export function severityTone(s: ScoringResult["severity"]): {
  label: string;
  tone: "muted" | "info" | "warn" | "danger";
} {
  switch (s) {
    case "low":
      return { label: "Risiko rendah", tone: "muted" };
    case "moderate":
      return { label: "Risiko sedang", tone: "info" };
    case "high":
      return { label: "Risiko tinggi", tone: "warn" };
    case "very-high":
      return { label: "Risiko sangat tinggi", tone: "danger" };
  }
}

/** Translate snapshot → SaveVisitPayload-shaped patch (engine-side, pure). */
export function toSavePayloadPatch(
  spec: ModuleSpec,
  snapshot: ModuleSnapshot,
): {
  diagnoses: {
    icd10Code: string;
    icd10NameId?: string | null;
    diagnosisType: "primary" | "secondary" | "comorbid";
    isChronic: boolean;
  }[];
  procedures: {
    icd9Code: string;
    icd9NameId?: string | null;
    isOperative: boolean;
    feeIdr: number;
    notes?: string | null;
  }[];
  prescriptions: {
    drugName: string;
    genericName?: string | null;
    drugForm?: string | null;
    strength?: string | null;
    dose?: string | null;
    frequency?: string | null;
    duration?: string | null;
    route?: string | null;
    instructions?: string | null;
    quantity?: number | null;
    unit?: string | null;
  }[];
  soap: { S: string; O: string; A: string; P: string };
} {
  const dxList = snapshot.context.diagnoses.map((d) => {
    const dxMeta = spec.diagnoses.find((x) => x.icd10Code === d.icd10Code);
    return {
      icd10Code: d.icd10Code,
      icd10NameId: dxMeta?.display ?? null,
      diagnosisType: d.primary ? ("primary" as const) : ("secondary" as const),
      isChronic: d.isChronic,
    };
  });

  const procedures: ReturnType<typeof toSavePayloadPatch>["procedures"] = [];
  const prescriptions: ReturnType<typeof toSavePayloadPatch>["prescriptions"] =
    [];

  for (const id of snapshot.applied.treatmentIds) {
    const t = spec.treatments.find((x) => x.id === id);
    if (!t) continue;
    if (t.icd9Code) {
      procedures.push({
        icd9Code: t.icd9Code,
        icd9NameId: t.icd9NameId ?? t.label,
        isOperative: !!t.isOperative,
        feeIdr: t.feeIdr ?? 0,
        notes: null,
      });
    }
    if (t.prescription) {
      const p = t.prescription;
      prescriptions.push({
        drugName: p.drugName,
        genericName: p.genericName ?? null,
        // Cast freeform strings — actions.ts validates with zod enums
        drugForm: (p.drugForm as string | null | undefined) ?? null,
        strength: p.strength ?? null,
        dose: p.dose ?? null,
        frequency: p.frequency ?? null,
        duration: p.duration ?? null,
        route: (p.route as string | null | undefined) ?? null,
        instructions: p.instructions ?? null,
        quantity: p.quantity ?? null,
        unit: p.unit ?? null,
      });
    }
  }

  return { diagnoses: dxList, procedures, prescriptions, soap: snapshot.applied.soap };
}
