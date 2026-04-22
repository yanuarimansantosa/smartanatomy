/**
 * Module 4 — Otitis Media Supuratif Kronik (OMSK) Tipe Bahaya / Atikoantral (H66.2)
 * Reference: PPK PERHATI-KL · AAO-HNS · Glasscock-Shambaugh
 *
 * Karakter: kolesteatoma · perforasi atik/marginal · risiko komplikasi tinggi.
 * Tujuan modul: deteksi komplikasi (intra-temporal & intra-kranial) → mastoidektomi
 * + rujukan urgent bila komplikasi aktif (meningitis, abses otak, paresis fasial).
 *
 * KOMPLIKASI PANEL (cek di setiap kunjungan):
 *   1. Paresis nervus fasialis (CN VII)
 *   2. Vertigo / labirinitis / fistula labirin
 *   3. Mastoiditis akut
 *   4. Abses subperiosteal (Bezold / Citelli)
 *   5. Meningitis / abses otak / trombosis sinus lateral
 *   6. Petrositis (Gradenigo: otore + nyeri retro-orbital + paresis CN VI)
 *
 * → Bila ≥1 komplikasi aktif: EMERGENCY MODE banner merah, rujuk RS bedah saraf/THT.
 */

import type { ModuleSpec, ScoringResult } from "../types";

// ==========================================================================
// Scoring computers
// ==========================================================================

const cholesteatomaCompute = (v: Record<string, number>): ScoringResult => {
  const stage = v.stage ?? 0;
  // 0=tidak ada, 1=tertutup (closed/early), 2=terbuka (open/established), 3=meluas (extensive)
  const labels = [
    "Tidak ada kolesteatoma terdeteksi",
    "Kolesteatoma tertutup / kantong retraksi awal",
    "Kolesteatoma terbuka (debris keratin di kavum atik/antrum)",
    "Kolesteatoma meluas (erosi tulang, komplikasi)",
  ];
  const sev: ScoringResult["severity"] =
    stage >= 3 ? "very-high" : stage >= 2 ? "high" : stage >= 1 ? "moderate" : "low";
  return {
    total: stage,
    severity: sev,
    interpretation: labels[stage] ?? labels[0],
    recommendation:
      stage >= 1
        ? "Indikasi MASTOIDEKTOMI (canal wall up/down) + timpanoplasti. CT scan mastoid wajib pra-bedah."
        : "Surveilans atik / pars flaksida.",
  };
};

const complicationCompute = (v: Record<string, number>): ScoringResult => {
  // Sum 6 komplikasi
  const total = Object.values(v).reduce((a, b) => a + b, 0);
  if (total === 0)
    return {
      total: 0,
      severity: "low",
      interpretation: "Tidak ada komplikasi terdeteksi",
    };
  const sev: ScoringResult["severity"] = total >= 2 ? "very-high" : "high";
  return {
    total,
    severity: sev,
    interpretation:
      total === 1
        ? "1 komplikasi aktif — RUJUK URGENT"
        : `${total} komplikasi aktif — EMERGENCY, rujuk RS dengan bedah saraf/THT subspesialis`,
    recommendation:
      "Stabilisasi, antibiotik IV broad spectrum, CT scan kepala/temporal urgent, rujuk operatif segera.",
  };
};

const ctFindingCompute = (v: Record<string, number>): ScoringResult => {
  const score = v.score ?? 0;
  // 0=tidak dilakukan, 1=opasifikasi minimal, 2=erosi tulang ringan, 3=erosi mastoid luas, 4=erosi tegmen/sinus
  const labels = [
    "CT belum dilakukan",
    "Opasifikasi mastoid tanpa erosi",
    "Erosi tulang ringan (skutum/atik)",
    "Erosi mastoid luas",
    "Erosi tegmen tympani / dinding sinus sigmoid (RISK INTRACRANIAL)",
  ];
  const sev: ScoringResult["severity"] =
    score >= 4 ? "very-high" : score >= 3 ? "high" : score >= 2 ? "moderate" : "low";
  return {
    total: score,
    severity: sev,
    interpretation: labels[score] ?? labels[0],
    recommendation:
      score >= 4
        ? "Risiko komplikasi intrakranial. Bedah saraf konsul, antibiotik IV, mastoidektomi urgent."
        : score >= 2
          ? "Mastoidektomi terindikasi."
          : undefined,
  };
};

// ==========================================================================
// ModuleSpec
// ==========================================================================

const spec: ModuleSpec = {
  id: "omsk-bahaya",
  title: "OMSK Tipe Bahaya (Atikoantral / Kolesteatoma)",
  subspecialty: "Telinga",
  iconName: "alert-triangle",
  tags: ["H66.2", "kolesteatoma", "komplikasi", "PERHATI-KL"],
  emergencyTriggers: [
    {
      level: "red",
      title: "EMERGENCY — Komplikasi OMSK aktif",
      message:
        "Tanda komplikasi terdeteksi (paresis fasial / meningitis / abses / mastoiditis). Stabilisasi, antibiotik IV, rujuk RS dengan bedah saraf/THT segera.",
      trigger: (ctx) => {
        const c = ctx.scoring["complications"]?.values ?? {};
        const total = Object.values(c).reduce(
          (a, b) => Number(a) + Number(b),
          0,
        );
        return total >= 1;
      },
    },
  ],
  diagnoses: [
    {
      icd10Code: "H66.2",
      display:
        "Otitis media supuratif kronik atikoantral (tipe bahaya, dengan/tanpa kolesteatoma)",
      defaultPrimary: true,
      isChronic: true,
      reasoning:
        "Perforasi atik/marginal, debris keratin, atau bukti kolesteatoma — risiko komplikasi tinggi.",
    },
    {
      icd10Code: "H71",
      display: "Kolesteatoma telinga tengah",
      isChronic: true,
    },
    {
      icd10Code: "H70.0",
      display: "Mastoiditis akut",
    },
    {
      icd10Code: "H70.1",
      display: "Mastoiditis kronik",
    },
    {
      icd10Code: "G06.0",
      display: "Abses intrakranial / otak",
    },
    {
      icd10Code: "G03.9",
      display: "Meningitis tidak ditentukan",
    },
    {
      icd10Code: "G51.0",
      display: "Bell's palsy / paresis fasialis",
    },
  ],
  cdssRules: [
    {
      id: "facial-palsy-emergency",
      evaluate: (ctx) => {
        if (ctx.scoring["complications"]?.values.facialPalsy >= 1) {
          return {
            ruleId: "facial-palsy-emergency",
            level: "emergency",
            message:
              "PARESIS NERVUS FASIALIS pada OMSK = KOMPLIKASI INTRA-TEMPORAL. Mastoidektomi dekompresi N. VII URGENT (≤72 jam idealnya).",
            reference: { label: "Glasscock-Shambaugh · AAO-HNS Facial Nerve" },
            suggestPrimaryIcd10: "H66.2",
            suggestTreatmentIds: [
              "antibiotik-iv",
              "ct-mastoid",
              "rujuk-bedah-urgent",
              "mastoidektomi",
            ],
          };
        }
        return null;
      },
    },
    {
      id: "intracranial-emergency",
      evaluate: (ctx) => {
        const c = ctx.scoring["complications"]?.values ?? {};
        if (c.meningitis >= 1 || c.brainAbscess >= 1 || c.sinusThrombosis >= 1) {
          return {
            ruleId: "intracranial-emergency",
            level: "emergency",
            message:
              "KOMPLIKASI INTRAKRANIAL (meningitis / abses otak / trombosis sinus lateral). Stabilisasi, antibiotik IV broad spectrum (sefalosporin gen 3 + metronidazol), CT/MRI kepala, konsul bedah saraf + bedah THT, rujuk RS tersier segera.",
            reference: { label: "PPK PERHATI-KL · IDSA" },
            suggestTreatmentIds: [
              "antibiotik-iv",
              "ct-mastoid",
              "mri-kepala",
              "rujuk-bedah-urgent",
            ],
          };
        }
        return null;
      },
    },
    {
      id: "mastoiditis-flag",
      evaluate: (ctx) => {
        const c = ctx.scoring["complications"]?.values ?? {};
        if (c.mastoiditis >= 1 || c.subperiostealAbscess >= 1) {
          return {
            ruleId: "mastoiditis-flag",
            level: "danger",
            message:
              "MASTOIDITIS / abses subperiosteal — antibiotik IV, mastoidektomi simple urgent (CWU/CWD setelah CT).",
            reference: { label: "PPK PERHATI-KL" },
            suggestTreatmentIds: ["antibiotik-iv", "ct-mastoid", "mastoidektomi"],
          };
        }
        return null;
      },
    },
    {
      id: "labyrinthitis-flag",
      evaluate: (ctx) => {
        const c = ctx.scoring["complications"]?.values ?? {};
        if (c.labyrinthitis >= 1) {
          return {
            ruleId: "labyrinthitis-flag",
            level: "danger",
            message:
              "LABIRINITIS (vertigo + tuli sensorineural). Antibiotik IV, steroid, hindari manipulasi telinga, CT temporal urgent. Risiko meatus → meningitis.",
            reference: { label: "AAO-HNS · Glasscock-Shambaugh" },
            suggestTreatmentIds: ["antibiotik-iv", "steroid-sistemik", "ct-mastoid"],
          };
        }
        return null;
      },
    },
    {
      id: "petrositis-gradenigo",
      evaluate: (ctx) => {
        const c = ctx.scoring["complications"]?.values ?? {};
        if (c.petrositis >= 1) {
          return {
            ruleId: "petrositis-gradenigo",
            level: "danger",
            message:
              "PETROSITIS — Gradenigo syndrome (otore + nyeri retro-orbital + paresis CN VI). Antibiotik IV jangka panjang, MRI/CT, mastoidektomi + drainase petrosa.",
            reference: { label: "Gradenigo 1907 · Glasscock-Shambaugh" },
            suggestTreatmentIds: ["antibiotik-iv", "ct-mastoid", "mri-kepala"],
          };
        }
        return null;
      },
    },
    {
      id: "cholesteatoma-surgical",
      evaluate: (ctx) => {
        const stage = ctx.scoring["cholesteatoma"]?.values.stage ?? 0;
        if (stage >= 1) {
          return {
            ruleId: "cholesteatoma-surgical",
            level: "warn",
            message:
              "KOLESTEATOMA = indikasi MUTLAK mastoidektomi (CWU bila terbatas, CWD bila luas) + timpanoplasti. CT mastoid pra-bedah wajib.",
            reference: { label: "AAO-HNS Cholesteatoma Position Statement" },
            suggestTreatmentIds: ["ct-mastoid", "audiometri", "mastoidektomi"],
          };
        }
        return null;
      },
    },
  ],
  anamnesis: {
    title: "Anamnesis (tap bila ABNORMAL) — fokus tanda komplikasi",
    helper:
      "OMSK bahaya = waspada otore berbau busuk, vertigo, paresis wajah, sakit kepala, demam.",
    items: [
      {
        id: "otore-berbau",
        normalLabel: "Tidak ada otore berbau",
        abnormalLabel: "Otore berbau busuk (cardinal kolesteatoma)",
        tag: "foul-otorrhea",
      },
      {
        id: "penurunan-pendengaran-progresif",
        normalLabel: "Pendengaran stabil",
        abnormalLabel: "Penurunan pendengaran PROGRESIF / mendadak",
      },
      {
        id: "vertigo-pusing",
        normalLabel: "Tidak ada vertigo",
        abnormalLabel: "Vertigo / pusing berputar (curigai labirinitis/fistula)",
      },
      {
        id: "nyeri-telinga-hebat",
        normalLabel: "Tidak ada nyeri telinga hebat",
        abnormalLabel: "Nyeri telinga / mastoid hebat (curigai mastoiditis)",
      },
      {
        id: "demam-tinggi",
        normalLabel: "Tidak demam",
        abnormalLabel: "Demam tinggi (curigai komplikasi sistemik)",
      },
      {
        id: "sakit-kepala-hebat",
        normalLabel: "Tidak ada sakit kepala hebat",
        abnormalLabel:
          "Sakit kepala hebat / fotofobia / kaku kuduk (curigai meningitis)",
      },
      {
        id: "wajah-perot",
        normalLabel: "Wajah simetris",
        abnormalLabel: "Wajah PEROT pada sisi telinga sakit (paresis N. VII)",
      },
      {
        id: "diplopia",
        normalLabel: "Tidak ada diplopia",
        abnormalLabel: "Diplopia / pandangan ganda (curigai petrositis CN VI)",
      },
      {
        id: "kejang-penurunan-kesadaran",
        normalLabel: "Sadar penuh, tidak kejang",
        abnormalLabel:
          "Kejang / penurunan kesadaran (curigai abses otak / trombosis sinus)",
      },
      {
        id: "muntah-proyektil",
        normalLabel: "Tidak ada muntah",
        abnormalLabel: "Muntah proyektil (TIK meningkat — curigai abses)",
      },
    ],
  },
  examination: {
    title: "Pemeriksaan otoskopi & klinis (tap bila ABNORMAL)",
    helper:
      "Fokus: pars flaksida (atik), debris kolesteatoma, tanda komplikasi (mastoid, fasial, neurologi).",
    items: [
      {
        id: "perforasi-atik-marginal",
        normalLabel: "Pars flaksida & marginal utuh",
        abnormalLabel: "Perforasi ATIK / MARGINAL (red flag bahaya)",
        tag: "perforation-attic",
      },
      {
        id: "debris-keratin",
        normalLabel: "Tidak ada debris keratin",
        abnormalLabel: "Debris putih keratin (kolesteatoma) di atik/antrum",
        tag: "cholesteatoma-debris",
      },
      {
        id: "granulasi-polip",
        normalLabel: "Tidak ada granulasi/polip",
        abnormalLabel: "Granulasi / polip kavum (sering menutup kolesteatoma)",
      },
      {
        id: "secret-purulen-busuk",
        normalLabel: "Tidak ada sekret",
        abnormalLabel: "Sekret purulen berbau busuk",
      },
      {
        id: "nyeri-tekan-mastoid",
        normalLabel: "Mastoid tidak nyeri tekan",
        abnormalLabel: "Nyeri tekan mastoid (curigai mastoiditis)",
        tag: "mastoid-tender",
      },
      {
        id: "edema-retroaurikuler",
        normalLabel: "Retroaurikuler tenang",
        abnormalLabel: "Edema retroaurikuler / aurikel terdorong (abses subperiosteal)",
        tag: "subperiosteal",
      },
      {
        id: "fistula-positif",
        normalLabel: "Tes fistula negatif",
        abnormalLabel: "Tes fistula POSITIF (vertigo+nystagmus dengan tekanan)",
        tag: "fistula",
      },
      {
        id: "paresis-n7-house",
        normalLabel: "Wajah simetris (House-Brackmann I)",
        abnormalLabel: "Paresis N. VII (House-Brackmann ≥II)",
        tag: "facial-palsy",
      },
      {
        id: "kaku-kuduk",
        normalLabel: "Tidak ada kaku kuduk",
        abnormalLabel: "Kaku kuduk / Kernig+ / Brudzinski+ (meningitis)",
        tag: "meningismus",
      },
      {
        id: "rinne-negatif",
        normalLabel: "Rinne positif",
        abnormalLabel: "Rinne negatif (gap konduktif)",
      },
    ],
  },
  scoring: [
    {
      id: "cholesteatoma",
      name: "Stadium kolesteatoma",
      description:
        "Klasifikasi klinis kolesteatoma (kantong retraksi → terbuka → meluas).",
      reference: { label: "EAONO/JOS Cholesteatoma Classification 2017" },
      inputs: [
        {
          type: "select",
          id: "stage",
          label: "Stadium",
          default: 0,
          options: [
            { value: 0, label: "Tidak ada kolesteatoma" },
            { value: 1, label: "Kantong retraksi awal (closed / early)" },
            { value: 2, label: "Kolesteatoma terbuka (debris keratin terlihat)" },
            { value: 3, label: "Kolesteatoma meluas / dengan komplikasi" },
          ],
        },
      ],
      compute: cholesteatomaCompute,
    },
    {
      id: "complications",
      name: "Panel komplikasi OMSK (CRITICAL)",
      description:
        "Cek 6 komplikasi utama OMSK. Bila ≥1 positif → EMERGENCY MODE.",
      reference: { label: "Glasscock-Shambaugh · PPK PERHATI-KL" },
      inputs: [
        { type: "yesNo", id: "facialPalsy", label: "Paresis N. VII (wajah perot sisi sakit)" },
        { type: "yesNo", id: "labyrinthitis", label: "Labirinitis (vertigo berat + tuli SNHL)" },
        { type: "yesNo", id: "mastoiditis", label: "Mastoiditis (nyeri tekan mastoid + demam)" },
        {
          type: "yesNo",
          id: "subperiostealAbscess",
          label: "Abses subperiosteal (Bezold/Citelli — edema retroaurikuler)",
        },
        { type: "yesNo", id: "meningitis", label: "Meningitis (kaku kuduk, fotofobia, demam)" },
        {
          type: "yesNo",
          id: "brainAbscess",
          label: "Abses otak (sakit kepala hebat, kejang, defisit fokal)",
        },
        {
          type: "yesNo",
          id: "sinusThrombosis",
          label: "Trombosis sinus lateral (demam picket fence, edema mastoid)",
        },
        {
          type: "yesNo",
          id: "petrositis",
          label: "Petrositis / Gradenigo (otore + nyeri retro-orbital + diplopia CN VI)",
        },
      ],
      compute: complicationCompute,
    },
    {
      id: "ct-finding",
      name: "Temuan CT mastoid",
      description: "Hasil CT scan mastoid (bila sudah dilakukan).",
      reference: { label: "PERHATI-KL imaging guideline" },
      inputs: [
        {
          type: "select",
          id: "score",
          label: "Temuan utama",
          default: 0,
          options: [
            { value: 0, label: "CT belum dilakukan" },
            { value: 1, label: "Opasifikasi mastoid, tanpa erosi" },
            { value: 2, label: "Erosi tulang ringan (skutum / atik)" },
            { value: 3, label: "Erosi mastoid luas" },
            {
              value: 4,
              label: "Erosi tegmen tympani / sinus sigmoid (risk intrakranial)",
            },
          ],
        },
      ],
      compute: ctFindingCompute,
    },
  ],
  pathway: [
    {
      id: "step-1",
      title: "Triase: cek panel komplikasi",
      detail:
        "Bila ≥1 komplikasi aktif (paresis fasial, meningitis, mastoiditis, abses) → EMERGENCY MODE.",
    },
    {
      id: "step-2",
      title: "Stabilisasi (bila emergency)",
      detail:
        "Antibiotik IV broad spectrum (seftriakson 2g IV + metronidazol 500mg IV q8h), analgesik, IVFD, kontrol vital sign.",
    },
    {
      id: "step-3",
      title: "Imaging urgent",
      detail:
        "CT scan temporal/mastoid kontras + CT/MRI kepala bila ada tanda intrakranial.",
    },
    {
      id: "step-4",
      title: "Audiometri pra-bedah (bila stabil)",
      detail: "PTA + tympanometri untuk dokumentasi.",
    },
    {
      id: "step-5",
      title: "Mastoidektomi + timpanoplasti",
      detail:
        "Canal Wall Up (CWU) bila kolesteatoma terbatas, CWD (canal wall down / radikal) bila luas atau komplikasi.",
    },
    {
      id: "step-6",
      title: "Konsultasi multidisiplin (bila intrakranial)",
      detail:
        "Bedah saraf, THT subspesialis otologi, neurologi, ICU bila perlu.",
    },
    {
      id: "step-7",
      title: "Follow-up jangka panjang",
      detail:
        "Surveilans rekurensi kolesteatoma (residu/rekuren) — second-look surgery 6–12 bulan bila CWU.",
    },
  ],
  treatments: [
    {
      id: "antibiotik-iv",
      label: "Antibiotik IV (Seftriakson + Metronidazol)",
      category: "medikamentosa",
      prescription: {
        drugName: "Seftriakson + Metronidazol IV",
        genericName: "Ceftriaxone 2g IV q24h + Metronidazole 500mg IV q8h",
        drugForm: "Vial injeksi",
        dose: "Sesuai BB & fungsi ginjal",
        frequency: "q24h / q8h",
        duration: "Minimal 14 hari (intrakranial: 4–6 minggu)",
        route: "IV",
        instructions: "Mulai segera setelah kultur diambil (jangan tunda untuk hasil kultur).",
      },
      reference: { label: "IDSA · PPK PERHATI-KL" },
    },
    {
      id: "steroid-sistemik",
      label: "Kortikosteroid sistemik (untuk paresis N. VII / labirinitis)",
      category: "medikamentosa",
      prescription: {
        drugName: "Metilprednisolon",
        genericName: "Methylprednisolone",
        drugForm: "Tablet / vial",
        strength: "1 mg/kgBB/hari",
        dose: "1 mg/kgBB",
        frequency: "1× sehari",
        duration: "Tapering 10–14 hari",
        route: "IV bolus → per oral",
        instructions: "Sesudah makan. Pantau gula darah, tekanan darah.",
      },
    },
    {
      id: "ct-mastoid",
      label: "CT scan mastoid kontras (87.69)",
      category: "tindakan",
      icd9Code: "87.69",
      icd9NameId: "CT scan mastoid / temporal kontras",
      feeIdr: 1_500_000,
      reference: { label: "PERHATI-KL imaging" },
    },
    {
      id: "mri-kepala",
      label: "MRI kepala kontras (88.91)",
      category: "tindakan",
      icd9Code: "88.91",
      icd9NameId: "MRI kepala kontras",
      feeIdr: 3_000_000,
      reference: { label: "Bila curigai abses otak / trombosis sinus" },
    },
    {
      id: "audiometri",
      label: "Audiometri nada murni (95.41)",
      category: "tindakan",
      icd9Code: "95.41",
      icd9NameId: "Audiometri nada murni",
      feeIdr: 250_000,
    },
    {
      id: "mastoidektomi",
      label: "Mastoidektomi + Timpanoplasti (20.49)",
      category: "tindakan",
      icd9Code: "20.49",
      icd9NameId: "Mastoidektomi (CWU/CWD) + timpanoplasti",
      feeIdr: 18_000_000,
      isOperative: true,
      reference: { label: "AAO-HNS · Cholesteatoma Position Statement" },
    },
    {
      id: "aural-toilet",
      label: "Aural toilet pra-bedah (96.52)",
      category: "tindakan",
      icd9Code: "96.52",
      icd9NameId: "Pencucian / pembersihan liang telinga",
      feeIdr: 75_000,
    },
    {
      id: "rujuk-bedah-urgent",
      label: "Rujuk URGENT bedah otologi / bedah saraf (RS tersier)",
      category: "rujukan",
    },
    {
      id: "edukasi-komplikasi",
      label: "Edukasi: tanda bahaya komplikasi (segera ke IGD)",
      category: "edukasi",
      defaultSelected: true,
    },
  ],
  education: {
    title: "Edukasi pasien — OMSK Tipe Bahaya",
    bullets: [
      "OMSK tipe bahaya = ada kolesteatoma — sel kulit tumbuh di telinga tengah, mengikis tulang.",
      "INI BUKAN INFEKSI BIASA. Bila tidak dioperasi, dapat menyebabkan tuli total, wajah perot permanen, vertigo menetap, atau infeksi otak.",
      "PENGOBATAN UTAMA = OPERASI (mastoidektomi). Antibiotik hanya menahan sementara.",
      "SEGERA KE IGD bila: wajah mendadak perot, kejang, sakit kepala hebat + demam, leher kaku, kesadaran menurun, muntah menyembur.",
      "Pasca operasi: kontrol rutin 3–6 bulan, hindari air masuk telinga, mungkin perlu operasi kedua untuk konfirmasi tidak ada residu.",
      "Penggunaan alat bantu dengar dapat membantu setelah operasi bila pendengaran masih turun.",
    ],
    channels: ["print", "wa"],
  },
  soapMapping: {
    subjective: (ctx) => {
      const a = ctx.anamnesis;
      const cc = ctx.chiefComplaint?.trim();
      const items: string[] = [];
      if (a["otore-berbau"]) items.push("otore berbau busuk");
      if (a["penurunan-pendengaran-progresif"])
        items.push("penurunan pendengaran progresif");
      if (a["vertigo-pusing"]) items.push("vertigo");
      if (a["nyeri-telinga-hebat"]) items.push("nyeri telinga hebat");
      if (a["demam-tinggi"]) items.push("demam tinggi");
      if (a["sakit-kepala-hebat"]) items.push("sakit kepala hebat");
      if (a["wajah-perot"]) items.push("wajah perot (RED FLAG paresis N. VII)");
      if (a["diplopia"]) items.push("diplopia (RED FLAG petrositis)");
      if (a["kejang-penurunan-kesadaran"])
        items.push("kejang/penurunan kesadaran (RED FLAG intrakranial)");
      if (a["muntah-proyektil"]) items.push("muntah proyektil");
      const summary =
        items.length > 0
          ? `Pasien mengeluhkan ${items.join(", ")}.`
          : "Tidak ada keluhan akut. Surveilans OMSK bahaya.";
      return cc ? `Keluhan utama: ${cc}. ${summary}` : summary;
    },
    objective: (ctx) => {
      const e = ctx.examination;
      const items: string[] = [];
      if (e["perforasi-atik-marginal"])
        items.push("perforasi atik/marginal");
      if (e["debris-keratin"]) items.push("debris keratin (kolesteatoma)");
      if (e["granulasi-polip"]) items.push("granulasi/polip kavum");
      if (e["secret-purulen-busuk"]) items.push("sekret purulen berbau");
      if (e["nyeri-tekan-mastoid"]) items.push("nyeri tekan mastoid");
      if (e["edema-retroaurikuler"])
        items.push("edema retroaurikuler (abses subperiosteal)");
      if (e["fistula-positif"]) items.push("tes fistula POSITIF");
      if (e["paresis-n7-house"])
        items.push("paresis N. VII (House-Brackmann ≥II)");
      if (e["kaku-kuduk"]) items.push("kaku kuduk + meningismus");
      if (e["rinne-negatif"]) items.push("Rinne negatif");
      const head =
        items.length > 0
          ? `Otoskopi & klinis: ${items.join(", ")}.`
          : "Otoskopi: pars flaksida & marginal utuh, tidak ada debris.";
      const lines = [head];
      const cholStage = ctx.scoring["cholesteatoma"]?.values.stage ?? 0;
      const compTotal =
        ctx.scoring["complications"]?.result.total ?? 0;
      const ctScore = ctx.scoring["ct-finding"]?.values.score ?? 0;
      if (cholStage > 0)
        lines.push(`Stadium kolesteatoma: ${ctx.scoring["cholesteatoma"]?.result.interpretation}.`);
      if (compTotal > 0)
        lines.push(`Komplikasi: ${ctx.scoring["complications"]?.result.interpretation}.`);
      if (ctScore > 0)
        lines.push(`CT mastoid: ${ctx.scoring["ct-finding"]?.result.interpretation}.`);
      return lines.join(" ");
    },
    assessment: (ctx) => {
      const dx = ctx.diagnoses[0]?.icd10Code ?? "H66.2";
      const compTotal = ctx.scoring["complications"]?.result.total ?? 0;
      const cholStage = ctx.scoring["cholesteatoma"]?.values.stage ?? 0;
      const base = `OMSK tipe BAHAYA (${dx}) — atikoantral${cholStage >= 1 ? " dengan kolesteatoma" : ""}.`;
      if (compTotal >= 1)
        return `${base} **EMERGENCY** — ${compTotal} komplikasi aktif terdeteksi. Stabilisasi + rujuk RS tersier urgent.`;
      if (cholStage >= 2)
        return `${base} Indikasi mastoidektomi + timpanoplasti elektif setelah audiometri & CT mastoid.`;
      return `${base} Surveilans, antibiotik bila otore aktif, pertimbangkan rujukan bedah otologi.`;
    },
    plan: (ctx) => {
      const t = ctx.treatments;
      const lines: string[] = [];
      if (t["antibiotik-iv"])
        lines.push("Antibiotik IV: Seftriakson 2g IV + Metronidazol 500mg IV q8h");
      if (t["steroid-sistemik"])
        lines.push("Metilprednisolon 1mg/kgBB/hari, taper 10–14 hari");
      if (t["aural-toilet"]) lines.push("Aural toilet (96.52)");
      if (t["ct-mastoid"]) lines.push("CT scan mastoid kontras (87.69)");
      if (t["mri-kepala"]) lines.push("MRI kepala kontras (88.91)");
      if (t["audiometri"]) lines.push("Audiometri nada murni (95.41)");
      if (t["mastoidektomi"])
        lines.push(
          "Rencana mastoidektomi + timpanoplasti (20.49) — tipe CWU/CWD sesuai luas kolesteatoma",
        );
      if (t["rujuk-bedah-urgent"])
        lines.push("Rujuk URGENT bedah otologi / bedah saraf");
      if (t["edukasi-komplikasi"])
        lines.push("Edukasi tanda bahaya komplikasi → segera IGD");
      lines.push("Follow-up sesuai kondisi.");
      return lines.join(". ") + ".";
    },
  },
  references: [
    { label: "PPK PERHATI-KL — OMSK tipe atikoantral / bahaya" },
    { label: "AAO-HNS Cholesteatoma Position Statement" },
    { label: "EAONO/JOS Cholesteatoma Classification 2017" },
    { label: "Glasscock-Shambaugh Surgery of the Ear" },
  ],
};

export default spec;
