/**
 * Module 7 — Rinitis Alergi (J30.4)
 * Reference: ARIA 2020 update · EAACI position paper 2018 · PERHATI-KL
 *            Konsensus Rinitis Alergi 2016 · Bousquet ARIA WHO 2008
 *
 * Karakter: kronik/intermittent · scoring 3 instrumen (SFAR untuk diagnosis
 * cepat / ARIA untuk klasifikasi terapi / TNSS untuk monitoring) · treatment
 * ladder berbasis ARIA (mild→antihistamin, moderate-severe→nasal steroid,
 * refractory→imunoterapi).
 *
 * FLAGSHIP MODULE — pintu masuk RME → Patient Entry System:
 *   - patientFacingScreening (SFAR) untuk pasien isi mandiri di HP/web
 *   - monetization 5-layer (platform fee, OTC, lab IgE, telekonsul, PDF)
 *
 * "One airway, one disease" — auto-flag asma comorbid (ARIA principle).
 */

import type { ModuleSpec, ScoringResult } from "../types";

// ---------------------------------------------------------------------------
// Scoring computers
// ---------------------------------------------------------------------------

/**
 * SFAR — Score For Allergic Rhinitis (Annesi-Maesano 2002).
 * 5 pertanyaan, total 0-9. Threshold ≥7 = sangat mungkin rinitis alergi.
 * Versi dokter (full). Versi pasien-facing ada di patientFacingScreening.
 */
const sfarCompute = (v: Record<string, number>): ScoringResult => {
  const total =
    (v.gejala ?? 0) * 2 +
    (v.pemicu ?? 0) * 2 +
    (v.mata ?? 0) * 1 +
    (v.alergiPersonal ?? 0) * 2 +
    (v.alergiKeluarga ?? 0) * 2;
  const sev: ScoringResult["severity"] =
    total >= 7 ? "very-high" : total >= 4 ? "high" : total >= 2 ? "moderate" : "low";
  const interp =
    total >= 7
      ? "SFAR ≥7 — sangat mungkin rinitis alergi"
      : total >= 4
        ? "SFAR 4-6 — kemungkinan rinitis alergi"
        : total >= 2
          ? "SFAR 2-3 — kecil kemungkinan rinitis alergi"
          : "SFAR <2 — sangat kecil";
  return {
    total,
    severity: sev,
    interpretation: `SFAR ${total}/9 — ${interp}`,
    recommendation:
      total >= 7
        ? "Konfirmasi klinis + pertimbangkan tes alergi spesifik (skin prick / IgE)"
        : total >= 4
          ? "Trial antihistamin H1 1-2 minggu, evaluasi respons"
          : "Cari diagnosis alternatif (rinitis vasomotor, infeksi, struktural)",
  };
};

/**
 * ARIA Classification — 2 sumbu × 2 kategori = 4 kelas.
 * Sumbu 1 (durasi): Intermittent (<4 hari/minggu DAN <4 minggu) vs
 *                   Persistent (≥4 hari/minggu DAN ≥4 minggu).
 * Sumbu 2 (severitas): Mild (semua: tidur normal, aktivitas normal, tidak
 *                      mengganggu) vs Moderate-Severe (≥1 terganggu).
 *
 * Treatment ladder (ARIA 2020 stepwise):
 *   - Mild intermittent → antihistamin H1 PRN
 *   - Mild persistent / Moderate-severe intermittent → antihistamin reguler
 *   - Moderate-severe persistent → nasal steroid ± antihistamin (first-line)
 *   - Refractory 4-12 minggu → step up + pertimbangkan imunoterapi
 */
const ariaCompute = (v: Record<string, number>): ScoringResult => {
  const persistent = (v.durasi ?? 0) === 1; // 0=intermittent, 1=persistent
  const moderateSevere = (v.severitas ?? 0) === 1; // 0=mild, 1=moderate-severe

  const klasifikasi = persistent
    ? moderateSevere
      ? "Persistent moderate-severe"
      : "Persistent mild"
    : moderateSevere
      ? "Intermittent moderate-severe"
      : "Intermittent mild";

  const sev: ScoringResult["severity"] =
    persistent && moderateSevere
      ? "very-high"
      : persistent || moderateSevere
        ? "high"
        : "moderate";

  const total = (persistent ? 2 : 0) + (moderateSevere ? 1 : 0);

  const recommendation =
    persistent && moderateSevere
      ? "Nasal steroid reguler (first-line) ± antihistamin H1; evaluasi 4 minggu"
      : moderateSevere
        ? "Antihistamin H1 reguler ± nasal steroid; evaluasi 2 minggu"
        : persistent
          ? "Antihistamin H1 reguler + saline lavage; nasal steroid bila perlu"
          : "Antihistamin H1 PRN + edukasi avoidance";

  return {
    total,
    severity: sev,
    interpretation: `ARIA: ${klasifikasi}`,
    recommendation,
  };
};

/**
 * TNSS — Total Nasal Symptom Score (Ellis 2013).
 * 4 gejala × skala 0-3 = total 0-12. Untuk monitoring respons terapi.
 */
const tnssCompute = (v: Record<string, number>): ScoringResult => {
  const total =
    (v.bersin ?? 0) + (v.rhinorrhea ?? 0) + (v.obstruksi ?? 0) + (v.gatal ?? 0);
  const sev: ScoringResult["severity"] =
    total >= 9 ? "very-high" : total >= 6 ? "high" : total >= 3 ? "moderate" : "low";
  const interp =
    total >= 9
      ? "TNSS berat — terapi belum optimal, step up"
      : total >= 6
        ? "TNSS sedang"
        : total >= 3
          ? "TNSS ringan — terapi adekuat"
          : "TNSS minimal — pertahankan";
  return {
    total,
    severity: sev,
    interpretation: `TNSS ${total}/12 — ${interp}`,
    recommendation:
      total >= 9
        ? "Step up terapi, periksa kepatuhan, pertimbangkan rujukan imunoterapi"
        : undefined,
  };
};

// ---------------------------------------------------------------------------
// Module spec
// ---------------------------------------------------------------------------

const spec: ModuleSpec = {
  id: "rinitis-alergi",
  title: "Rinitis Alergi",
  subspecialty: "Hidung & Sinus",
  iconName: "flower-2",
  tags: ["J30.4", "ARIA 2020", "SFAR", "TNSS"],

  diagnoses: [
    {
      icd10Code: "J30.4",
      display: "Rinitis alergika, tidak terinci",
      defaultPrimary: true,
      isChronic: false,
      reasoning:
        "Bersin paroksimal + rhinorrhea jernih + hidung gatal + pemicu lingkungan; SFAR ≥7 mendukung",
    },
    {
      icd10Code: "J30.1",
      display: "Rinitis alergika musiman (pollen/serbuk bunga)",
      isChronic: false,
    },
    {
      icd10Code: "J30.2",
      display: "Rinitis alergika perenial (debu, tungau, hewan)",
      isChronic: true,
    },
    {
      icd10Code: "J30.3",
      display: "Rinitis alergika non-musiman lainnya",
      isChronic: true,
    },
    {
      icd10Code: "J45",
      display: "Asma (comorbid — one airway, one disease)",
      isChronic: true,
      reasoning:
        "ARIA: pasien rinitis alergi 30-40% comorbid asma; wajib skrining wheezing/dyspnea",
    },
  ],

  // -------------------------------------------------------------------------
  // CDSS — fires deterministically on context change
  // -------------------------------------------------------------------------
  cdssRules: [
    {
      id: "aria-classify",
      evaluate: (ctx) => {
        const aria = ctx.scoring["aria"];
        if (!aria) return null;
        return {
          ruleId: "aria-classify",
          level: "info",
          message: aria.result.interpretation,
          reference: { label: "ARIA 2020 update — Bousquet et al. JACI 2020" },
        };
      },
    },
    {
      id: "treatment-mild-intermittent",
      evaluate: (ctx) => {
        const aria = ctx.scoring["aria"];
        if (!aria) return null;
        if (aria.result.total !== 0) return null;
        return {
          ruleId: "treatment-mild-intermittent",
          level: "success",
          message:
            "Mild intermittent → antihistamin H1 oral PRN cukup (cetirizine/loratadine)",
          reference: { label: "ARIA 2020 — step 1" },
          suggestTreatmentIds: ["cetirizine"],
        };
      },
    },
    {
      id: "treatment-persistent-or-moderate",
      evaluate: (ctx) => {
        const aria = ctx.scoring["aria"];
        if (!aria) return null;
        if (aria.result.total < 2) return null;
        return {
          ruleId: "treatment-persistent-or-moderate",
          level: "warn",
          message:
            "Persistent atau moderate-severe → nasal steroid reguler first-line (mometasone/fluticasone) ± antihistamin H1",
          reference: { label: "ARIA 2020 — step 2-3" },
          suggestTreatmentIds: ["mometasone-spray", "cetirizine"],
        };
      },
    },
    {
      id: "refer-immunotherapy",
      evaluate: (ctx) => {
        const aria = ctx.scoring["aria"];
        const tnss = ctx.scoring["tnss"];
        if (!aria || !tnss) return null;
        // Persistent moderate-severe + TNSS masih tinggi = refractory
        if (aria.result.total !== 3) return null;
        if (tnss.result.total < 9) return null;
        return {
          ruleId: "refer-immunotherapy",
          level: "warn",
          message:
            "Persistent moderate-severe + TNSS berat: pertimbangkan tes IgE spesifik + rujukan imunoterapi (SCIT/SLIT)",
          reference: { label: "EAACI 2018 — Allergen Immunotherapy guideline" },
          suggestTreatmentIds: ["ige-spesifik-rujukan", "imunoterapi-rujukan"],
        };
      },
    },
    {
      id: "comorbid-asthma-flag",
      evaluate: (ctx) => {
        const wheezing = ctx.anamnesis["wheezing"] || ctx.examination["wheezing-exam"];
        const dyspnea = ctx.anamnesis["dyspnea"];
        if (!wheezing && !dyspnea) return null;
        return {
          ruleId: "comorbid-asthma-flag",
          level: "danger",
          message:
            "ALERT — gejala asma (+). 'One airway, one disease' (ARIA): koordinasi dengan dokter paru, tatalaksana asma WAJIB ditegakkan paralel.",
          reference: { label: "ARIA 2020 — Asthma comorbidity" },
          suggestPrimaryIcd10: "J45",
        };
      },
    },
    {
      id: "consider-konkotomi",
      evaluate: (ctx) => {
        const konkaPersist = ctx.examination["konka-hipertrofi"];
        const aria = ctx.scoring["aria"];
        const tnss = ctx.scoring["tnss"];
        if (!konkaPersist) return null;
        // Hipertrofi konka + persistent moderate-severe + TNSS belum turun
        if (!aria || aria.result.total < 2) return null;
        if (!tnss || tnss.result.total < 6) return null;
        return {
          ruleId: "consider-konkotomi",
          level: "info",
          message:
            "Hipertrofi konka + persistent moderate-severe + gagal terapi medis → pertimbangkan konkotomi (turbinate reduction)",
          reference: { label: "PERHATI-KL Konsensus Rinitis Alergi 2016" },
          suggestTreatmentIds: ["konkotomi"],
        };
      },
    },
  ],

  // -------------------------------------------------------------------------
  // Anamnesis
  // -------------------------------------------------------------------------
  anamnesis: {
    title: "Anamnesis",
    helper:
      "Default = NORMAL. Tap hanya yang abnormal. SFAR-aligned + skrining asma.",
    items: [
      {
        id: "bersin-paroksimal",
        normalLabel: "Tidak ada bersin paroksimal",
        abnormalLabel: "Bersin paroksimal (≥3-5 kali berturut)",
        tag: "bersin",
      },
      {
        id: "hidung-gatal",
        normalLabel: "Hidung tidak gatal",
        abnormalLabel: "Hidung gatal",
        tag: "gatal",
      },
      {
        id: "rhinorrhea",
        normalLabel: "Tidak ada pilek bening",
        abnormalLabel: "Pilek bening encer (jernih)",
        tag: "rhinorrhea",
      },
      {
        id: "obstruksi",
        normalLabel: "Hidung tidak tersumbat",
        abnormalLabel: "Hidung tersumbat",
        tag: "obstruksi",
      },
      {
        id: "mata-gatal",
        normalLabel: "Mata tidak gatal/berair",
        abnormalLabel: "Mata gatal/berair (rinokonjungtivitis)",
        tag: "mata",
      },
      {
        id: "pemicu-lingkungan",
        normalLabel: "Tidak ada pemicu spesifik",
        abnormalLabel: "Ada pemicu (debu/tungau/serbuk/hewan/AC)",
        tag: "pemicu",
      },
      {
        id: "musiman",
        normalLabel: "Tidak musiman",
        abnormalLabel: "Pola musiman / seasonal",
        tag: "musiman",
      },
      {
        id: "tidur-terganggu",
        normalLabel: "Tidur tidak terganggu",
        abnormalLabel: "Tidur terganggu (mendengkur, terbangun)",
        tag: "tidur",
      },
      {
        id: "aktivitas-terganggu",
        normalLabel: "Aktivitas/sekolah/kerja tidak terganggu",
        abnormalLabel: "Aktivitas/sekolah/kerja terganggu",
        tag: "aktivitas",
      },
      {
        id: "alergi-personal",
        normalLabel: "Tanpa riwayat alergi pribadi",
        abnormalLabel: "Ada riwayat alergi (asma/eksim/makanan)",
        tag: "atopi-personal",
      },
      {
        id: "alergi-keluarga",
        normalLabel: "Tanpa riwayat alergi keluarga",
        abnormalLabel: "Riwayat alergi keluarga (orang tua/saudara)",
        tag: "atopi-keluarga",
      },
      {
        id: "wheezing",
        normalLabel: "Tidak ada mengi/sesak",
        abnormalLabel: "Mengi / sesak (curiga asma)",
        tag: "asma-screen",
      },
      {
        id: "dyspnea",
        normalLabel: "Tidak ada dyspnea on exertion",
        abnormalLabel: "Dyspnea saat aktivitas",
        tag: "asma-screen",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Examination
  // -------------------------------------------------------------------------
  examination: {
    title: "Pemeriksaan Fisik",
    helper:
      "Rinoskopi anterior + tanda atopik + skrining wheezing/auskultasi paru.",
    items: [
      {
        id: "mukosa-pucat",
        normalLabel: "Mukosa hidung normal (merah muda)",
        abnormalLabel: "Mukosa hidung pucat-kebiruan (allergic mucosa)",
        tag: "mukosa",
      },
      {
        id: "sekret-jernih",
        normalLabel: "Tanpa sekret signifikan",
        abnormalLabel: "Sekret jernih encer (rhinorrhea jernih)",
        tag: "sekret",
      },
      {
        id: "konka-hipertrofi",
        normalLabel: "Konka inferior normal",
        abnormalLabel: "Konka inferior hipertrofi pucat",
        tag: "konka",
      },
      {
        id: "allergic-salute",
        normalLabel: "Tanpa tanda allergic salute",
        abnormalLabel: "Allergic salute / nasal crease (anak)",
        tag: "atopi-fisik",
      },
      {
        id: "allergic-shiners",
        normalLabel: "Tanpa allergic shiners",
        abnormalLabel: "Allergic shiners (kantung mata gelap)",
        tag: "atopi-fisik",
      },
      {
        id: "konjungtivitis",
        normalLabel: "Konjungtiva tenang",
        abnormalLabel: "Konjungtiva injeksi (allergic conjunctivitis)",
        tag: "rinokonjungtivitis",
      },
      {
        id: "tonsil-hipertrofi",
        normalLabel: "Tonsil normal",
        abnormalLabel: "Tonsil hipertrofi (atopic march, anak)",
        tag: "atopi-anak",
      },
      {
        id: "wheezing-exam",
        normalLabel: "Auskultasi paru vesikular normal",
        abnormalLabel: "Wheezing / ekspirium memanjang (curiga asma)",
        tag: "asma-screen",
      },
      {
        id: "polip-nasal",
        normalLabel: "Tanpa polip nasal",
        abnormalLabel: "Polip nasal terlihat (perlu ddx CRSwNP)",
        tag: "polip",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Scoring
  // -------------------------------------------------------------------------
  scoring: [
    {
      id: "sfar",
      name: "SFAR — Score For Allergic Rhinitis",
      description: "5 item, total 0-9. Threshold ≥7 = sangat mungkin rinitis alergi.",
      reference: { label: "Annesi-Maesano et al. Allergy 2002" },
      inputs: [
        {
          type: "yesNo",
          id: "gejala",
          label: "Gejala tiba-tiba: bersin/gatal/pilek tanpa demam (×2)",
        },
        {
          type: "yesNo",
          id: "pemicu",
          label: "Pemicu: debu/hewan/serbuk/AC/perubahan udara (×2)",
        },
        {
          type: "yesNo",
          id: "mata",
          label: "Mata gatal/berair menyertai (×1)",
        },
        {
          type: "yesNo",
          id: "alergiPersonal",
          label: "Pernah didiagnosis alergi/asma/eksim (×2)",
        },
        {
          type: "yesNo",
          id: "alergiKeluarga",
          label: "Riwayat alergi/asma/eksim di keluarga (×2)",
        },
      ],
      compute: sfarCompute,
    },
    {
      id: "aria",
      name: "ARIA Classification",
      description:
        "2 sumbu: durasi (intermittent/persistent) × severitas (mild/moderate-severe). Menentukan tier terapi.",
      reference: { label: "ARIA 2020 update — Bousquet et al. JACI 2020" },
      inputs: [
        {
          type: "select",
          id: "durasi",
          label: "Durasi gejala",
          options: [
            { value: 0, label: "Intermittent (<4 hari/minggu DAN <4 minggu)" },
            { value: 1, label: "Persistent (≥4 hari/minggu DAN ≥4 minggu)" },
          ],
        },
        {
          type: "select",
          id: "severitas",
          label: "Dampak fungsional",
          options: [
            { value: 0, label: "Mild (semua: tidur normal, aktivitas normal)" },
            { value: 1, label: "Moderate-severe (≥1 terganggu)" },
          ],
        },
      ],
      compute: ariaCompute,
    },
    {
      id: "tnss",
      name: "TNSS — Total Nasal Symptom Score",
      description: "4 gejala × skala 0-3 = total 0-12. Monitoring respons terapi.",
      reference: { label: "Ellis et al. Ann Allergy Asthma Immunol 2013" },
      inputs: [
        {
          type: "scale",
          id: "bersin",
          label: "Bersin (0=tidak ada, 3=berat)",
          min: 0,
          max: 3,
          step: 1,
          default: 0,
        },
        {
          type: "scale",
          id: "rhinorrhea",
          label: "Pilek (0-3)",
          min: 0,
          max: 3,
          step: 1,
          default: 0,
        },
        {
          type: "scale",
          id: "obstruksi",
          label: "Hidung tersumbat (0-3)",
          min: 0,
          max: 3,
          step: 1,
          default: 0,
        },
        {
          type: "scale",
          id: "gatal",
          label: "Hidung gatal (0-3)",
          min: 0,
          max: 3,
          step: 1,
          default: 0,
        },
      ],
      compute: tnssCompute,
    },
  ],

  // -------------------------------------------------------------------------
  // Pathway
  // -------------------------------------------------------------------------
  pathway: [
    { id: "p-1-anamnesis", title: "Anamnesis SFAR + skrining asma" },
    { id: "p-2-pemfis", title: "Rinoskopi anterior + tanda atopik + auskultasi paru" },
    { id: "p-3-aria", title: "Klasifikasi ARIA (durasi × severitas)" },
    { id: "p-4-step", title: "Pilih terapi sesuai step ARIA" },
    { id: "p-5-evaluasi", title: "Evaluasi 2-4 minggu (TNSS)" },
    { id: "p-6-step-up", title: "Bila gagal: step up / pertimbangkan IgE + imunoterapi" },
  ],

  // -------------------------------------------------------------------------
  // Treatments
  // -------------------------------------------------------------------------
  treatments: [
    {
      id: "cetirizine",
      label: "Cetirizine 10mg PO 1×/hari",
      category: "medikamentosa",
      prescription: {
        drugName: "Cetirizine",
        genericName: "Cetirizine HCl",
        strength: "10 mg",
        drugForm: "tablet",
        dose: "10 mg",
        frequency: "1× sehari",
        duration: "14 hari",
        route: "oral",
        instructions: "Diminum malam hari (mengurangi efek samping mengantuk)",
        quantity: 14,
        unit: "tablet",
      },
      reference: { label: "ARIA 2020 — antihistamin H1 generasi 2 first-line oral" },
    },
    {
      id: "loratadine",
      label: "Loratadine 10mg PO 1×/hari (alternatif non-sedatif)",
      category: "medikamentosa",
      prescription: {
        drugName: "Loratadine",
        genericName: "Loratadine",
        strength: "10 mg",
        drugForm: "tablet",
        dose: "10 mg",
        frequency: "1× sehari",
        duration: "14 hari",
        route: "oral",
        instructions: "Pagi hari setelah makan",
        quantity: 14,
        unit: "tablet",
      },
      reference: { label: "ARIA 2020" },
    },
    {
      id: "mometasone-spray",
      label: "Mometasone furoate 50µg nasal spray, 2 puff/lubang/hari",
      category: "medikamentosa",
      prescription: {
        drugName: "Mometasone furoate",
        genericName: "Mometasone furoate monohydrate",
        strength: "50 mcg/puff",
        drugForm: "nasal spray",
        dose: "2 puff/lubang hidung",
        frequency: "1× sehari",
        duration: "30 hari (efek penuh 2-4 minggu)",
        route: "intranasal",
        instructions:
          "Bersihkan hidung dulu. Posisi kepala sedikit menunduk. Arahkan ke dinding lateral (jangan ke septum).",
        quantity: 1,
        unit: "botol",
      },
      reference: {
        label: "ARIA 2020 — INCS first-line untuk persistent moderate-severe",
      },
    },
    {
      id: "fluticasone-spray",
      label: "Fluticasone propionate 50µg nasal spray (alternatif)",
      category: "medikamentosa",
      prescription: {
        drugName: "Fluticasone propionate",
        genericName: "Fluticasone propionate",
        strength: "50 mcg/puff",
        drugForm: "nasal spray",
        dose: "2 puff/lubang hidung",
        frequency: "1× sehari",
        duration: "30 hari",
        route: "intranasal",
        instructions: "Sama dengan teknik mometasone",
        quantity: 1,
        unit: "botol",
      },
      reference: { label: "ARIA 2020" },
    },
    {
      id: "montelukast",
      label: "Montelukast 10mg malam (LTRA — comorbid asma)",
      category: "medikamentosa",
      prescription: {
        drugName: "Montelukast",
        genericName: "Montelukast sodium",
        strength: "10 mg",
        drugForm: "tablet",
        dose: "10 mg",
        frequency: "1× sehari",
        duration: "30 hari",
        route: "oral",
        instructions: "Diminum malam hari. Pantau efek samping mood (FDA boxed warning).",
        quantity: 30,
        unit: "tablet",
      },
      reference: { label: "GINA 2024 / ARIA — comorbid asthma" },
    },
    {
      id: "saline-spray",
      label: "Saline nasal spray / lavage isotonis 0.9%",
      category: "edukasi",
      prescription: {
        drugName: "Saline 0.9%",
        drugForm: "nasal spray / botol cuci hidung",
        dose: "2-3 puff/lubang atau 100 ml/lubang",
        frequency: "2-3× sehari",
        duration: "Selama gejala",
        route: "intranasal",
        instructions: "Aman jangka panjang. Gunakan sebelum nasal steroid.",
      },
      reference: { label: "PERHATI-KL — adjunct therapy semua tier ARIA" },
    },
    {
      id: "edukasi-avoidance",
      label: "Edukasi avoidance allergen + lingkungan",
      category: "edukasi",
      reference: { label: "ARIA 2020 — non-pharmacological foundation" },
    },
    {
      id: "skin-prick-rujukan",
      label: "Rujuk Skin Prick Test (alergi spesifik)",
      category: "rujukan",
      icd9Code: "V72.7",
      icd9NameId: "Pemeriksaan diagnostik alergi",
    },
    {
      id: "ige-spesifik-rujukan",
      label: "Rujuk pemeriksaan IgE spesifik (lab)",
      category: "rujukan",
      reference: { label: "EAACI 2018 — allergy diagnosis" },
    },
    {
      id: "imunoterapi-rujukan",
      label: "Rujuk imunoterapi alergen (SCIT / SLIT)",
      category: "rujukan",
      reference: {
        label: "EAACI 2018 — Allergen Immunotherapy guideline (refractory case)",
      },
    },
    {
      id: "konkotomi",
      label: "Konkotomi inferior (turbinate reduction)",
      category: "tindakan",
      icd9Code: "21.69",
      icd9NameId: "Reseksi/reduksi konka",
      feeIdr: 5_500_000,
      isOperative: true,
      reference: {
        label: "PERHATI-KL — konkotomi untuk hipertrofi persisten gagal medikamentosa",
      },
    },
  ],

  // -------------------------------------------------------------------------
  // Education
  // -------------------------------------------------------------------------
  education: {
    title: "Edukasi Pasien — Rinitis Alergi",
    bullets: [
      "Hindari pemicu: ganti sprei tiap minggu, kurangi karpet, pakai sarung kasur anti-tungau.",
      "Mandi/cuci muka setelah aktivitas luar (mengurangi paparan serbuk).",
      "Nasal steroid butuh 2-4 minggu untuk efek penuh — jangan berhenti karena tidak langsung membaik.",
      "Teknik nasal spray: kepala menunduk sedikit, semprot ke arah dinding luar (jangan ke septum) — mencegah perdarahan.",
      "Antihistamin generasi 1 (CTM) menyebabkan kantuk → hindari saat berkendara.",
      "Bila ada mengi/sesak napas → ini bisa jadi tanda asma; segera kontrol ulang.",
      "Bila gejala tidak membaik dalam 4 minggu terapi maksimal → kembali untuk evaluasi tes alergi spesifik.",
    ],
    channels: ["print", "wa"],
  },

  // -------------------------------------------------------------------------
  // SOAP composer
  // -------------------------------------------------------------------------
  soapMapping: {
    subjective: (ctx) => {
      const positives: string[] = [];
      const a = ctx.anamnesis;
      if (a["bersin-paroksimal"]) positives.push("bersin paroksimal");
      if (a["hidung-gatal"]) positives.push("hidung gatal");
      if (a["rhinorrhea"]) positives.push("rhinorrhea jernih");
      if (a["obstruksi"]) positives.push("obstruksi nasal");
      if (a["mata-gatal"]) positives.push("mata gatal/berair");
      if (a["pemicu-lingkungan"]) positives.push("ada pemicu lingkungan");
      if (a["musiman"]) positives.push("pola musiman");
      if (a["tidur-terganggu"]) positives.push("tidur terganggu");
      if (a["aktivitas-terganggu"]) positives.push("aktivitas terganggu");
      if (a["alergi-personal"]) positives.push("riwayat atopi pribadi");
      if (a["alergi-keluarga"]) positives.push("riwayat atopi keluarga");
      if (a["wheezing"] || a["dyspnea"]) positives.push("gejala respiratori (wheezing/dyspnea)");
      const cc = ctx.chiefComplaint?.trim() || "Bersin & pilek berulang";
      const body = positives.length
        ? `Pasien mengeluh ${positives.join(", ")}.`
        : "Tanpa keluhan signifikan saat ini.";
      return `${cc}. ${body}`;
    },
    objective: (ctx) => {
      const findings: string[] = [];
      const e = ctx.examination;
      if (e["mukosa-pucat"]) findings.push("mukosa pucat-kebiruan");
      if (e["sekret-jernih"]) findings.push("sekret jernih encer");
      if (e["konka-hipertrofi"]) findings.push("konka inferior hipertrofi pucat");
      if (e["allergic-salute"]) findings.push("allergic salute (+)");
      if (e["allergic-shiners"]) findings.push("allergic shiners (+)");
      if (e["konjungtivitis"]) findings.push("konjungtiva injeksi");
      if (e["tonsil-hipertrofi"]) findings.push("tonsil hipertrofi");
      if (e["wheezing-exam"]) findings.push("WHEEZING (+) — curiga asma comorbid");
      if (e["polip-nasal"]) findings.push("polip nasal (+) — pertimbangkan ddx CRSwNP");

      const sfar = ctx.scoring["sfar"]?.result;
      const aria = ctx.scoring["aria"]?.result;
      const tnss = ctx.scoring["tnss"]?.result;
      const scores: string[] = [];
      if (sfar) scores.push(sfar.interpretation);
      if (aria) scores.push(aria.interpretation);
      if (tnss) scores.push(tnss.interpretation);

      const findingLine = findings.length
        ? `Rinoskopi: ${findings.join(", ")}.`
        : "Rinoskopi anterior dalam batas normal.";
      const scoreLine = scores.length ? ` ${scores.join(" · ")}.` : "";
      return `${findingLine}${scoreLine}`;
    },
    assessment: (ctx) => {
      const primary = ctx.diagnoses.find((d) => d.primary);
      const aria = ctx.scoring["aria"]?.result;
      const wheezing =
        ctx.anamnesis["wheezing"] || ctx.examination["wheezing-exam"];
      const lines: string[] = [];
      if (primary) {
        lines.push(`${primary.icd10Code} — Rinitis alergi`);
      }
      if (aria) {
        lines.push(aria.interpretation.replace("ARIA: ", "ARIA "));
      }
      if (wheezing) {
        lines.push("ALERT: skrining asma POSITIF — perlu evaluasi paralel");
      }
      return lines.length ? lines.join(". ") + "." : "Rinitis alergi (ARIA pending).";
    },
    plan: (ctx) => {
      const tx: string[] = [];
      const t = ctx.treatments;
      if (t["cetirizine"]) tx.push("Cetirizine 10mg malam × 14 hari");
      if (t["loratadine"]) tx.push("Loratadine 10mg pagi × 14 hari");
      if (t["mometasone-spray"]) tx.push("Mometasone nasal spray 2 puff/lubang/hari × 30 hari");
      if (t["fluticasone-spray"]) tx.push("Fluticasone nasal spray 2 puff/lubang/hari × 30 hari");
      if (t["montelukast"]) tx.push("Montelukast 10mg malam × 30 hari");
      if (t["saline-spray"]) tx.push("Saline nasal lavage 2-3×/hari");
      if (t["edukasi-avoidance"]) tx.push("Edukasi avoidance allergen");
      if (t["skin-prick-rujukan"]) tx.push("Rujuk Skin Prick Test");
      if (t["ige-spesifik-rujukan"]) tx.push("Rujuk pemeriksaan IgE spesifik");
      if (t["imunoterapi-rujukan"]) tx.push("Rujuk imunoterapi (SCIT/SLIT)");
      if (t["konkotomi"]) tx.push("Rencana konkotomi inferior");
      const followUp = "Kontrol ulang 2-4 minggu — evaluasi TNSS.";
      return tx.length
        ? `${tx.join(". ")}. ${followUp}`
        : `Edukasi + observasi. ${followUp}`;
    },
  },

  references: [
    {
      label: "ARIA 2020 update — Bousquet J, et al. J Allergy Clin Immunol 2020",
      url: "https://www.jacionline.org/article/S0091-6749(20)30717-7/fulltext",
    },
    {
      label: "EAACI 2018 — Allergen Immunotherapy guidelines",
    },
    {
      label: "Annesi-Maesano I, et al. SFAR validation. Allergy 2002",
    },
    {
      label: "PERHATI-KL — Konsensus Rinitis Alergi 2016",
    },
    {
      label: "Ellis AK, et al. TNSS validation. Ann Allergy Asthma Immunol 2013",
    },
  ],

  // -------------------------------------------------------------------------
  // PATIENT-FACING SCREENING (RME → Patient Entry System)
  // -------------------------------------------------------------------------
  // Pasien isi mandiri di HP/web sebelum ke klinik. Hasil → diarahkan ke
  // klinik THT terdekat dengan SFAR pre-screened context.
  patientFacingScreening: {
    id: "sfar-pasien",
    name: "SFAR — Skrining Mandiri Rinitis Alergi",
    description:
      "Lima pertanyaan singkat untuk mengetahui apakah Anda kemungkinan menderita rinitis alergi. " +
      "Hasil skrining ini bukan diagnosis pasti — silakan konsultasikan ke dokter THT untuk konfirmasi.",
    reference: { label: "Annesi-Maesano et al. Allergy 2002" },
    inputs: [
      {
        type: "yesNo",
        id: "gejala",
        label:
          "Apakah Anda pernah mengalami gejala hidung yang muncul tiba-tiba (bersin berulang, hidung gatal, atau pilek bening) tanpa demam?",
        weightYes: 2,
      },
      {
        type: "yesNo",
        id: "pemicu",
        label:
          "Apakah gejala tersebut sering muncul setelah terpapar debu, hewan peliharaan, serbuk bunga, atau perubahan suhu/AC?",
        weightYes: 2,
      },
      {
        type: "yesNo",
        id: "mata",
        label:
          "Saat gejala hidung muncul, apakah mata Anda juga sering terasa gatal atau berair?",
        weightYes: 1,
      },
      {
        type: "yesNo",
        id: "alergiPersonal",
        label:
          "Apakah Anda pernah didiagnosis dokter dengan alergi (alergi makanan, asma, atau eksim)?",
        weightYes: 2,
      },
      {
        type: "yesNo",
        id: "alergiKeluarga",
        label:
          "Apakah ada anggota keluarga inti (orang tua atau saudara kandung) yang menderita asma, alergi, atau eksim?",
        weightYes: 2,
      },
    ],
    tiers: [
      {
        threshold: 7,
        label: "Sangat mungkin rinitis alergi",
        recommendation:
          "Hasil skrining Anda sangat sesuai dengan rinitis alergi. Sebaiknya konsultasi dengan dokter THT untuk konfirmasi diagnosis dan rencana terapi yang tepat. Klik tombol di bawah untuk membuat janji.",
      },
      {
        threshold: 4,
        label: "Mungkin rinitis alergi",
        recommendation:
          "Ada kemungkinan Anda menderita rinitis alergi. Coba terapi awal dengan menghindari pemicu + antihistamin OTC selama 1-2 minggu. Jika belum membaik, segera konsultasi ke dokter THT.",
      },
      {
        threshold: 0,
        label: "Kecil kemungkinan rinitis alergi",
        recommendation:
          "Berdasarkan jawaban Anda, rinitis alergi bukan kemungkinan utama. Gejala Anda mungkin disebabkan kondisi lain (infeksi, sinusitis, atau kelainan struktural). Konsultasi ke dokter umum atau THT untuk evaluasi lebih lanjut.",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // MONETIZATION (5-layer revenue model — flagship pattern)
  // -------------------------------------------------------------------------
  monetization: [
    {
      id: "platform-fee-rinitis",
      type: "platform-fee",
      label: "Platform fee per kunjungan",
      priceIdr: 5_000,
      description:
        "Dibebankan ke pasien (tier Gratis Selamanya). Jasa medis dokter utuh.",
    },
    {
      id: "otc-cetirizine",
      type: "otc-referral",
      label: "Apotek partner — antihistamin oral (cetirizine/loratadine)",
      partner: "Apotek partner",
      description:
        "Komisi referral ketika pasien menebus resep antihistamin OTC via apotek partner.",
    },
    {
      id: "otc-mometasone",
      type: "otc-referral",
      label: "Apotek partner — nasal steroid (mometasone/fluticasone)",
      partner: "Apotek partner",
      description: "Komisi referral nasal steroid OTC.",
    },
    {
      id: "lab-ige",
      type: "lab-referral",
      label: "Lab partner — IgE spesifik / Skin Prick Test",
      partner: "Lab partner",
      description:
        "Komisi referral pemeriksaan alergi spesifik (IgE / SPT) ke lab partner.",
    },
    {
      id: "telekonsul-rinitis",
      type: "telekonsul",
      label: "Telekonsultasi follow-up",
      priceIdr: 75_000,
      description:
        "Follow-up evaluasi terapi via telekonsul (2-4 minggu post-treatment).",
    },
    {
      id: "edukasi-pdf-rinitis",
      type: "edukasi-pdf",
      label: "Booklet 'Hidup Nyaman dengan Rinitis Alergi'",
      priceIdr: 5_000,
      description:
        "PDF edukasi 12 halaman: avoidance, teknik nasal spray, FAQ. Dijual ke pasien.",
    },
  ],
};

export default spec;
