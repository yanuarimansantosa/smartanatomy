/**
 * Module 5 — Benda Asing Saluran Napas / Foreign Body Airway (T17.x) — EMERGENCY
 * Reference: PPK PERHATI-KL · ATLS · ERC/AHA Choking Guidelines
 *
 * Karakter: EMERGENCY · waktu sangat penting (golden minutes).
 * Tujuan modul:
 *   1. Triase cepat: airway intact vs obstruktif vs total
 *   2. Tindakan resusitasi sesuai urgensi
 *   3. Lokalisasi (laring/trakea/bronkus) → bronkoskopi rigid
 *   4. Persiapan rujukan OK / ICU
 *
 * EMERGENCY MODE selalu ON jika ada tanda obstruksi.
 * Default tetap NORMAL (untuk kasus follow-up post-ekstraksi yang stabil).
 */

import type { ModuleSpec, ScoringResult } from "../types";

// ==========================================================================
// Scoring computers
// ==========================================================================

const obstructionCompute = (v: Record<string, number>): ScoringResult => {
  const grade = v.grade ?? 0;
  // 0=tidak ada (post-extraksi), 1=parsial (stridor inspirasi, batuk efektif)
  // 2=signifikan (stridor 2-fase, retraksi, sianosis ringan)
  // 3=total/critical (silent chest / unresponsive / sianosis berat)
  const labels = [
    "Tidak ada obstruksi (post-ekstraksi / follow-up)",
    "Obstruksi PARSIAL — batuk efektif, stridor inspirasi",
    "Obstruksi SIGNIFIKAN — stridor bifasik, retraksi, sianosis ringan",
    "Obstruksi TOTAL / CRITICAL — silent chest, unresponsive, sianosis berat",
  ];
  const sev: ScoringResult["severity"] =
    grade >= 3 ? "very-high" : grade >= 2 ? "high" : grade >= 1 ? "moderate" : "low";
  return {
    total: grade,
    severity: sev,
    interpretation: labels[grade] ?? labels[0],
    recommendation:
      grade === 3
        ? "ACTIVATE BLS/ALS. Heimlich (dewasa)/back blow+chest thrust (bayi). Cricothyroidotomy bila gagal. Bronkoskopi rigid emergency di OK."
        : grade === 2
          ? "Oksigen, posisi nyaman, jangan provokasi batuk paksa, transport tegak ke OK untuk bronkoskopi rigid."
          : grade === 1
            ? "Encourage cough effective. Persiapkan bronkoskopi rigid semi-emergency."
            : undefined,
  };
};

const locationCompute = (v: Record<string, number>): ScoringResult => {
  const loc = v.location ?? 0;
  // 0=tidak diketahui, 1=laring, 2=trakea, 3=bronkus kanan, 4=bronkus kiri
  const labels = [
    "Lokasi belum dipastikan",
    "LARING (suara serak/afonia, stridor inspirasi)",
    "TRAKEA (stridor bifasik, batuk paroksismal, audible slap)",
    "BRONKUS KANAN (suara napas asimetris kanan, lebih sering — anatomis)",
    "BRONKUS KIRI (suara napas asimetris kiri)",
  ];
  return {
    total: loc,
    severity: loc >= 1 ? "moderate" : "low",
    interpretation: labels[loc] ?? labels[0],
    recommendation:
      loc >= 1
        ? "Bronkoskopi rigid (33.21) di OK dengan tim anestesi GA. Siapkan optical forceps & alligator."
        : "Lokalisasi via auskultasi + Rontgen dada (inspirasi/ekspirasi) atau CT.",
  };
};

const ageRiskCompute = (v: Record<string, number>): ScoringResult => {
  const age = v.ageYears ?? 5;
  // Risk highest age 1-3 (organic seeds), then 4-6, lower in adults
  if (age <= 3)
    return {
      total: age,
      severity: "very-high",
      interpretation:
        "USIA RISIKO TINGGI (≤3 thn) — kacang/biji organik tersering, dapat membengkak & memburuk dalam jam.",
      recommendation:
        "Bronkoskopi rigid SEGERA, jangan ditunda; kebutuhan anestesi pediatrik.",
    };
  if (age <= 6)
    return {
      total: age,
      severity: "high",
      interpretation: "Usia risiko (4–6 thn) — mainan kecil, kelereng, koin.",
      recommendation: "Bronkoskopi rigid prioritas dalam jam.",
    };
  return {
    total: age,
    severity: "moderate",
    interpretation: "Dewasa/anak besar — sering ikan/duri, gigi palsu lepas.",
  };
};

// ==========================================================================
// ModuleSpec
// ==========================================================================

const spec: ModuleSpec = {
  id: "fb-airway",
  title: "Benda Asing Saluran Napas (FB Airway)",
  subspecialty: "Emergency",
  iconName: "siren",
  tags: ["T17", "EMERGENCY", "bronkoskopi", "PERHATI-KL"],
  emergencyTriggers: [
    {
      level: "red",
      title: "EMERGENCY — Foreign Body Airway",
      message:
        "Obstruksi jalan napas terdeteksi. Aktifkan BLS/ALS, oksigen, JANGAN provokasi batuk paksa, posisi nyaman, transport TEGAK ke OK untuk bronkoskopi rigid.",
      actions: [
        { id: "bls", label: "Aktifkan BLS/ALS" },
        { id: "ok", label: "Booking OK + tim anestesi" },
        { id: "rujuk", label: "Rujuk RS dengan bronkoskopi rigid" },
      ],
      trigger: (ctx) =>
        (ctx.scoring["obstruction"]?.values.grade ?? 0) >= 1 ||
        ctx.anamnesis["choking-history"] === true ||
        ctx.examination["stridor"] === true ||
        ctx.examination["sianosis"] === true,
    },
  ],
  diagnoses: [
    {
      icd10Code: "T17.5",
      display: "Benda asing pada bronkus",
      defaultPrimary: true,
      reasoning:
        "Lokasi tersering (terutama bronkus kanan) — anatomis lebih lurus & lebar.",
    },
    {
      icd10Code: "T17.4",
      display: "Benda asing pada trakea",
    },
    {
      icd10Code: "T17.3",
      display: "Benda asing pada laring",
    },
    {
      icd10Code: "T17.8",
      display: "Benda asing bagian saluran napas lainnya",
    },
    {
      icd10Code: "T17.9",
      display: "Benda asing saluran napas tidak ditentukan",
    },
    {
      icd10Code: "J95.5",
      display: "Komplikasi pasca tindakan: edema laring",
    },
  ],
  cdssRules: [
    {
      id: "total-obstruction-bls",
      evaluate: (ctx) => {
        const grade = ctx.scoring["obstruction"]?.values.grade ?? 0;
        if (grade >= 3) {
          return {
            ruleId: "total-obstruction-bls",
            level: "emergency",
            message:
              "OBSTRUKSI TOTAL — ACTIVATE BLS NOW. Dewasa: 5 abdominal thrust (Heimlich). Bayi <1 thn: 5 back blow + 5 chest thrust. Bila gagal: cricothyroidotomy. Bronkoskopi rigid emergency.",
            reference: { label: "AHA/ERC Choking Algorithm 2020" },
            suggestTreatmentIds: ["heimlich-bls", "cricothyroidotomy", "bronkoskopi-rigid"],
          };
        }
        return null;
      },
    },
    {
      id: "significant-obstruction",
      evaluate: (ctx) => {
        const grade = ctx.scoring["obstruction"]?.values.grade ?? 0;
        if (grade === 2) {
          return {
            ruleId: "significant-obstruction",
            level: "danger",
            message:
              "Obstruksi SIGNIFIKAN: oksigen 100%, posisi nyaman (jangan paksa berbaring), JANGAN sweep blind di mulut, transport tegak ke OK. Bronkoskopi rigid (33.21) di OK dengan GA.",
            reference: { label: "PPK PERHATI-KL · ATLS" },
            suggestTreatmentIds: ["oksigen", "bronkoskopi-rigid", "rujuk-ok"],
          };
        }
        return null;
      },
    },
    {
      id: "partial-obstruction",
      evaluate: (ctx) => {
        const grade = ctx.scoring["obstruction"]?.values.grade ?? 0;
        if (grade === 1) {
          return {
            ruleId: "partial-obstruction",
            level: "warn",
            message:
              "Obstruksi PARSIAL: encourage batuk efektif (jangan dihambat), oksigen, monitoring SpO2. Persiapkan bronkoskopi rigid semi-emergency.",
            reference: { label: "AHA/ERC Choking Algorithm" },
            suggestTreatmentIds: ["oksigen", "bronkoskopi-rigid"],
          };
        }
        return null;
      },
    },
    {
      id: "pediatric-high-risk",
      evaluate: (ctx) => {
        const age = ctx.scoring["age-risk"]?.values.ageYears ?? 5;
        if (age <= 3) {
          return {
            ruleId: "pediatric-high-risk",
            level: "danger",
            message:
              "PEDIATRIK ≤3 TAHUN: kacang/biji organik dapat membengkak & inflamasi. Bronkoskopi rigid SEGERA — jangan tunda observasi. Tim anestesi pediatrik.",
            reference: { label: "PPK PERHATI-KL · pediatric airway" },
          };
        }
        return null;
      },
    },
    {
      id: "right-bronchus-likely",
      evaluate: (ctx) => {
        const asimetri = ctx.examination["suara-napas-asimetri-kanan"];
        if (asimetri) {
          return {
            ruleId: "right-bronchus-likely",
            level: "info",
            message:
              "Suara napas asimetris kanan menurun → curigai BENDA ASING BRONKUS KANAN (lokasi tersering). Konfirmasi via Rontgen inspirasi/ekspirasi (air trapping) atau bronkoskopi.",
            reference: { label: "Pediatric airway anatomy" },
          };
        }
        return null;
      },
    },
    {
      id: "delayed-presentation",
      evaluate: (ctx) => {
        if (ctx.anamnesis["onset-lebih-24jam"]) {
          return {
            ruleId: "delayed-presentation",
            level: "warn",
            message:
              "Onset >24 jam: risiko pneumonia obstruktif, atelektasis, abses paru. Antibiotik profilaksis pertimbangkan, Rontgen dada wajib, bronkoskopi tetap diindikasikan.",
            reference: { label: "PPK PERHATI-KL — late presentation FB airway" },
            suggestTreatmentIds: ["rontgen-dada", "antibiotik-profilaksis", "bronkoskopi-rigid"],
          };
        }
        return null;
      },
    },
  ],
  anamnesis: {
    title: "Anamnesis (tap bila POSITIF) — fokus saksi tertelan/tersedak",
    helper:
      "Cardinal: penyaksian episode tersedak (choking event). Tanpa saksi, FB airway sering terlewat → telat berbulan.",
    items: [
      {
        id: "choking-history",
        normalLabel: "Tidak ada riwayat tersedak",
        abnormalLabel:
          "Riwayat TERSEDAK saat makan/main (choking event tersaksikan) — CARDINAL",
        tag: "choking",
      },
      {
        id: "batuk-mendadak",
        normalLabel: "Tidak ada batuk mendadak",
        abnormalLabel: "Batuk mendadak onset akut (sering setelah tersedak)",
      },
      {
        id: "sesak",
        normalLabel: "Tidak sesak",
        abnormalLabel: "Sesak / dyspneu",
      },
      {
        id: "stridor-dengar",
        normalLabel: "Tidak ada stridor terdengar",
        abnormalLabel: "Stridor / suara seperti mengi (kasar)",
      },
      {
        id: "suara-serak",
        normalLabel: "Suara normal",
        abnormalLabel: "Suara serak / afonia (curigai laring)",
      },
      {
        id: "wheezing-ekspirasi",
        normalLabel: "Tidak ada wheezing",
        abnormalLabel: "Wheezing ekspirasi (sering disalahdiagnosis asma)",
      },
      {
        id: "onset-lebih-24jam",
        normalLabel: "Onset <24 jam",
        abnormalLabel:
          "Onset >24 jam / kronik (risiko pneumonia obstruktif & abses)",
        tag: "delayed",
      },
      {
        id: "demam",
        normalLabel: "Tidak demam",
        abnormalLabel: "Demam (curigai infeksi sekunder / pneumonia)",
      },
      {
        id: "riwayat-makan-kacang",
        normalLabel: "Tidak ada riwayat makan kacang/biji",
        abnormalLabel: "Habis makan kacang/biji-bijian/permen kecil/mainan",
      },
      {
        id: "anak-aktif-saat-aspirasi",
        normalLabel: "Anak tenang",
        abnormalLabel: "Anak sedang berlari/menangis/tertawa saat aspirasi",
      },
    ],
  },
  examination: {
    title: "Pemeriksaan fisik (tap bila ABNORMAL)",
    helper: "Triase ABC + auskultasi paru komparasi kanan-kiri.",
    items: [
      {
        id: "kesadaran-menurun",
        normalLabel: "Sadar penuh (alert)",
        abnormalLabel: "Kesadaran menurun / unresponsive — RED FLAG",
        tag: "altered-consciousness",
      },
      {
        id: "sianosis",
        normalLabel: "Tidak sianosis",
        abnormalLabel: "SIANOSIS perifer/sentral — RED FLAG hipoksia",
        tag: "cyanosis",
      },
      {
        id: "stridor",
        normalLabel: "Tidak ada stridor",
        abnormalLabel:
          "STRIDOR (inspirasi=laring, bifasik=trakea, ekspirasi=bronkus)",
        tag: "stridor",
      },
      {
        id: "retraksi-pernapasan",
        normalLabel: "Tidak ada retraksi",
        abnormalLabel:
          "Retraksi suprasternal/interkosta/subkosta (work of breathing meningkat)",
      },
      {
        id: "spo2-rendah",
        normalLabel: "SpO2 ≥95%",
        abnormalLabel: "SpO2 <95% (hipoksia — segera oksigen)",
      },
      {
        id: "takipneu",
        normalLabel: "Frekuensi napas normal",
        abnormalLabel: "Takipneu untuk usia",
      },
      {
        id: "suara-napas-asimetri-kanan",
        normalLabel: "Suara napas simetris",
        abnormalLabel:
          "Suara napas menurun di KANAN (curigai bronkus kanan obstruksi)",
        tag: "right-decreased",
      },
      {
        id: "suara-napas-asimetri-kiri",
        normalLabel: "Suara napas simetris",
        abnormalLabel:
          "Suara napas menurun di KIRI (curigai bronkus kiri obstruksi)",
        tag: "left-decreased",
      },
      {
        id: "wheezing-lokal",
        normalLabel: "Tidak ada wheezing",
        abnormalLabel: "Wheezing lokal/ronki kasar di satu sisi",
      },
      {
        id: "silent-chest",
        normalLabel: "Suara napas terdengar bilateral",
        abnormalLabel:
          "SILENT CHEST (tidak terdengar suara napas) — CRITICAL",
        tag: "silent-chest",
      },
    ],
  },
  scoring: [
    {
      id: "obstruction",
      name: "Derajat obstruksi jalan napas (CRITICAL)",
      description: "Triase derajat obstruksi → menentukan urgensi tindakan.",
      reference: { label: "AHA/ERC Choking Algorithm 2020" },
      inputs: [
        {
          type: "select",
          id: "grade",
          label: "Derajat",
          default: 0,
          options: [
            { value: 0, label: "Tidak ada obstruksi (post-ekstraksi/follow-up)" },
            { value: 1, label: "Parsial — batuk efektif, stridor inspirasi" },
            { value: 2, label: "Signifikan — stridor bifasik, retraksi, sianosis ringan" },
            { value: 3, label: "Total/CRITICAL — silent chest, unresponsive" },
          ],
        },
      ],
      compute: obstructionCompute,
    },
    {
      id: "location",
      name: "Lokasi benda asing (suspek)",
      description:
        "Lokasi anatomis berdasarkan suara/auskultasi/imaging — menentukan instrumen bronkoskopi.",
      reference: { label: "PPK PERHATI-KL · pediatric airway" },
      inputs: [
        {
          type: "select",
          id: "location",
          label: "Lokasi",
          default: 0,
          options: [
            { value: 0, label: "Belum dipastikan" },
            { value: 1, label: "Laring (suara serak, stridor inspirasi)" },
            { value: 2, label: "Trakea (stridor bifasik, audible slap)" },
            { value: 3, label: "Bronkus kanan (asimetri kanan, paling sering)" },
            { value: 4, label: "Bronkus kiri (asimetri kiri)" },
          ],
        },
      ],
      compute: locationCompute,
    },
    {
      id: "age-risk",
      name: "Stratifikasi risiko usia",
      description:
        "Anak ≤3 thn risiko sangat tinggi (kacang/biji organik dapat membengkak).",
      reference: { label: "AAP / PERHATI-KL pediatric airway" },
      inputs: [
        {
          type: "scale",
          id: "ageYears",
          label: "Usia (tahun)",
          min: 0,
          max: 100,
          step: 1,
          default: 5,
        },
      ],
      compute: ageRiskCompute,
    },
  ],
  pathway: [
    {
      id: "step-1",
      title: "Triase ABC (≤60 detik)",
      detail:
        "Airway-Breathing-Circulation. Cek kesadaran, sianosis, stridor, SpO2.",
    },
    {
      id: "step-2",
      title: "Bila TOTAL OBSTRUCTION (silent chest/unresponsive)",
      detail:
        "ACTIVATE BLS/ALS. Heimlich (dewasa)/back blow+chest thrust (bayi). Bila gagal: cricothyroidotomy. Transport ke OK.",
    },
    {
      id: "step-3",
      title: "Oksigen + posisi nyaman + monitoring",
      detail:
        "Oksigen 100% via NRM, posisi yang pasien pilih (jangan dipaksa baring), monitor SpO2 kontinu.",
    },
    {
      id: "step-4",
      title: "Imaging (bila stabil & waktu memungkinkan)",
      detail:
        "Rontgen dada inspirasi+ekspirasi (air trapping, mediastinum shift). CT bila Ro normal tapi curiga kuat.",
    },
    {
      id: "step-5",
      title: "Bronkoskopi rigid (33.21) di OK",
      detail:
        "Tim anestesi GA, optical forceps, alligator. Pilih cabang sesuai lokasi.",
    },
    {
      id: "step-6",
      title: "Pasca ekstraksi: observasi & follow-up",
      detail:
        "Steroid (dexamethasone) untuk edema laring, observasi 24 jam, Rontgen dada kontrol.",
    },
    {
      id: "step-7",
      title: "Edukasi orangtua & pencegahan",
      detail:
        "Hindari kacang/biji utuh untuk anak <4 thn, mainan tanpa bagian kecil, supervisi makan.",
    },
  ],
  treatments: [
    {
      id: "heimlich-bls",
      label: "BLS — Heimlich (dewasa) / Back blow + chest thrust (bayi)",
      category: "tindakan",
      reference: { label: "AHA/ERC Choking Algorithm" },
    },
    {
      id: "cricothyroidotomy",
      label: "Cricothyroidotomy emergency (31.1)",
      category: "tindakan",
      icd9Code: "31.1",
      icd9NameId: "Cricothyrotomy / cricothyroidotomy emergency",
      feeIdr: 3_500_000,
      isOperative: true,
      reference: { label: "ATLS — surgical airway" },
    },
    {
      id: "oksigen",
      label: "Oksigen 100% via Non-Rebreather Mask",
      category: "tindakan",
    },
    {
      id: "bronkoskopi-rigid",
      label: "Bronkoskopi rigid + ekstraksi benda asing (33.21)",
      category: "tindakan",
      icd9Code: "33.21",
      icd9NameId: "Bronkoskopi rigid (diagnostik & terapeutik)",
      feeIdr: 7_500_000,
      isOperative: true,
      reference: { label: "PPK PERHATI-KL · gold standard FB airway" },
    },
    {
      id: "rontgen-dada",
      label: "Rontgen dada inspirasi+ekspirasi (87.44)",
      category: "tindakan",
      icd9Code: "87.44",
      icd9NameId: "Rontgen toraks rutin",
      feeIdr: 200_000,
    },
    {
      id: "ct-toraks",
      label: "CT scan toraks (87.41)",
      category: "tindakan",
      icd9Code: "87.41",
      icd9NameId: "CT scan toraks",
      feeIdr: 1_800_000,
    },
    {
      id: "deksametason",
      label: "Deksametason IV (anti-edema laring pasca-ekstraksi)",
      category: "medikamentosa",
      prescription: {
        drugName: "Deksametason",
        genericName: "Dexamethasone",
        drugForm: "Vial",
        strength: "5 mg/mL",
        dose: "0.6 mg/kgBB (max 16 mg)",
        frequency: "Single dose",
        route: "IV",
        instructions: "Pra/pasca-ekstraksi untuk profilaksis edema laring.",
      },
    },
    {
      id: "antibiotik-profilaksis",
      label: "Antibiotik profilaksis (bila onset >24 jam atau pneumonia)",
      category: "medikamentosa",
      prescription: {
        drugName: "Amoksisilin-Asam Klavulanat",
        genericName: "Amoxicillin + Clavulanic acid",
        drugForm: "Tablet/sirup",
        strength: "Sesuai BB anak",
        frequency: "3× sehari",
        duration: "7–10 hari",
        route: "Per oral",
      },
    },
    {
      id: "rujuk-ok",
      label: "Booking OK + tim anestesi (rigid bronchoscopy)",
      category: "rujukan",
      defaultSelected: false,
    },
    {
      id: "rujuk-rs-tersier",
      label: "Rujuk RS dengan bronkoskopi rigid pediatrik",
      category: "rujukan",
    },
    {
      id: "edukasi-pencegahan",
      label: "Edukasi orangtua: pencegahan aspirasi anak",
      category: "edukasi",
      defaultSelected: true,
    },
  ],
  education: {
    title: "Edukasi orangtua — Pencegahan Aspirasi Benda Asing",
    bullets: [
      "Anak <4 tahun JANGAN diberi kacang utuh, biji, permen keras, popcorn, anggur utuh.",
      "Mainan harus tanpa bagian kecil (test: cek dengan tabung tisu — bila masuk = bahaya).",
      "Awasi anak saat makan — jangan biarkan makan sambil berlari/main.",
      "Bila ada riwayat tersedak (meski terlihat baik kemudian): SEGERA ke fasilitas dengan bronkoskopi rigid.",
      "Jangan berikan obat batuk untuk 'menahan' batuk — batuk adalah refleks pertahanan.",
      "Pelajari Heimlich/back blow untuk bayi (P3K dasar wajib bagi orangtua).",
    ],
    channels: ["print", "wa"],
  },
  soapMapping: {
    subjective: (ctx) => {
      const a = ctx.anamnesis;
      const cc = ctx.chiefComplaint?.trim();
      const items: string[] = [];
      if (a["choking-history"])
        items.push("riwayat TERSEDAK tersaksikan (cardinal)");
      if (a["batuk-mendadak"]) items.push("batuk mendadak onset akut");
      if (a["sesak"]) items.push("sesak");
      if (a["stridor-dengar"]) items.push("stridor terdengar");
      if (a["suara-serak"]) items.push("suara serak/afonia");
      if (a["wheezing-ekspirasi"]) items.push("wheezing ekspirasi");
      if (a["onset-lebih-24jam"])
        items.push("onset >24 jam (delayed presentation)");
      if (a["demam"]) items.push("demam");
      if (a["riwayat-makan-kacang"])
        items.push("riwayat makan kacang/biji/mainan kecil");
      if (a["anak-aktif-saat-aspirasi"])
        items.push("anak sedang aktif saat aspirasi");
      const summary =
        items.length > 0
          ? `Pasien/orangtua melaporkan ${items.join(", ")}.`
          : "Tidak ada keluhan akut. Follow-up post-ekstraksi.";
      return cc ? `Keluhan utama: ${cc}. ${summary}` : summary;
    },
    objective: (ctx) => {
      const e = ctx.examination;
      const items: string[] = [];
      if (e["kesadaran-menurun"]) items.push("kesadaran menurun");
      if (e["sianosis"]) items.push("sianosis");
      if (e["stridor"]) items.push("stridor");
      if (e["retraksi-pernapasan"]) items.push("retraksi pernapasan");
      if (e["spo2-rendah"]) items.push("SpO2 <95%");
      if (e["takipneu"]) items.push("takipneu");
      if (e["suara-napas-asimetri-kanan"])
        items.push("suara napas menurun di kanan");
      if (e["suara-napas-asimetri-kiri"])
        items.push("suara napas menurun di kiri");
      if (e["wheezing-lokal"]) items.push("wheezing/ronki lokal");
      if (e["silent-chest"]) items.push("SILENT CHEST (CRITICAL)");
      const head =
        items.length > 0
          ? `Pemeriksaan: ${items.join(", ")}.`
          : "Pemeriksaan: kondisi umum baik, ABC paten, suara napas simetris.";
      const lines = [head];
      const grade = ctx.scoring["obstruction"]?.values.grade ?? 0;
      const loc = ctx.scoring["location"]?.values.location ?? 0;
      const age = ctx.scoring["age-risk"]?.values.ageYears ?? 5;
      if (grade > 0)
        lines.push(`Derajat obstruksi: ${ctx.scoring["obstruction"]?.result.interpretation}.`);
      if (loc > 0)
        lines.push(`Lokasi: ${ctx.scoring["location"]?.result.interpretation}.`);
      if (age <= 6) lines.push(`Risiko usia: ${ctx.scoring["age-risk"]?.result.interpretation}.`);
      return lines.join(" ");
    },
    assessment: (ctx) => {
      const dx = ctx.diagnoses[0]?.icd10Code ?? "T17.5";
      const grade = ctx.scoring["obstruction"]?.values.grade ?? 0;
      const base = `Suspek benda asing saluran napas (${dx}).`;
      if (grade >= 3)
        return `${base} **EMERGENCY OBSTRUKSI TOTAL** — BLS aktif, persiapan bronkoskopi rigid emergency / cricothyroidotomy.`;
      if (grade === 2)
        return `${base} Obstruksi signifikan — bronkoskopi rigid SEGERA di OK.`;
      if (grade === 1)
        return `${base} Obstruksi parsial — bronkoskopi rigid semi-emergency.`;
      return `${base} Stabil; tetap perlu konfirmasi via Rontgen + bronkoskopi.`;
    },
    plan: (ctx) => {
      const t = ctx.treatments;
      const lines: string[] = [];
      if (t["heimlich-bls"]) lines.push("BLS — Heimlich/back blow sesuai usia");
      if (t["cricothyroidotomy"])
        lines.push("Cricothyroidotomy emergency (31.1) bila gagal BLS");
      if (t["oksigen"]) lines.push("Oksigen 100% NRM");
      if (t["rontgen-dada"]) lines.push("Rontgen dada inspirasi+ekspirasi (87.44)");
      if (t["ct-toraks"]) lines.push("CT toraks (87.41)");
      if (t["bronkoskopi-rigid"])
        lines.push("Bronkoskopi rigid (33.21) di OK dengan GA");
      if (t["deksametason"])
        lines.push("Deksametason 0.6 mg/kgBB IV (anti-edema laring)");
      if (t["antibiotik-profilaksis"])
        lines.push("Antibiotik profilaksis (Amox-Clav 7–10 hari)");
      if (t["rujuk-ok"]) lines.push("Booking OK + tim anestesi");
      if (t["rujuk-rs-tersier"])
        lines.push("Rujuk RS dengan bronkoskopi rigid pediatrik");
      if (t["edukasi-pencegahan"])
        lines.push("Edukasi orangtua: pencegahan aspirasi anak");
      return lines.length > 0 ? lines.join(". ") + "." : "Stabilisasi & rencana tindakan sesuai kondisi.";
    },
  },
  references: [
    { label: "PPK PERHATI-KL — Benda Asing Saluran Napas" },
    { label: "AHA/ERC Choking Algorithm 2020" },
    { label: "ATLS — Surgical Airway" },
    { label: "AAP Pediatric Airway Foreign Body" },
  ],
};

export default spec;
