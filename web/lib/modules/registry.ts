/**
 * Central registry of disease modules. Each spec lives in `./specs/<id>.ts`
 * and is registered here so the route `/pasien/.../modul/[moduleId]` can
 * resolve `moduleId -> ModuleSpec` server-side without dynamic imports.
 *
 * Add a new module = drop a spec file under `specs/` and register it here.
 */

import type { ModuleSpec } from "./types";

const MODULES: Record<string, () => Promise<ModuleSpec>> = {
  // Module 1 — Tonsilitis Kronik (J35.0) — Brodsky + STOP-BANG
  // tonsilitis: async () => (await import("./specs/tonsilitis")).default,

  // Module 2 — Rinosinusitis Kronik (J32) — SNOT-22 + EPOS
  // crs: async () => (await import("./specs/crs")).default,

  // Module 3 — OMSK aman (H66.1)
  // "omsk-aman": async () => (await import("./specs/omsk-aman")).default,

  // Module 4 — OMSK bahaya (H66.2) + komplikasi panel
  // "omsk-bahaya": async () => (await import("./specs/omsk-bahaya")).default,

  // Module 5 — Foreign Body Airway (T17) — EMERGENCY MODE
  // "fb-airway": async () => (await import("./specs/fb-airway")).default,

  // Module 6 — BPPV (H81.1) — Dix-Hallpike + Epley
  // bppv: async () => (await import("./specs/bppv")).default,

  // Module 7 — Trauma Wajah & Maksilofasial (S02.x) — RED FLAG + imaging
  // "trauma-wajah": async () => (await import("./specs/trauma-wajah")).default,
};

export type ModuleListing = {
  id: string;
  title: string;
  subspecialty: string;
  tags?: string[];
  iconName?: string;
};

/** Lazy-load a single module spec by id. Returns null if unknown. */
export async function getModuleSpec(id: string): Promise<ModuleSpec | null> {
  const loader = MODULES[id];
  if (!loader) return null;
  try {
    return await loader();
  } catch {
    return null;
  }
}

/** Static listing for the menu, without loading every spec. */
export const MODULE_LISTINGS: ModuleListing[] = [
  {
    id: "tonsilitis",
    title: "Tonsilitis Kronik",
    subspecialty: "Faring/Laring",
    tags: ["J35.0", "Brodsky", "STOP-BANG"],
    iconName: "stethoscope",
  },
  {
    id: "crs",
    title: "Rinosinusitis Kronik",
    subspecialty: "Hidung & Sinus",
    tags: ["J32", "SNOT-22", "EPOS"],
    iconName: "wind",
  },
  {
    id: "omsk-aman",
    title: "OMSK Tipe Aman",
    subspecialty: "Telinga",
    tags: ["H66.1", "tubotimpanik"],
    iconName: "ear",
  },
  {
    id: "omsk-bahaya",
    title: "OMSK Tipe Bahaya",
    subspecialty: "Telinga",
    tags: ["H66.2", "kolesteatoma", "komplikasi"],
    iconName: "alert-triangle",
  },
  {
    id: "fb-airway",
    title: "Benda Asing Saluran Napas",
    subspecialty: "Emergency",
    tags: ["T17", "EMERGENCY"],
    iconName: "siren",
  },
  {
    id: "bppv",
    title: "BPPV",
    subspecialty: "Vertigo",
    tags: ["H81.1", "Dix-Hallpike", "Epley"],
    iconName: "rotate-3d",
  },
  {
    id: "trauma-wajah",
    title: "Trauma Wajah & Maksilofasial",
    subspecialty: "Trauma",
    tags: ["S02.x", "RED FLAG", "imaging"],
    iconName: "shield-alert",
  },
];

/** True if a moduleId has a corresponding registered spec (loadable). */
export function isModuleAvailable(id: string): boolean {
  return id in MODULES;
}
