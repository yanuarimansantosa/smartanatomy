/**
 * Module 2 — Rinosinusitis Kronik / CRS (J32)
 * Reference: EPOS 2020 + PPK PERHATI-KL · SNOT-22 (gold standard QoL)
 *
 * Karakter: kronik (>12 minggu) · scoring 3 instrumen (SNOT-22 ringkas /
 * EPOS gejala wajib / status polip) · decision node FESS jika gagal terapi
 * 4–12 minggu.
 */

import type { ModuleSpec, ScoringResult } from "../types";

const snot22Compute = (v: Record<string, number>): ScoringResult => {
  const total = Object.values(v).reduce((a, b) => a + b, 0);
  const sev: ScoringResult["severity"] =
    total >= 50 ? "very-high" : total >= 30 ? "high" : total >= 8 ? "moderate" : "low";
  const interp =
    total >= 50
      ? "CRS berat — quality-of-life sangat terganggu"
      : total >= 30
        ? "CRS moderate-severe"
        : total >= 8
          ? "CRS ringan-sedang"
          : "Gejala minimal";
  return {
    total,
    severity: sev,
    interpretation: `SNOT-22 ${total} — ${interp}`,
    recommendation:
      total >= 30
        ? "Pertimbangkan terapi medis maksimal + evaluasi FESS bila gagal"
        : undefined,
  };
};

const eposCompute = (v: Record<string, number>): ScoringResult => {
  const cardinal = (v.obstruction ?? 0) + (v.discharge ?? 0);
  const minor = (v.pain ?? 0) + (v.smell ?? 0);
  const duration = v.duration ?? 0;
  const cardinalMet = cardinal >= 1;
  const totalGejala = cardinal + minor;
  const met = cardinalMet && totalGejala >= 2 && duration >= 1;
  return {
    total: totalGejala,
    severity: met ? "high" : "low",
    interpretation: met
      ? "EPOS criteria TERPENUHI (≥2 gejala dengan ≥1 cardinal + durasi >12 minggu)"
      : "EPOS criteria belum terpenuhi",
    recommendation: met ? "Diagnosa CRS dapat ditegakkan" : "Reevaluasi durasi / gejala",
  };
};

const polypCompute = (v: Record<string, number>): ScoringResult => {
  const status = v.status ?? 0;
  const sev: ScoringResult["severity"] =
    status === 2 ? "high" : status === 1 ? "moderate" : "low";
  const interp =
    status === 0
      ? "Tanpa polip (CRSsNP)"
      : status === 1
        ? "Polip unilateral — perlu eksklusi keganasan/inverted papilloma"
        : "Polip bilateral (CRSwNP)";
  return {
    total: status,
    severity: sev,
    interpretation: interp,
    recommendation:
      status === 1
        ? "Wajib biopsi/CT untuk eksklusi neoplasma"
        : status === 2
          ? "Tambahkan steroid intranasal dosis tinggi ± steroid oral siklus pendek"
          : undefined,
  };
};

const spec: ModuleSpec = {
  id: "crs",
  title: "Rinosinusitis Kronik",
  subspecialty: "Hidung & Sinus",
  iconName: "wind",
  tags: ["J32", "EPOS 2020", "SNOT-22"],

  diagnoses: [
    {
      icd10Code: "J32",
      display: "Rinosinusitis kronik (CRS)",
      defaultPrimary: true,
      isChronic: true,
      reasoning: "≥2 gejala (≥1 cardinal: obstruksi/discharge) + durasi >12 minggu",
    },
    {
      icd10Code: "J32.4",
      display: "Pansinusitis kronik",
      isChronic: true,
    },
    {
      icd10Code: "J33",
      display: "Polip nasal",
      isChronic: true,
    },
    {
      icd10Code: "J01",
      display: "Sinusitis akut (rule-out)",
    },
    {
      icd10Code: "J30.4",
      display: "Rinitis alergi (komorbid)",
      isChronic: true,
    },
  ],

  anamnesis: {
    title: "Anamnesis",
    helper: "Tap bila ABNORMAL. Cardinal symptoms = obstruksi & discharge.",
    items: [
      {
        id: "obstruksi-hidung",
        normalLabel: "Hidung patensi normal",
        abnormalLabel: "Hidung tersumbat (cardinal)",
        tag: "obstruction",
      },
      {
        id: "discharge",
        normalLabel: "Tidak ada discharge",
        abnormalLabel: "Discharge nasal/post-nasal drip (cardinal)",
        tag: "discharge",
      },
      {
        id: "facial-pain",
        normalLabel: "Tidak ada nyeri wajah",
        abnormalLabel: "Nyeri/penekanan wajah",
        tag: "facial-pain",
      },
      {
        id: "smell-loss",
        normalLabel: "Penghidu normal",
        abnormalLabel: "Hiposmia / anosmia",
        tag: "smell-loss",
      },
      {
        id: "post-nasal-drip",
        normalLabel: "Tidak ada PND",
        abnormalLabel: "Post nasal drip",
      },
      {
        id: "headache",
        normalLabel: "Tidak ada nyeri kepala",
        abnormalLabel: "Sefalgia",
      },
      {
        id: "durasi-12wk",
        normalLabel: "Durasi <12 minggu",
        abnormalLabel: "Gejala persisten >12 minggu",
        tag: "chronic-duration",
      },
      {
        id: "atopi",
        normalLabel: "Tidak ada riwayat atopi",
        abnormalLabel: "Riwayat asma / rinitis alergi",
      },
    ],
  },

  examination: {
    title: "Pemeriksaan Fisik (rinoskopi anterior)",
    helper: "Idealnya nasoendoskopi. Tap bila abnormal.",
    items: [
      {
        id: "mukosa-edema",
        normalLabel: "Mukosa tenang",
        abnormalLabel: "Mukosa edema/hiperemis",
        tag: "edema",
      },
      {
        id: "sekret-purulen",
        normalLabel: "Tidak ada sekret",
        abnormalLabel: "Sekret mukopurulen di meatus media",
        tag: "purulent",
      },
      {
        id: "polip",
        normalLabel: "Tidak ada polip",
        abnormalLabel: "Polip nasal terlihat",
        tag: "polyp",
      },
      {
        id: "deviasi-septum",
        normalLabel: "Septum lurus",
        abnormalLabel: "Deviasi septum",
      },
      {
        id: "hipertrofi-konka",
        normalLabel: "Konka normal",
        abnormalLabel: "Hipertrofi konka inferior",
      },
    ],
  },

  scoring: [
    {
      id: "snot-22-ringkas",
      name: "SNOT-22 (ringkas 6 dimensi)",
      description:
        "Versi ringkas SNOT-22: 6 dimensi penilaian (0–5 setiap dimensi). Total dijumlah, ekspansi ke 22 item bisa di-toggle nanti.",
      reference: { label: "Hopkins C, EPOS 2020 — SNOT-22 scoring" },
      inputs: [
        {
          type: "scale",
          id: "rhinologic",
          label: "Gejala rinologis (obstruksi, discharge, post-nasal)",
          min: 0,
          max: 5,
          step: 1,
          default: 0,
        },
        {
          type: "scale",
          id: "extra-nasal",
          label: "Gejala ekstra-nasal (nyeri kepala, telinga)",
          min: 0,
          max: 5,
          step: 1,
          default: 0,
        },
        {
          type: "scale",
          id: "ear-facial",
          label: "Telinga/wajah (penuh, tekanan)",
          min: 0,
          max: 5,
          step: 1,
          default: 0,
        },
        {
          type: "scale",
          id: "sleep",
          label: "Gangguan tidur",
          min: 0,
          max: 5,
          step: 1,
          default: 0,
        },
        {
          type: "scale",
          id: "psychological",
          label: "Dampak psikologis (frustasi, sedih)",
          min: 0,
          max: 5,
          step: 1,
          default: 0,
        },
        {
          type: "scale",
          id: "function",
          label: "Fungsional (kerja, konsentrasi)",
          min: 0,
          max: 5,
          step: 1,
          default: 0,
        },
      ],
      compute: snot22Compute,
    },
    {
      id: "epos-criteria",
      name: "EPOS 2020 diagnostic criteria",
      description: "≥2 gejala (≥1 cardinal: obstruction atau discharge) + durasi >12 minggu.",
      reference: { label: "EPOS 2020 — Fokkens et al." },
      inputs: [
        { type: "yesNo", id: "obstruction", label: "Cardinal: hidung tersumbat" },
        { type: "yesNo", id: "discharge", label: "Cardinal: nasal/post-nasal discharge" },
        { type: "yesNo", id: "pain", label: "Nyeri/penekanan wajah" },
        { type: "yesNo", id: "smell", label: "Gangguan penghidu" },
        { type: "yesNo", id: "duration", label: "Durasi gejala >12 minggu" },
      ],
      compute: eposCompute,
    },
    {
      id: "polyp-status",
      name: "Status polip",
      description: "CRSsNP (tanpa polip) vs CRSwNP (dengan polip bilateral).",
      reference: { label: "EPOS phenotyping" },
      inputs: [
        {
          type: "select",
          id: "status",
          label: "Polip pada nasoendoskopi",
          options: [
            { value: 0, label: "Tidak ada (CRSsNP)" },
            { value: 1, label: "Unilateral (curiga neoplasma)" },
            { value: 2, label: "Bilateral (CRSwNP)" },
          ],
          default: 0,
        },
      ],
      compute: polypCompute,
    },
  ],

  cdssRules: [
    {
      id: "fess-indication",
      evaluate: (ctx) => {
        const snot = ctx.scoring["snot-22-ringkas"]?.result.total ?? 0;
        const epos = ctx.scoring["epos-criteria"]?.result.severity ?? "low";
        if (snot >= 30 && epos === "high") {
          return {
            ruleId: "fess-indication",
            level: "warn",
            message: `SNOT-22 ${snot} + EPOS terpenuhi — pertimbangkan FESS bila terapi medis 4–12 minggu gagal.`,
            reference: { label: "EPOS 2020 — surgical indication" },
            suggestTreatmentIds: ["nasal-steroid", "saline-irrigation", "fess"],
          };
        }
        return null;
      },
    },
    {
      id: "polyp-unilateral-warn",
      evaluate: (ctx) => {
        const polyp = ctx.scoring["polyp-status"]?.values["status"] ?? 0;
        if (polyp === 1) {
          return {
            ruleId: "polyp-unilateral-warn",
            level: "danger",
            message:
              "⚠ Polip unilateral — wajib eksklusi inverted papilloma / neoplasma. Rujuk untuk biopsi + CT scan.",
            reference: { label: "EPOS 2020 — unilateral lesion red flag" },
            suggestTreatmentIds: ["ct-scan-sinus", "rujuk-onko"],
          };
        }
        return null;
      },
    },
    {
      id: "atopi-allergy",
      evaluate: (ctx) => {
        if (ctx.anamnesis["atopi"]) {
          return {
            ruleId: "atopi-allergy",
            level: "info",
            message:
              "Riwayat atopi terdeteksi — tambahkan terapi alergi (antihistamine ± leukotriene antagonist).",
            suggestTreatmentIds: ["antihistamine"],
          };
        }
        return null;
      },
    },
    {
      id: "purulent-bacterial",
      evaluate: (ctx) => {
        if (
          ctx.examination["sekret-purulen"] &&
          ctx.anamnesis["facial-pain"]
        ) {
          return {
            ruleId: "purulent-bacterial",
            level: "info",
            message:
              "Sekret purulen + nyeri wajah — eksaserbasi bakterial. Pertimbangkan amoxicillin-clavulanate 7–10 hari.",
            suggestTreatmentIds: ["amox-clav"],
          };
        }
        return null;
      },
    },
  ],

  pathway: [
    { id: "step-1", title: "Anamnesis", detail: "Cardinal symptom + durasi >12 minggu." },
    { id: "step-2", title: "Rinoskopi anterior / nasoendoskopi", detail: "Dokumentasi polip, sekret, mukosa." },
    { id: "step-3", title: "Skoring SNOT-22 + EPOS criteria" },
    { id: "step-4", title: "Klasifikasi fenotipe", detail: "CRSsNP vs CRSwNP." },
    { id: "step-5", title: "Terapi medis 4–12 minggu", detail: "Steroid intranasal + saline irrigation ± antibiotik." },
    { id: "step-6", title: "Re-evaluasi", detail: "Jika gagal → CT scan + evaluasi FESS." },
  ],

  treatments: [
    {
      id: "nasal-steroid",
      label: "Steroid intranasal (mometasone 50µg 2x semprot/lubang)",
      category: "medikamentosa",
      defaultSelected: true,
      prescription: {
        drugName: "Mometasone furoate 50µg nasal spray",
        genericName: "Mometasone furoate",
        drugForm: "spray",
        strength: "50 µg/semprot",
        dose: "2 semprot",
        frequency: "1x sehari (pagi)",
        duration: "minimal 8 minggu",
        route: "topical",
        instructions:
          "Bersihkan hidung dulu. Tunduk sedikit, semprot ke arah luar (jangan ke septum).",
        quantity: 1,
        unit: "botol",
      },
      reference: { label: "EPOS 2020 — first-line CRS therapy" },
    },
    {
      id: "saline-irrigation",
      label: "Cuci hidung saline isotonik 2–3x/hari",
      category: "edukasi",
      defaultSelected: true,
      prescription: {
        drugName: "NaCl 0.9% nasal irrigation",
        drugForm: "lainnya",
        dose: "120 ml per lubang hidung",
        frequency: "2–3x sehari",
        duration: "rutin selama terapi",
        route: "topical",
        instructions:
          "Pakai botol semprot/neti pot. Posisi tunduk, kepala miring, biarkan saline mengalir.",
      },
    },
    {
      id: "amox-clav",
      label: "Amoxicillin-clavulanate 625 mg 3x1 selama 10 hari",
      category: "medikamentosa",
      prescription: {
        drugName: "Amoxicillin-clavulanate",
        genericName: "Amoxicillin/Clavulanic acid",
        drugForm: "tablet",
        strength: "625 mg (500/125)",
        dose: "1 tablet",
        frequency: "3x sehari",
        duration: "10 hari",
        route: "oral",
        instructions: "Minum bersama makanan untuk kurangi mual.",
        quantity: 30,
        unit: "tablet",
      },
    },
    {
      id: "antihistamine",
      label: "Cetirizine 10 mg 1x1 (komorbid alergi)",
      category: "medikamentosa",
      prescription: {
        drugName: "Cetirizine",
        genericName: "Cetirizine HCl",
        drugForm: "tablet",
        strength: "10 mg",
        dose: "1 tablet",
        frequency: "1x sehari (malam)",
        duration: "30 hari",
        route: "oral",
        quantity: 30,
        unit: "tablet",
      },
    },
    {
      id: "oral-steroid",
      label: "Prednison oral siklus pendek (CRSwNP berat)",
      category: "medikamentosa",
      prescription: {
        drugName: "Prednison",
        genericName: "Prednisone",
        drugForm: "tablet",
        strength: "5 mg",
        dose: "30 mg pagi (taper 5–10 hari)",
        frequency: "1x sehari",
        duration: "5–10 hari",
        route: "oral",
        instructions: "Minum setelah makan pagi. Jangan stop tiba-tiba.",
        quantity: 20,
        unit: "tablet",
      },
      reference: { label: "EPOS 2020 — short-course oral steroid CRSwNP" },
    },
    {
      id: "ct-scan-sinus",
      label: "CT Scan paranasal (Lund-Mackay scoring)",
      category: "tindakan",
      icd9Code: "87.03",
      icd9NameId: "CT scan kepala/sinus paranasal",
      isOperative: false,
    },
    {
      id: "fess",
      label: "FESS (Functional Endoscopic Sinus Surgery)",
      category: "tindakan",
      icd9Code: "22.2",
      icd9NameId: "Sinusotomi endoskopik fungsional",
      isOperative: true,
      feeIdr: 12_500_000,
      reference: { label: "EPOS 2020 — surgical management" },
    },
    {
      id: "rujuk-onko",
      label: "Rujuk Sp.THT-KL onkologi (polip unilateral)",
      category: "rujukan",
    },
    {
      id: "edukasi-pemicu",
      label: "Edukasi hindari pemicu (asap, polusi, alergen)",
      category: "edukasi",
    },
  ],

  education: {
    title: "Rinosinusitis Kronik — Edukasi Pasien",
    bullets: [
      "Rinosinusitis kronik = peradangan mukosa hidung & sinus berlangsung >12 minggu.",
      "Cuci hidung saline 2–3x sehari = pondasi utama terapi (bukan opsi).",
      "Steroid semprot hidung harus dipakai rutin minimal 8 minggu walau sudah membaik.",
      "Hindari pemicu: asap rokok, debu, polusi, parfum kuat.",
      "Operasi (FESS) dipertimbangkan bila terapi medis 4–12 minggu gagal.",
      "Polip nasal cenderung kambuh — kontrol rutin penting.",
      "Tanda bahaya: nyeri kepala hebat, demam tinggi, gangguan penglihatan, bengkak periorbita → segera kontrol.",
    ],
    channels: ["print", "wa"],
  },

  soapMapping: {
    subjective: (ctx) => {
      const snot = ctx.scoring["snot-22-ringkas"]?.result.total ?? 0;
      const out: string[] = [];
      if (ctx.chiefComplaint) out.push(ctx.chiefComplaint);
      if (ctx.anamnesis["obstruksi-hidung"]) out.push("hidung tersumbat");
      if (ctx.anamnesis["discharge"]) out.push("nasal/post-nasal discharge");
      if (ctx.anamnesis["facial-pain"]) out.push("nyeri/penekanan wajah");
      if (ctx.anamnesis["smell-loss"]) out.push("hiposmia/anosmia");
      if (ctx.anamnesis["headache"]) out.push("nyeri kepala");
      if (ctx.anamnesis["durasi-12wk"]) out.push("durasi >12 minggu");
      if (ctx.anamnesis["atopi"]) out.push("riwayat atopi");
      if (snot > 0) out.push(`SNOT-22 (ringkas) ${snot}`);
      return out.length > 0 ? out.join(", ") + "." : "Tanpa keluhan rhinologis spesifik.";
    },
    objective: (ctx) => {
      const polypStatus = ctx.scoring["polyp-status"]?.values["status"] ?? 0;
      const out: string[] = [];
      if (ctx.examination["mukosa-edema"]) out.push("mukosa edema/hiperemis");
      if (ctx.examination["sekret-purulen"]) out.push("sekret mukopurulen di meatus media");
      if (ctx.examination["polip"]) {
        const tipe = polypStatus === 1 ? "unilateral" : polypStatus === 2 ? "bilateral" : "ada";
        out.push(`polip nasal ${tipe}`);
      }
      if (ctx.examination["deviasi-septum"]) out.push("deviasi septum");
      if (ctx.examination["hipertrofi-konka"]) out.push("hipertrofi konka inferior");
      return out.length > 0 ? out.join(", ") + "." : "Rinoskopi anterior dalam batas normal.";
    },
    assessment: (ctx) => {
      const primary = ctx.diagnoses.find((d) => d.primary);
      const epos = ctx.scoring["epos-criteria"]?.result;
      const polypStatus = ctx.scoring["polyp-status"]?.values["status"] ?? 0;
      const fenotipe = polypStatus >= 1 ? "CRSwNP" : "CRSsNP";
      if (!primary) return "Belum ada diagnosa primer.";
      const eposNote =
        epos?.severity === "high" ? " (EPOS criteria terpenuhi)" : "";
      return `${primary.icd10Code} — ${primary.icd10Code === "J32" ? `Rinosinusitis kronik · ${fenotipe}` : "lihat diagnoses"}${eposNote}.`;
    },
    plan: (ctx) => {
      const out: string[] = [];
      if (ctx.treatments["nasal-steroid"]) out.push("Mometasone nasal spray 2 semprot/lubang 1x/hr ≥8mg");
      if (ctx.treatments["saline-irrigation"]) out.push("Cuci hidung saline 2–3x/hr");
      if (ctx.treatments["amox-clav"]) out.push("Amoxiclav 625mg 3x1 10hr");
      if (ctx.treatments["antihistamine"]) out.push("Cetirizine 10mg 1x malam 30hr");
      if (ctx.treatments["oral-steroid"]) out.push("Prednison taper 5–10hr");
      if (ctx.treatments["ct-scan-sinus"]) out.push("CT scan sinus (Lund-Mackay)");
      if (ctx.treatments["fess"]) out.push("Rencana FESS");
      if (ctx.treatments["rujuk-onko"]) out.push("Rujuk THT onkologi");
      if (ctx.treatments["edukasi-pemicu"]) out.push("Edukasi hindari pemicu");
      out.push("Re-evaluasi 4 minggu");
      return out.join("; ") + ".";
    },
  },

  references: [
    { label: "EPOS 2020 — Fokkens et al. Rhinology 2020;58(Suppl S29):1-464" },
    { label: "PPK PERHATI-KL — Rinosinusitis Kronik" },
    { label: "Hopkins C — SNOT-22 validation" },
  ],
};

export default spec;
