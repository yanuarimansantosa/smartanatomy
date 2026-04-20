import Dexie, { type EntityTable } from "dexie";
import type {
  Patient,
  Encounter,
  Observation,
  Condition,
  MedicationRequest,
  Practitioner,
  MutationQueueEntry,
} from "./schema";

export class RmeDatabase extends Dexie {
  patients!: EntityTable<Patient, "id">;
  encounters!: EntityTable<Encounter, "id">;
  observations!: EntityTable<Observation, "id">;
  conditions!: EntityTable<Condition, "id">;
  medicationRequests!: EntityTable<MedicationRequest, "id">;
  practitioners!: EntityTable<Practitioner, "id">;
  mutationQueue!: EntityTable<MutationQueueEntry, "id">;

  constructor() {
    super("rme");

    this.version(1).stores({
      patients: "id, nik, ihsNumber, name, updatedAt, syncStatus",
      encounters:
        "id, patientId, practitionerId, status, startedAt, updatedAt, syncStatus",
      observations:
        "id, encounterId, patientId, category, code, effectiveAt, syncStatus",
      conditions:
        "id, encounterId, patientId, icd10Code, isPrimary, syncStatus",
      medicationRequests: "id, encounterId, patientId, syncStatus",
      practitioners: "id, nik, ihsPractitionerId, syncStatus",
      mutationQueue: "id, resource, resourceId, createdAt, attempts",
    });
  }
}

export const db = new RmeDatabase();

export function newId(): string {
  return crypto.randomUUID();
}

export function now(): number {
  return Date.now();
}
