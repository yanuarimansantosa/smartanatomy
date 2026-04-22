/**
 * Clinical Thinking Engine — type definitions.
 *
 * Setiap modul penyakit (Tonsilitis, CRS, OMSK, Foreign Body, BPPV, dll) =
 * satu `ModuleSpec` data file. Engine generic membaca spec & merender 10
 * bagian standar (anamnesis, exam, scoring, pathway, treatment, education,
 * smart summary, auto SOAP, billing snapshot, override hooks).
 *
 * HARD RULES:
 *   - Default = NORMAL (zero-typing untuk pasien sehat)
 *   - NO LLM — semua aturan deterministic & traceable
 *   - Setiap saran punya reference (teaching mode)
 *   - Override di setiap titik (dokter pemilik akhir)
 */

// ============================================================================
// Section 1 — Diagnosis candidates (ICD-10 with rule-based primary suggestion)
// ============================================================================

export type DxOption = {
  icd10Code: string; // "J35.0"
  display: string; // "Tonsilitis kronik"
  /** Default checked state (visual hint that engine considers this primary candidate). */
  defaultPrimary?: boolean;
  isChronic?: boolean;
  /** For teaching — short reasoning blurb. */
  reasoning?: string;
};

// ============================================================================
// Section 2 & 3 — Tap items (anamnesis + physical examination)
// ============================================================================

export type TapItem = {
  id: string;
  /** Statement when NORMAL (untapped). e.g., "Tidak ada bersin pagi" */
  normalLabel: string;
  /** Statement when ABNORMAL (tapped). e.g., "Bersin pagi hari" */
  abnormalLabel: string;
  /** Default value (true = abnormal). Almost always false per HARD RULE. */
  defaultAbnormal?: boolean;
  /** Optional tag for the engine to query in CDSS rules. */
  tag?: string;
};

export type TapSection = {
  title: string;
  helper?: string;
  items: TapItem[];
};

// ============================================================================
// Section 4 — Risk scoring (deterministic instruments: STOP-BANG, SNOT-22, …)
// ============================================================================

export type ScoringInputYesNo = {
  type: "yesNo";
  id: string;
  label: string;
  weightYes?: number;
  weightNo?: number;
};

export type ScoringInputScale = {
  type: "scale";
  id: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  default?: number;
};

export type ScoringInputSelect = {
  type: "select";
  id: string;
  label: string;
  options: { value: number; label: string }[];
  default?: number;
};

export type ScoringInput =
  | ScoringInputYesNo
  | ScoringInputScale
  | ScoringInputSelect;

export type ScoringResult = {
  total: number;
  severity: "low" | "moderate" | "high" | "very-high";
  interpretation: string;
  /** Optional clinical recommendation derived from severity. */
  recommendation?: string;
};

export type ScoringInstrument = {
  id: string; // "stop-bang"
  name: string; // "STOP-BANG"
  description?: string;
  reference?: { label: string; url?: string };
  inputs: ScoringInput[];
  compute: (values: Record<string, number>) => ScoringResult;
};

// ============================================================================
// Section 6 — Clinical pathway (steps, tickable when complete)
// ============================================================================

export type PathwayStep = {
  id: string;
  title: string;
  detail?: string;
};

// ============================================================================
// Section 7 — Treatment options (ICD-9 procedures and/or prescriptions)
// ============================================================================

export type TreatmentPrescription = {
  drugName: string;
  genericName?: string;
  drugForm?: string;
  strength?: string;
  dose?: string;
  frequency?: string;
  duration?: string;
  route?: string;
  instructions?: string;
  quantity?: number;
  unit?: string;
};

export type TreatmentOption = {
  id: string;
  label: string;
  category: "medikamentosa" | "tindakan" | "edukasi" | "rujukan";
  /** ICD-9 procedure mapping when category=tindakan. */
  icd9Code?: string;
  icd9NameId?: string;
  feeIdr?: number;
  isOperative?: boolean;
  /** Prescription template when category=medikamentosa. */
  prescription?: TreatmentPrescription;
  /** Reference for teaching mode. */
  reference?: { label: string; url?: string };
  /** Default-selected when an associated tag/diagnosis fires. */
  defaultSelected?: boolean;
};

// ============================================================================
// Section 10 — Patient education (auto-generated, printable)
// ============================================================================

export type EducationContent = {
  title: string;
  bullets: string[];
  /** Channel hints (UI offers print / WA / email after sign). */
  channels?: ("print" | "wa" | "email")[];
};

// ============================================================================
// Section 11 — SOAP mapping (compose narrative from tap state, NO LLM)
// ============================================================================

export type SoapMapping = {
  /** Composer functions receive snapshot context, return narrative strings. */
  subjective: (ctx: ModuleContext) => string;
  objective: (ctx: ModuleContext) => string;
  assessment: (ctx: ModuleContext) => string;
  plan: (ctx: ModuleContext) => string;
};

// ============================================================================
// Engine state shared across compute / render / persist
// ============================================================================

export type ModuleContext = {
  /** id -> isAbnormal */
  anamnesis: Record<string, boolean>;
  examination: Record<string, boolean>;
  /** scoringId -> { values, result } */
  scoring: Record<
    string,
    { values: Record<string, number>; result: ScoringResult }
  >;
  /** treatmentId -> selected */
  treatments: Record<string, boolean>;
  /** override-able diagnoses chosen by doctor */
  diagnoses: { icd10Code: string; primary: boolean; isChronic: boolean }[];
  /** chief complaint snapshot from visit */
  chiefComplaint: string;
};

// ============================================================================
// CDSS rules — fire on context change to produce suggestions / banners
// ============================================================================

export type CdssSuggestion = {
  ruleId: string;
  level: "info" | "warn" | "danger" | "success" | "emergency";
  message: string;
  reference?: { label: string; url?: string };
  /** Optionally suggest making a specific dx primary. */
  suggestPrimaryIcd10?: string;
  /** Optionally pre-check certain treatments. */
  suggestTreatmentIds?: string[];
};

export type CdssRule = {
  id: string;
  evaluate: (ctx: ModuleContext) => CdssSuggestion | null;
};

// ============================================================================
// Emergency mode (for time-critical modules like Foreign Body Airway)
// ============================================================================

export type EmergencyTrigger = {
  /** Banner color when active. */
  level: "amber" | "red";
  /** Heading shown at top of module. */
  title: string;
  /** Subline beneath title. */
  message: string;
  /** Optional fast-action buttons. */
  actions?: { id: string; label: string }[];
  /** Returns true if emergency mode should activate. */
  trigger: (ctx: ModuleContext) => boolean;
};

// ============================================================================
// Top-level ModuleSpec
// ============================================================================

export type ModuleSpec = {
  id: string; // "tonsilitis"
  title: string; // "Tonsilitis Kronik"
  subspecialty: string; // "Faring/Laring"
  /** Lucide icon name for menu/header (optional). */
  iconName?: string;
  /** Short tag list shown under title (e.g. "STOP-BANG", "Brodsky"). */
  tags?: string[];
  /** Emergency banners (e.g. Foreign Body, anaphylaxis) — at most one fires. */
  emergencyTriggers?: EmergencyTrigger[];
  diagnoses: DxOption[];
  cdssRules?: CdssRule[];
  anamnesis: TapSection;
  examination: TapSection;
  scoring?: ScoringInstrument[];
  pathway?: PathwayStep[];
  treatments: TreatmentOption[];
  education: EducationContent;
  soapMapping: SoapMapping;
  /** Free-form references (PERHATI-KL, EPOS, AAO-HNS) for footer. */
  references?: { label: string; url?: string }[];
};

// ============================================================================
// Snapshot persisted into soap_notes.scoringResults JSONB
// ============================================================================

export type ModuleSnapshot = {
  moduleId: string;
  capturedAt: string; // ISO
  context: ModuleContext;
  /** What CDSS suggested at capture time (audit). */
  suggestions: CdssSuggestion[];
  /** What was actually applied to the visit (audit override-vs-follow). */
  applied: {
    primaryIcd10?: string;
    treatmentIds: string[];
    soap: { S: string; O: string; A: string; P: string };
  };
};

// ============================================================================
// Helpers / factories
// ============================================================================

export function emptyContext(spec: ModuleSpec, chiefComplaint = ""): ModuleContext {
  const anamnesis: Record<string, boolean> = {};
  for (const it of spec.anamnesis.items) {
    anamnesis[it.id] = !!it.defaultAbnormal;
  }
  const examination: Record<string, boolean> = {};
  for (const it of spec.examination.items) {
    examination[it.id] = !!it.defaultAbnormal;
  }
  const treatments: Record<string, boolean> = {};
  for (const t of spec.treatments) {
    treatments[t.id] = !!t.defaultSelected;
  }
  const scoring: ModuleContext["scoring"] = {};
  for (const s of spec.scoring ?? []) {
    const values: Record<string, number> = {};
    for (const inp of s.inputs) {
      if (inp.type === "yesNo") values[inp.id] = 0;
      else if (inp.type === "scale") values[inp.id] = inp.default ?? inp.min;
      else values[inp.id] = inp.default ?? inp.options[0]?.value ?? 0;
    }
    scoring[s.id] = { values, result: s.compute(values) };
  }
  const diagnoses = spec.diagnoses
    .filter((d) => d.defaultPrimary)
    .map((d) => ({
      icd10Code: d.icd10Code,
      primary: true,
      isChronic: !!d.isChronic,
    }));
  return { anamnesis, examination, scoring, treatments, diagnoses, chiefComplaint };
}
