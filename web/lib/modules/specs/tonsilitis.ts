/**
 * Module 1 — Tonsilitis Kronik / Adenoiditis (J35.0)
 * Reference: PPK PERHATI-KL · STOP-BANG (Chung et al.) · Brodsky tonsil scale
 *
 * Karakter: kronik · scoring 3 instrumen (STOP-BANG / Brodsky / infection burden)
 * → smart summary "pertimbangkan tonsilektomi" jika Brodsky ≥3 + ≥6 episode/th.
 */

import type { ModuleSpec, ScoringResult } from "../types";

const stopBangCompute = (v: Record<string, number>): ScoringResult => {
  const total = Object.values(v).reduce((a, b) => a + b, 0);
  if (total >= 5)
    return {
      total,
      severity: "high",
      interpretation: "Risiko tinggi OSA (STOP-BANG ≥5)",
      recommendation: "Polisomnografi · pertimbangkan rujuk sleep clinic",
    };
  if (total >= 3)
    return {
      total,
      severity: "moderate",
      interpretation: "Risiko sedang OSA",
      recommendation: "Edukasi tidur · pertimbangkan skrining lanjut",
    };
  return { total, severity: "low", interpretation: "Risiko rendah OSA" };
};

const brodskyCompute = (v: Record<string, number>): ScoringResult => {
  const grade = v.grade ?? 0;
  const sev: ScoringResult["severity"] =
    grade >= 4 ? "very-high" : grade >= 3 ? "high" : grade >= 2 ? "moderate" : "low";
  const interp =
    grade === 0
      ? "Tonsil dalam fossa"
      : grade === 1
        ? "Tonsil <25% obstruksi"
        : grade === 2
          ? "Tonsil 25–50% obstruksi"
          : grade === 3
            ? "Tonsil 50–75% obstruksi"
            : "Tonsil >75% obstruksi (kissing tonsils)";
  return {
    total: grade,
    severity: sev,
    interpretation: `Brodsky grade ${grade} — ${interp}`,
    recommendation:
      grade >= 3
        ? "Pertimbangkan tonsilektomi (terutama bila ada gejala obstruktif)"
        : undefined,
  };
};

const infectionCompute = (v: Record<string, number>): ScoringResult => {
  const ep = v.episodes ?? 0;
  const sev: ScoringResult["severity"] =
    ep >= 7 ? "very-high" : ep >= 5 ? "high" : ep >= 3 ? "moderate" : "low";
  return {
    total: ep,
    severity: sev,
    interpretation: `${ep} episode/tahun`,
    recommendation:
      ep >= 7
        ? "Memenuhi Paradise criteria (≥7/th) — indikasi tonsilektomi"
        : ep >= 5
          ? "Pertimbangkan tonsilektomi (≥5/th selama 2 tahun = Paradise criteria)"
          : undefined,
  };
};

const spec: ModuleSpec = {
  id: "tonsilitis",
  title: "Tonsilitis Kronik",
  subspecialty: "Faring/Laring",
  iconName: "stethoscope",
  tags: ["J35.0", "Brodsky", "STOP-BANG", "Paradise"],

  diagnoses: [
    {
      icd10Code: "J35.0",
      display: "Tonsilitis kronik",
      defaultPrimary: true,
      isChronic: true,
      reasoning: "Nyeri menelan berulang + tonsil membesar + halitosis",
    },
    {
      icd10Code: "J35.1",
      display: "Hipertrofi tonsil",
      isChronic: true,
    },
    {
      icd10Code: "J35.2",
      display: "Hipertrofi adenoid",
      isChronic: true,
    },
    {
      icd10Code: "J35.3",
      display: "Hipertrofi tonsil & adenoid",
      isChronic: true,
    },
  ],

  anamnesis: {
    title: "Anamnesis",
    helper: "Tap bila ABNORMAL — default semua NORMAL.",
    items: [
      {
        id: "nyeri-menelan",
        normalLabel: "Tidak ada nyeri menelan",
        abnormalLabel: "Nyeri menelan berulang",
        tag: "odynophagia",
      },
      {
        id: "halitosis",
        normalLabel: "Tidak ada bau mulut",
        abnormalLabel: "Halitosis",
        tag: "halitosis",
      },
      {
        id: "ngorok",
        normalLabel: "Tidak ngorok",
        abnormalLabel: "Ngorok / mendengkur",
        tag: "snoring",
      },
      {
        id: "sleep-disturbance",
        normalLabel: "Tidur nyenyak",
        abnormalLabel: "Tidur tidak nyenyak / mengantuk siang",
        tag: "sleep-disturbance",
      },
      {
        id: "demam-berulang",
        normalLabel: "Tidak ada demam berulang",
        abnormalLabel: "Demam berulang (faringitis berulang)",
        tag: "recurrent-fever",
      },
      {
        id: "sulit-makan",
        normalLabel: "Makan normal",
        abnormalLabel: "Sulit menelan makanan padat",
      },
    ],
  },

  examination: {
    title: "Pemeriksaan Fisik",
    helper: "Inspeksi orofaring dengan tongue depressor.",
    items: [
      {
        id: "tonsil-membesar",
        normalLabel: "Tonsil tidak membesar",
        abnormalLabel: "Tonsil membesar",
        tag: "tonsil-enlarged",
      },
      {
        id: "detritus-kripta",
        normalLabel: "Tidak ada detritus",
        abnormalLabel: "Detritus pada kripta",
        tag: "detritus",
      },
      {
        id: "hiperemis",
        normalLabel: "Mukosa tenang",
        abnormalLabel: "Hiperemis tonsil/faring",
      },
      {
        id: "kissing-tonsil",
        normalLabel: "Tidak ada kissing tonsil",
        abnormalLabel: "Kissing tonsil (Brodsky 4)",
      },
      {
        id: "limfadenopati-leher",
        normalLabel: "KGB leher tidak teraba",
        abnormalLabel: "Limfadenopati submandibula",
      },
    ],
  },

  scoring: [
    {
      id: "stop-bang",
      name: "STOP-BANG (OSA risk)",
      description: "Skrining OSA pada pasien dengan ngorok / sleep disturbance.",
      reference: { label: "Chung et al. 2008 — Anesthesiology" },
      inputs: [
        { type: "yesNo", id: "S", label: "Snoring keras (terdengar di kamar lain)", weightYes: 1 },
        { type: "yesNo", id: "T", label: "Tired / mengantuk siang hari", weightYes: 1 },
        { type: "yesNo", id: "O", label: "Observed apnea", weightYes: 1 },
        { type: "yesNo", id: "P", label: "Pressure tinggi (HT)", weightYes: 1 },
        { type: "yesNo", id: "B", label: "BMI >35", weightYes: 1 },
        { type: "yesNo", id: "A", label: "Age >50 tahun", weightYes: 1 },
        { type: "yesNo", id: "N", label: "Neck circumference >40 cm", weightYes: 1 },
        { type: "yesNo", id: "G", label: "Gender pria", weightYes: 1 },
      ],
      compute: stopBangCompute,
    },
    {
      id: "brodsky",
      name: "Brodsky tonsil grading",
      description: "Derajat hipertrofi tonsil (0–4).",
      reference: { label: "Brodsky L. 1989 — Pediatric Clinics of North America" },
      inputs: [
        {
          type: "select",
          id: "grade",
          label: "Grade Brodsky",
          options: [
            { value: 0, label: "0 — Dalam fossa" },
            { value: 1, label: "1 — <25%" },
            { value: 2, label: "2 — 25–50%" },
            { value: 3, label: "3 — 50–75%" },
            { value: 4, label: "4 — >75% (kissing)" },
          ],
          default: 0,
        },
      ],
      compute: brodskyCompute,
    },
    {
      id: "infection-burden",
      name: "Beban Infeksi (Paradise criteria)",
      description: "Frekuensi episode tonsilitis akut per tahun.",
      reference: { label: "Paradise JL. 1984 — NEJM" },
      inputs: [
        {
          type: "scale",
          id: "episodes",
          label: "Episode tonsilitis akut / 12 bulan terakhir",
          min: 0,
          max: 12,
          step: 1,
          default: 0,
        },
      ],
      compute: infectionCompute,
    },
  ],

  cdssRules: [
    {
      id: "tonsilektomi-indikasi",
      evaluate: (ctx) => {
        const brodsky = ctx.scoring["brodsky"]?.result.total ?? 0;
        const ep = ctx.scoring["infection-burden"]?.result.total ?? 0;
        if (brodsky >= 3 && ep >= 6) {
          return {
            ruleId: "tonsilektomi-indikasi",
            level: "warn",
            message: `Brodsky ${brodsky} + ${ep} episode/th — pertimbangkan tonsilektomi (Paradise criteria terpenuhi).`,
            reference: { label: "Paradise criteria" },
            suggestTreatmentIds: ["tonsilektomi"],
          };
        }
        return null;
      },
    },
    {
      id: "osa-rujuk",
      evaluate: (ctx) => {
        const sb = ctx.scoring["stop-bang"]?.result.total ?? 0;
        if (sb >= 5) {
          return {
            ruleId: "osa-rujuk",
            level: "info",
            message: `STOP-BANG ${sb} — risiko OSA tinggi, pertimbangkan polisomnografi.`,
            reference: { label: "STOP-BANG ≥5 = high risk OSA" },
          };
        }
        return null;
      },
    },
    {
      id: "akut-vs-kronik",
      evaluate: (ctx) => {
        if (ctx.anamnesis["demam-berulang"] && ctx.examination["hiperemis"]) {
          return {
            ruleId: "akut-vs-kronik",
            level: "info",
            message:
              "Eksaserbasi akut pada tonsilitis kronik — pertimbangkan antibiotik + analgesik selama 7–10 hari.",
            suggestTreatmentIds: ["amoksisilin", "parasetamol"],
          };
        }
        return null;
      },
    },
  ],

  pathway: [
    { id: "step-1", title: "Anamnesis fokus", detail: "Episode/tahun, gejala obstruksi tidur, halitosis." },
    { id: "step-2", title: "Pemeriksaan orofaring", detail: "Brodsky grading + detritus + hiperemis." },
    { id: "step-3", title: "Skrining OSA bila ngorok", detail: "STOP-BANG ≥3 → evaluasi lanjut." },
    { id: "step-4", title: "Tentukan indikasi operasi", detail: "Paradise criteria atau Brodsky 3–4 + obstruksi." },
    { id: "step-5", title: "Konseling tonsilektomi / terapi konservatif" },
    { id: "step-6", title: "Edukasi & follow-up" },
  ],

  treatments: [
    {
      id: "amoksisilin",
      label: "Amoksisilin 500 mg 3x1 selama 7 hari",
      category: "medikamentosa",
      prescription: {
        drugName: "Amoksisilin",
        genericName: "Amoxicillin",
        drugForm: "kapsul",
        strength: "500 mg",
        dose: "1 kapsul",
        frequency: "3x sehari",
        duration: "7 hari",
        route: "oral",
        instructions: "Habiskan walau gejala membaik.",
        quantity: 21,
        unit: "kapsul",
      },
      reference: { label: "PPK PERHATI-KL — terapi tonsilitis akut" },
    },
    {
      id: "parasetamol",
      label: "Parasetamol 500 mg PRN nyeri",
      category: "medikamentosa",
      prescription: {
        drugName: "Parasetamol",
        genericName: "Paracetamol",
        drugForm: "tablet",
        strength: "500 mg",
        dose: "1 tablet",
        frequency: "tiap 6 jam bila nyeri/demam",
        duration: "PRN",
        route: "oral",
        quantity: 10,
        unit: "tablet",
      },
    },
    {
      id: "kumur-antiseptik",
      label: "Kumur antiseptik (povidone iodine)",
      category: "medikamentosa",
      prescription: {
        drugName: "Povidone iodine 1% gargle",
        drugForm: "lainnya",
        dose: "10 ml",
        frequency: "2–3x sehari",
        duration: "7 hari",
        route: "topical",
        instructions: "Kumur 30 detik, jangan ditelan.",
        quantity: 1,
        unit: "botol",
      },
    },
    {
      id: "tonsilektomi",
      label: "Tonsilektomi (operasi)",
      category: "tindakan",
      icd9Code: "28.2",
      icd9NameId: "Tonsilektomi tanpa adenoidektomi",
      isOperative: true,
      feeIdr: 6_500_000,
      reference: { label: "PPK PERHATI-KL · Paradise criteria" },
    },
    {
      id: "adeno-tonsilektomi",
      label: "Adeno-tonsilektomi",
      category: "tindakan",
      icd9Code: "28.3",
      icd9NameId: "Tonsilektomi dengan adenoidektomi",
      isOperative: true,
      feeIdr: 7_500_000,
    },
    {
      id: "rujuk-sleep",
      label: "Rujuk poliklinik sleep / polisomnografi",
      category: "rujukan",
    },
    {
      id: "edukasi-hidrasi",
      label: "Edukasi hidrasi + hindari iritan",
      category: "edukasi",
    },
  ],

  education: {
    title: "Tonsilitis Kronik — Edukasi Pasien",
    bullets: [
      "Tonsilitis kronik = peradangan menetap pada tonsil, bisa kambuh berulang.",
      "Hindari iritan: rokok, makanan terlalu pedas/dingin, minuman dingin berlebihan.",
      "Cukup minum air putih + istirahat saat eksaserbasi akut.",
      "Antibiotik harus dihabiskan walau gejala sudah membaik.",
      "Operasi dipertimbangkan bila kambuh ≥7x dalam 1 tahun, ≥5x/tahun selama 2 tahun, atau ada gangguan tidur (OSA).",
      "Setelah operasi: diet lunak/dingin 1–2 minggu, hindari aktivitas berat 2 minggu.",
    ],
    channels: ["print", "wa"],
  },

  soapMapping: {
    subjective: (ctx) => {
      const ep = ctx.scoring["infection-burden"]?.result.total ?? 0;
      const sb = ctx.scoring["stop-bang"]?.result.total ?? 0;
      const out: string[] = [];
      if (ctx.chiefComplaint) out.push(ctx.chiefComplaint);
      if (ctx.anamnesis["nyeri-menelan"]) out.push("nyeri menelan berulang");
      if (ctx.anamnesis["halitosis"]) out.push("halitosis");
      if (ctx.anamnesis["ngorok"]) out.push("ngorok saat tidur");
      if (ctx.anamnesis["sleep-disturbance"]) out.push("tidur tidak nyenyak");
      if (ctx.anamnesis["demam-berulang"]) out.push("demam berulang");
      if (ctx.anamnesis["sulit-makan"]) out.push("sulit menelan makanan padat");
      if (ep > 0) out.push(`riwayat ${ep} episode tonsilitis akut/tahun`);
      if (sb >= 3) out.push(`STOP-BANG ${sb}`);
      return out.length > 0 ? out.join(", ") + "." : "Pasien tanpa keluhan spesifik.";
    },
    objective: (ctx) => {
      const grade = ctx.scoring["brodsky"]?.result.total ?? 0;
      const out: string[] = [];
      out.push(`Tonsil Brodsky grade ${grade}`);
      if (ctx.examination["detritus-kripta"]) out.push("detritus pada kripta");
      if (ctx.examination["hiperemis"]) out.push("mukosa hiperemis");
      if (ctx.examination["kissing-tonsil"]) out.push("kissing tonsils");
      if (ctx.examination["limfadenopati-leher"]) out.push("limfadenopati submandibula");
      return out.join(", ") + ".";
    },
    assessment: (ctx) => {
      const primary = ctx.diagnoses.find((d) => d.primary);
      if (!primary) return "Belum ada diagnosa primer.";
      return `${primary.icd10Code} — Tonsilitis kronik${primary.isChronic ? " (kronik)" : ""}.`;
    },
    plan: (ctx) => {
      const out: string[] = [];
      if (ctx.treatments["amoksisilin"]) out.push("Amoksisilin 500mg 3x1 7hr");
      if (ctx.treatments["parasetamol"]) out.push("Parasetamol PRN");
      if (ctx.treatments["kumur-antiseptik"]) out.push("Kumur povidone iodine 2–3x/hr");
      if (ctx.treatments["tonsilektomi"]) out.push("Rencana tonsilektomi");
      if (ctx.treatments["adeno-tonsilektomi"]) out.push("Rencana adeno-tonsilektomi");
      if (ctx.treatments["rujuk-sleep"]) out.push("Rujuk sleep clinic");
      if (ctx.treatments["edukasi-hidrasi"]) out.push("Edukasi hidrasi + hindari iritan");
      out.push("Kontrol H+7 atau bila keluhan memberat");
      return out.join("; ") + ".";
    },
  },

  references: [
    { label: "PPK PERHATI-KL — Tonsilitis Kronik" },
    { label: "Paradise JL. NEJM 1984 — Tonsillectomy criteria" },
    { label: "Brodsky L. 1989 — Tonsil grading" },
    { label: "Chung F et al. 2008 — STOP-BANG questionnaire" },
  ],
};

export default spec;
