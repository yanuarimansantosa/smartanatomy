/**
 * Cross-module catalog — aggregate ICD-10 diagnoses and ICD-9-CM procedures
 * from every registered ModuleSpec so they can be browsed/searched standalone
 * (tanpa harus masuk kunjungan pasien dulu).
 *
 * Used by:
 *   /icd-10      — browser diagnosis ICD-10 (dari spec.diagnoses[])
 *   /icd-9       — browser tindakan ICD-9-CM (dari spec.treatments[icd9Code])
 *   /cdss-tester — dropdown pilih modul → jalankan rule tanpa pasien real
 */

import { getModuleSpec, MODULE_LISTINGS } from "./registry";
import type { ModuleSpec, TreatmentOption } from "./types";

export type Icd10Entry = {
  code: string;
  display: string;
  isChronic?: boolean;
  defaultPrimary?: boolean;
  reasoning?: string;
  moduleId: string;
  moduleTitle: string;
  subspecialty: string;
};

export type Icd9Entry = {
  code: string;
  nameId: string;
  treatmentId: string;
  treatmentLabel: string;
  category: TreatmentOption["category"];
  feeIdr?: number;
  isOperative?: boolean;
  moduleId: string;
  moduleTitle: string;
  subspecialty: string;
};

/** Load every registered module spec in parallel. */
export async function loadAllSpecs(): Promise<ModuleSpec[]> {
  const results = await Promise.all(
    MODULE_LISTINGS.map(async (m) => {
      const s = await getModuleSpec(m.id);
      return s;
    }),
  );
  return results.filter((s): s is ModuleSpec => !!s);
}

/** Aggregate ICD-10 diagnoses across all modules. Deduped by code+module. */
export async function getAllIcd10(): Promise<Icd10Entry[]> {
  const specs = await loadAllSpecs();
  const out: Icd10Entry[] = [];
  for (const spec of specs) {
    for (const dx of spec.diagnoses) {
      out.push({
        code: dx.icd10Code,
        display: dx.display,
        isChronic: dx.isChronic,
        defaultPrimary: dx.defaultPrimary,
        reasoning: dx.reasoning,
        moduleId: spec.id,
        moduleTitle: spec.title,
        subspecialty: spec.subspecialty,
      });
    }
  }
  out.sort((a, b) => a.code.localeCompare(b.code));
  return out;
}

/** Aggregate ICD-9-CM procedure codes (from treatments where icd9Code present). */
export async function getAllIcd9(): Promise<Icd9Entry[]> {
  const specs = await loadAllSpecs();
  const out: Icd9Entry[] = [];
  for (const spec of specs) {
    for (const t of spec.treatments) {
      if (!t.icd9Code) continue;
      out.push({
        code: t.icd9Code,
        nameId: t.icd9NameId ?? t.label,
        treatmentId: t.id,
        treatmentLabel: t.label,
        category: t.category,
        feeIdr: t.feeIdr,
        isOperative: t.isOperative,
        moduleId: spec.id,
        moduleTitle: spec.title,
        subspecialty: spec.subspecialty,
      });
    }
  }
  out.sort((a, b) => a.code.localeCompare(b.code));
  return out;
}

/** Count how many modules contribute to the catalog (for UI headers). */
export async function getCatalogStats(): Promise<{
  moduleCount: number;
  icd10Count: number;
  icd9Count: number;
}> {
  const [icd10, icd9] = await Promise.all([getAllIcd10(), getAllIcd9()]);
  return {
    moduleCount: MODULE_LISTINGS.length,
    icd10Count: icd10.length,
    icd9Count: icd9.length,
  };
}
