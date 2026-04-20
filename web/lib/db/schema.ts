/**
 * Internal data model — aligned to FHIR R4 resources for SATUSEHAT mapping.
 * Setiap resource punya field minimum + extension JSONB untuk fleksibilitas.
 *
 * Mapping ke FHIR dilakukan saat sync ke server (lihat docs/02-stack-proposal.md).
 */

export type SyncStatus = "pending" | "synced" | "conflict" | "error";

export interface BaseRecord {
  id: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
  syncStatus: SyncStatus;
  syncError?: string;
}

export type Gender = "male" | "female" | "other" | "unknown";

export interface Patient extends BaseRecord {
  nik?: string;
  ihsNumber?: string;
  name: string;
  birthDate: string;
  gender: Gender;
  phone?: string;
  address?: string;
  bloodType?: "A" | "B" | "AB" | "O" | "unknown";
  rhesus?: "+" | "-" | "unknown";
  allergies?: string[];
  notes?: string;
}

export type EncounterStatus =
  | "planned"
  | "in-progress"
  | "finished"
  | "cancelled";

export interface Encounter extends BaseRecord {
  patientId: string;
  practitionerId: string;
  status: EncounterStatus;
  startedAt: number;
  endedAt?: number;
  chiefComplaint?: string;
  anamnesis?: string;
  examination?: string;
  assessment?: string;
  plan?: string;
}

export interface Observation extends BaseRecord {
  encounterId: string;
  patientId: string;
  category: "vital-signs" | "exam" | "lab";
  code: string;
  display: string;
  valueQuantity?: { value: number; unit: string };
  valueString?: string;
  effectiveAt: number;
}

export interface Condition extends BaseRecord {
  encounterId: string;
  patientId: string;
  icd10Code: string;
  display: string;
  clinicalStatus: "active" | "recurrence" | "remission" | "resolved";
  isPrimary: boolean;
  notes?: string;
}

export interface MedicationRequest extends BaseRecord {
  encounterId: string;
  patientId: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  route?: string;
  notes?: string;
}

export interface Practitioner extends BaseRecord {
  name: string;
  nik?: string;
  ihsPractitionerId?: string;
  str?: string;
  sip?: string;
  specialty?: string;
}

export type MutationOp = "create" | "update" | "delete";

export interface MutationQueueEntry {
  id: string;
  op: MutationOp;
  resource:
    | "patient"
    | "encounter"
    | "observation"
    | "condition"
    | "medicationRequest"
    | "practitioner";
  resourceId: string;
  payload: unknown;
  createdAt: number;
  attempts: number;
  lastError?: string;
}
