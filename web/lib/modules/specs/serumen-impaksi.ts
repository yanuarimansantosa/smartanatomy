/**
 * Module 11 — Serumen Impaksi / Impacted Cerumen (H61.2)
 * Reference: AAO-HNS Clinical Practice Guideline: Cerumen Impaction (update 2017) ·
 *            PPK PERHATI-KL · WHO Ear & hearing care training resource 2020
 *
 * KARAKTER MODUL — HIGH-VOLUME CASHFLOW:
 *   Serumen impaksi adalah keluhan telinga paling sering di praktik umum &
 *   THT. Workflow sederhana, cepat (~10 menit), margin sehat. Modul ini didesain
 *   untuk:
 *     - Screening kontraindikasi IRIGASI (perforasi / OE aktif / DM lanjut / pasien
 *       tidak kooperatif) secara cepat → pilih metode yang aman
 *     - Auto-pricing 3 metode: irigasi / kuretase / suction-aspirasi
 *     - Cross-sell OTC (softener drops) + edukasi cara bersihkan telinga
 *     - Lab referral audiometri bila HL tidak membaik setelah ekstraksi
 *
 *   GOAL: zero-typing, 1-minute visit, Rp 150–255k + platform fee Rp 5k.
 */

import type { ModuleSpec, ScoringResult } from "../types";

// ---------------------------------------------------------------------------
// Scoring: kontraindikasi irigasi + konsistensi serumen
// ---------------------------------------------------------------------------

const irrigationSafetyCompute = (v: Record<string, number>): ScoringResult => {
  // 4 kontraindikasi absolut/relatif untuk irigasi. Setiap YES = 1 poin.
  const perforation = v.perforation ?? 0;
  const activeOE = v.activeOE ?? 0;
  const dmFragileCanal = v.dmFragileCanal ?? 0;
  const uncooperative = v.uncooperative ?? 0;
  const total = perforation + activeOE + dmFragileCanal + uncooperative;
  if (perforation >= 1) {
    return {
      total,
      severity: "very-high",
      interpretation:
        "KONTRAINDIKASI ABSOLUT irigasi — riwayat/temuan perforasi. Pilih KURETASE kering atau SUCTION.",
      recommendation: "Hindari irigasi. Gunakan kuret / suction di bawah otoskop/otomikroskop.",
    };
  }
  if (total >= 1) {
    return {
      total,
      severity: "high",
      interpretation:
        "Kontraindikasi relatif irigasi (OE aktif / DM kulit rapuh / tidak kooperatif). Hati-hati.",
      recommendation: "Preferensi kuret kering atau suction; atau tunda + softener dulu.",
    };
  }
  return {
    total: 0,
    severity: "low",
    interpretation: "Aman untuk irigasi standar.",
    recommendation: "Irigasi dengan air hangat (37°C) ± softener 2–3 hari bila serumen keras.",
  };
};

const consistencyCompute = (v: Record<string, number>): ScoringResult => {
  // 0=lunak/kuning lembek, 1=semi-keras, 2=keras kering, 3=batu (rock-hard)
  const c = v.consistency ?? 0;
  const labels = [
    "Serumen lunak (mudah diekstraksi)",
    "Serumen semi-keras (kuretase langsung oke)",
    "Serumen keras kering (softener 2–3 hari dulu sebelum irigasi)",
    "Serumen seperti batu (butuh softener 3–5 hari + tindakan bertahap)",
  ];
  const sev: ScoringResult["severity"] =
    c >= 3 ? "high" : c === 2 ? "moderate" : "low";
  return {
    total: c,
    severity: sev,
    interpretation: labels[c] ?? labels[0],
    recommendation:
      c >= 2
        ? "Resepkan softener (docusate/minyak zaitun) 2–5 hari → kontrol untuk ekstraksi"
        : "Ekstraksi hari ini — kuretase atau irigasi sesuai kontraindikasi",
  };
};

// ---------------------------------------------------------------------------
// ModuleSpec
// ---------------------------------------------------------------------------

const spec: ModuleSpec = {
  id: "serumen-impaksi",
  title: "Serumen Impaksi",
  subspecialty: "Telinga",
  iconName: "ear",
  tags: ["H61.2", "96.52", "AAO-HNS 2017", "High-volume"],
  diagnoses: [
    {
      icd10Code: "H61.2",
      display: "Impacted cerumen (serumen impaksi)",
      defaultPrimary: true,
      reasoning:
        "Serumen obstruktif menyebabkan gejala (HL konduktif, otalgia, tinnitus, gatal) atau menghalangi pemeriksaan otoskopi.",
    },
    {
      icd10Code: "H60.8",
      display: "Other otitis externa (bila tampak inflamasi liang)",
      reasoning: "Bila ada eritema/edema liang — tatalaksana OE dulu, tunda ekstraksi agresif.",
    },
    {
      icd10Code: "H92.0",
      display: "Otalgia",
      reasoning: "Keluhan nyeri telinga sebagai akibat impaksi / manipulasi sebelumnya.",
    },
    {
      icd10Code: "H93.1",
      display: "Tinnitus",
      reasoning: "Tinnitus ringan yang reversibel setelah ekstraksi serumen.",
    },
    {
      icd10Code: "Z97.3",
      display: "Presence of hearing aid (pengguna ABD — bersihkan rutin 3–6 bulan)",
    },
  ],
  cdssRules: [
    {
      id: "perforation-absolute-contra",
      evaluate: (ctx) => {
        const hasPerf =
          ctx.anamnesis["riwayat-perforasi"] || ctx.examination["perforasi-tampak"];
        if (hasPerf) {
          return {
            ruleId: "perforation-absolute-contra",
            level: "danger",
            message:
              "KONTRAINDIKASI ABSOLUT IRIGASI: perforasi MT (riwayat/tampak). Gunakan kuretase kering atau suction di bawah otomikroskop.",
            reference: { label: "AAO-HNS CPG Cerumen Impaction 2017" },
            suggestTreatmentIds: ["ekstraksi-kuret", "ekstraksi-suction"],
          };
        }
        return null;
      },
    },
    {
      id: "oe-active-delay",
      evaluate: (ctx) => {
        const oe = ctx.examination["oe-inflamasi"];
        if (oe) {
          return {
            ruleId: "oe-active-delay",
            level: "warn",
            message:
              "OTITIS EKSTERNA aktif — tatalaksana topikal dulu (kuinolon ± steroid) 5–7 hari, tunda ekstraksi serumen. Hindari irigasi.",
            reference: { label: "AAO-HNS OE Guideline" },
            suggestTreatmentIds: ["oe-topikal", "edukasi-kontrol-7hari"],
          };
        }
        return null;
      },
    },
    {
      id: "hard-wax-softener-first",
      evaluate: (ctx) => {
        const c = ctx.scoring["consistency"]?.values.consistency ?? 0;
        if (c >= 2) {
          return {
            ruleId: "hard-wax-softener-first",
            level: "info",
            message:
              "Serumen keras — resepkan softener (docusate 5% / minyak zaitun) 2–5 hari, kontrol untuk ekstraksi. Tingkatkan keberhasilan irigasi.",
            reference: { label: "AAO-HNS CPG · Cochrane 2018 softener review" },
            suggestTreatmentIds: ["softener-docusate", "edukasi-kontrol-3hari"],
          };
        }
        return null;
      },
    },
    {
      id: "hearing-aid-user-maintenance",
      evaluate: (ctx) => {
        const abd = ctx.anamnesis["pengguna-abd"];
        if (abd) {
          return {
            ruleId: "hearing-aid-user-maintenance",
            level: "info",
            message:
              "Pengguna Alat Bantu Dengar — jadwalkan pembersihan rutin tiap 3–6 bulan untuk cegah impaksi berulang & kerusakan ABD.",
            reference: { label: "WHO Hearing aid maintenance 2020" },
            suggestTreatmentIds: ["edukasi-abd-rutin"],
          };
        }
        return null;
      },
    },
    {
      id: "persistent-hl-after-removal",
      evaluate: (ctx) => {
        const persistHL = ctx.anamnesis["hl-persisten-post-ekstraksi"];
        if (persistHL) {
          return {
            ruleId: "persistent-hl-after-removal",
            level: "warn",
            message:
              "Pendengaran tidak membaik setelah serumen keluar — curigai patologi lain (OME, SNHL, tuli campur). Rujuk audiometri (95.41).",
            reference: { label: "PERHATI-KL Evaluasi HL" },
            suggestTreatmentIds: ["audiometri-9541"],
          };
        }
        return null;
      },
    },
    {
      id: "canal-trauma-post-procedure",
      evaluate: (ctx) => {
        const abrasion = ctx.examination["trauma-liang"];
        if (abrasion) {
          return {
            ruleId: "canal-trauma-post-procedure",
            level: "warn",
            message:
              "Abrasi/luka liang telinga post-tindakan — resepkan kuinolon topikal 5 hari untuk cegah OE sekunder. Kontrol 1 minggu.",
            reference: { label: "AAO-HNS Post-procedure care" },
            suggestTreatmentIds: ["oe-topikal", "edukasi-kontrol-7hari"],
          };
        }
        return null;
      },
    },
  ],
  anamnesis: {
    title: "Anamnesis (tap bila ABNORMAL)",
    helper:
      "Default semua normal. Cardinal: telinga terasa penuh / pendengaran turun. Cek kontraindikasi irigasi.",
    items: [
      {
        id: "telinga-penuh",
        normalLabel: "Tidak ada keluhan telinga",
        abnormalLabel: "Rasa telinga penuh / buntu",
      },
      {
        id: "pendengaran-turun",
        normalLabel: "Pendengaran baik",
        abnormalLabel: "Pendengaran turun pada sisi yang terkena",
      },
      {
        id: "tinnitus",
        normalLabel: "Tidak ada tinnitus",
        abnormalLabel: "Tinnitus ringan pada sisi yang terkena",
      },
      {
        id: "gatal-liang",
        normalLabel: "Tidak gatal",
        abnormalLabel: "Gatal di liang telinga",
      },
      {
        id: "nyeri-telinga",
        normalLabel: "Tidak nyeri",
        abnormalLabel: "Nyeri telinga (otalgia)",
      },
      {
        id: "riwayat-perforasi",
        normalLabel: "Tidak ada riwayat perforasi / operasi telinga",
        abnormalLabel: "Riwayat perforasi / operasi telinga / grommet (KONTRA IRIGASI)",
        tag: "perforation-history",
      },
      {
        id: "pengguna-abd",
        normalLabel: "Tidak memakai alat bantu dengar",
        abnormalLabel: "Pengguna alat bantu dengar (ABD)",
        tag: "hearing-aid",
      },
      {
        id: "riwayat-cotton-bud",
        normalLabel: "Tidak sering pakai cotton bud",
        abnormalLabel: "Sering mengorek telinga (cotton bud / jari / alat lain)",
      },
      {
        id: "dm-tidak-terkontrol",
        normalLabel: "Tidak ada DM / DM terkontrol",
        abnormalLabel: "Diabetes tidak terkontrol (kulit liang rapuh, risiko OE maligna)",
        tag: "dm-uncontrolled",
      },
      {
        id: "hl-persisten-post-ekstraksi",
        normalLabel: "Pasien baru pertama keluhan",
        abnormalLabel: "Keluhan HL tetap setelah serumen pernah dibersihkan sebelumnya",
        tag: "persistent-hl",
      },
    ],
  },
  examination: {
    title: "Pemeriksaan otoskopi (tap bila ABNORMAL)",
    helper:
      "Pastikan tipe, posisi, konsistensi serumen. Cek integritas MT, tanda OE/perforasi.",
    items: [
      {
        id: "serumen-obstruktif",
        normalLabel: "Liang bersih / serumen minimal",
        abnormalLabel: "Serumen obstruktif (>50% oklusi liang)",
        tag: "obstructive-wax",
      },
      {
        id: "serumen-total",
        normalLabel: "MT sebagian terlihat",
        abnormalLabel: "Serumen total occluding — MT tidak tampak sama sekali",
        tag: "total-occlusion",
      },
      {
        id: "perforasi-tampak",
        normalLabel: "MT utuh (setelah ekstraksi sebagian)",
        abnormalLabel: "Perforasi MT tampak (partial view) — KONTRA IRIGASI",
        tag: "perforation-visible",
      },
      {
        id: "oe-inflamasi",
        normalLabel: "Liang tenang",
        abnormalLabel: "Otitis eksterna aktif (eritema/edema/sekret)",
        tag: "otitis-externa",
      },
      {
        id: "trauma-liang",
        normalLabel: "Liang utuh",
        abnormalLabel: "Abrasi / luka kecil liang (iatrogenik / self-trauma)",
      },
      {
        id: "bilateral",
        normalLabel: "Unilateral",
        abnormalLabel: "Bilateral (dua sisi kena serumen obstruktif)",
      },
    ],
  },
  scoring: [
    {
      id: "irrigation-safety",
      name: "Kontraindikasi irigasi (AAO-HNS)",
      description:
        "Cek 4 kondisi yang melarang atau membatasi irigasi. Perforasi = KONTRA ABSOLUT.",
      reference: { label: "AAO-HNS CPG Cerumen Impaction 2017" },
      inputs: [
        {
          type: "yesNo",
          id: "perforation",
          label: "Riwayat/tampak perforasi MT? (KONTRA ABSOLUT)",
          weightYes: 1,
          weightNo: 0,
        },
        {
          type: "yesNo",
          id: "activeOE",
          label: "Otitis eksterna aktif?",
          weightYes: 1,
          weightNo: 0,
        },
        {
          type: "yesNo",
          id: "dmFragileCanal",
          label: "DM tidak terkontrol (kulit liang rapuh)?",
          weightYes: 1,
          weightNo: 0,
        },
        {
          type: "yesNo",
          id: "uncooperative",
          label: "Pasien tidak kooperatif (anak kecil/gangguan perilaku)?",
          weightYes: 1,
          weightNo: 0,
        },
      ],
      compute: irrigationSafetyCompute,
    },
    {
      id: "consistency",
      name: "Konsistensi serumen",
      description:
        "Penentu: perlu softener dulu atau bisa langsung ekstraksi hari ini?",
      reference: { label: "AAO-HNS CPG · Cochrane 2018" },
      inputs: [
        {
          type: "select",
          id: "consistency",
          label: "Konsistensi serumen",
          default: 0,
          options: [
            { value: 0, label: "Lunak (mudah)" },
            { value: 1, label: "Semi-keras (kuretase langsung)" },
            { value: 2, label: "Keras kering (softener 2–3 hari dulu)" },
            { value: 3, label: "Seperti batu (softener 3–5 hari + bertahap)" },
          ],
        },
      ],
      compute: consistencyCompute,
    },
  ],
  pathway: [
    {
      id: "step-1",
      title: "Anamnesis singkat",
      detail:
        "Durasi keluhan · HL unilateral/bilateral · riwayat perforasi/operasi · pengguna ABD · DM.",
    },
    {
      id: "step-2",
      title: "Otoskopi",
      detail:
        "Nilai tipe & konsistensi serumen, integritas MT (sebisa mungkin setelah ekstraksi sebagian), tanda OE.",
    },
    {
      id: "step-3",
      title: "Pilih metode ekstraksi",
      detail:
        "Aman irigasi → irigasi 37°C. Kontra irigasi → kuretase kering / suction di otomikroskop. Serumen batu → softener dulu.",
    },
    {
      id: "step-4",
      title: "Ekstraksi (96.52)",
      detail:
        "Lakukan tindakan, catat tarif. Cek MT pasca-ekstraksi (konfirmasi utuh), lihat mukosa liang.",
    },
    {
      id: "step-5",
      title: "Evaluasi pendengaran post-ekstraksi",
      detail:
        "Tanya subjektif. Bila tetap turun → rujuk audiometri (95.41) untuk singkirkan OME/SNHL.",
    },
    {
      id: "step-6",
      title: "Edukasi & kontrol",
      detail:
        "STOP cotton bud. Jelaskan serumen = self-cleaning. ABD → kontrol 3–6 bulan. Luka liang → topikal + kontrol 1 minggu.",
    },
  ],
  treatments: [
    {
      id: "ekstraksi-irigasi",
      label: "Ekstraksi serumen — irigasi air hangat (96.52)",
      category: "tindakan",
      icd9Code: "96.52",
      icd9NameId: "Removal of cerumen — irrigation",
      feeIdr: 150_000,
      reference: { label: "AAO-HNS CPG 2017 · PERHATI-KL" },
    },
    {
      id: "ekstraksi-kuret",
      label: "Ekstraksi serumen — kuretase kering (96.52)",
      category: "tindakan",
      icd9Code: "96.52",
      icd9NameId: "Removal of cerumen — curettage",
      feeIdr: 200_000,
      reference: { label: "AAO-HNS CPG 2017" },
    },
    {
      id: "ekstraksi-suction",
      label: "Ekstraksi serumen — suction otomikroskop (96.52)",
      category: "tindakan",
      icd9Code: "96.52",
      icd9NameId: "Removal of cerumen — microsuction",
      feeIdr: 255_000,
      reference: { label: "AAO-HNS CPG 2017" },
    },
    {
      id: "softener-docusate",
      label: "Softener telinga (docusate / minyak zaitun)",
      category: "medikamentosa",
      prescription: {
        drugName: "Docusate Sodium 5% tetes telinga",
        genericName: "Docusate",
        drugForm: "Tetes telinga",
        strength: "5%",
        dose: "5 tetes",
        frequency: "2× sehari",
        duration: "3 hari",
        route: "Telinga yang terkena",
        instructions:
          "Teteskan, miringkan kepala 5 menit. Jangan dikorek setelahnya — biar softener kerja. Kontrol untuk ekstraksi.",
        quantity: 1,
        unit: "botol",
      },
      reference: { label: "Cochrane Review 2018 — cerumenolytics" },
    },
    {
      id: "oe-topikal",
      label: "Kuinolon topikal (bila OE / abrasi liang)",
      category: "medikamentosa",
      prescription: {
        drugName: "Ofloksasin 0.3% tetes telinga",
        genericName: "Ofloxacin",
        drugForm: "Tetes telinga",
        strength: "0.3%",
        dose: "5 tetes",
        frequency: "2× sehari",
        duration: "5–7 hari",
        route: "Telinga yang terkena",
        instructions: "Bersihkan dulu, teteskan, tekan tragus. Hindari air masuk telinga.",
        quantity: 1,
        unit: "botol",
      },
      reference: { label: "AAO-HNS OE Guideline" },
    },
    {
      id: "audiometri-9541",
      label: "Audiometri nada murni (95.41) — bila HL persisten",
      category: "tindakan",
      icd9Code: "95.41",
      icd9NameId: "Audiometri nada murni",
      feeIdr: 250_000,
      reference: { label: "WHO Hearing impairment grading" },
    },
    {
      id: "edukasi-stop-cotton-bud",
      label: "Edukasi: STOP cotton bud & self-cleaning ear",
      category: "edukasi",
      defaultSelected: true,
    },
    {
      id: "edukasi-kontrol-3hari",
      label: "Edukasi: kontrol 3 hari untuk ekstraksi pasca-softener",
      category: "edukasi",
    },
    {
      id: "edukasi-kontrol-7hari",
      label: "Edukasi: kontrol 1 minggu (post-trauma liang / OE)",
      category: "edukasi",
    },
    {
      id: "edukasi-abd-rutin",
      label: "Edukasi: pengguna ABD — bersihkan rutin 3–6 bulan",
      category: "edukasi",
    },
    {
      id: "rujuk-tht-bila-kompleks",
      label: "Rujuk Sp.THT bila serumen keras gagal ekstraksi / kompleks",
      category: "rujukan",
    },
  ],
  education: {
    title: "Edukasi pasien — Serumen Impaksi",
    bullets: [
      "Serumen (kotoran telinga) normal — telinga membersihkan dirinya sendiri. Jangan korek!",
      "STOP cotton bud — malah mendorong serumen lebih dalam & bisa melukai liang/gendang telinga.",
      "Bila telinga terasa penuh / pendengaran turun → datang ke klinik, jangan korek sendiri.",
      "Setelah diekstraksi: hindari air masuk telinga 3–5 hari bila ada luka kecil / OE.",
      "Bila pendengaran tetap tidak membaik setelah serumen keluar — kembali untuk pemeriksaan audiometri.",
      "Pengguna alat bantu dengar: bersihkan rutin 3–6 bulan untuk cegah serumen impaksi berulang.",
      "Untuk serumen keras: pakai tetes pelunak 2–3 hari sebelum kontrol, bukan dikorek.",
    ],
    channels: ["print", "wa"],
  },
  soapMapping: {
    subjective: (ctx) => {
      const a = ctx.anamnesis;
      const cc = ctx.chiefComplaint?.trim();
      const items: string[] = [];
      if (a["telinga-penuh"]) items.push("rasa telinga penuh/buntu");
      if (a["pendengaran-turun"]) items.push("penurunan pendengaran");
      if (a["tinnitus"]) items.push("tinnitus");
      if (a["gatal-liang"]) items.push("gatal liang telinga");
      if (a["nyeri-telinga"]) items.push("nyeri telinga ringan");
      if (a["riwayat-perforasi"]) items.push("RIWAYAT PERFORASI / operasi telinga");
      if (a["pengguna-abd"]) items.push("pengguna alat bantu dengar");
      if (a["riwayat-cotton-bud"]) items.push("riwayat penggunaan cotton bud");
      if (a["dm-tidak-terkontrol"]) items.push("DM tidak terkontrol");
      if (a["hl-persisten-post-ekstraksi"])
        items.push("HL tetap setelah ekstraksi serumen sebelumnya");
      const summary =
        items.length > 0
          ? `Pasien mengeluhkan ${items.join(", ")}.`
          : "Tidak ada keluhan spesifik otologi.";
      return cc ? `Keluhan utama: ${cc}. ${summary}` : summary;
    },
    objective: (ctx) => {
      const e = ctx.examination;
      const items: string[] = [];
      if (e["serumen-obstruktif"]) items.push("serumen obstruktif >50% oklusi");
      if (e["serumen-total"]) items.push("serumen total occluding (MT tidak tampak)");
      if (e["perforasi-tampak"]) items.push("PERFORASI MT tampak (KONTRA IRIGASI)");
      if (e["oe-inflamasi"]) items.push("otitis eksterna aktif");
      if (e["trauma-liang"]) items.push("abrasi ringan liang");
      if (e["bilateral"]) items.push("bilateral");
      const head =
        items.length > 0
          ? `Otoskopi: ${items.join(", ")}.`
          : "Otoskopi: liang bersih, MT intak, refleks cahaya normal.";
      const cons = ctx.scoring["consistency"]?.result.interpretation;
      const safe = ctx.scoring["irrigation-safety"]?.result.interpretation;
      const lines = [head];
      if (cons) lines.push(`Konsistensi: ${cons}.`);
      if (safe && (ctx.scoring["irrigation-safety"]?.result.total ?? 0) > 0)
        lines.push(`Safety: ${safe}`);
      return lines.join(" ");
    },
    assessment: (ctx) => {
      const dx = ctx.diagnoses[0]?.icd10Code ?? "H61.2";
      const bilat = ctx.examination["bilateral"] ? " (bilateral)" : "";
      const contra =
        (ctx.scoring["irrigation-safety"]?.result.total ?? 0) >= 1
          ? " · perlu hindari irigasi (kontraindikasi)"
          : "";
      return `${dx} Impacted cerumen${bilat}${contra}.`;
    },
    plan: (ctx) => {
      const t = ctx.treatments;
      const lines: string[] = [];
      if (t["ekstraksi-irigasi"]) lines.push("Ekstraksi serumen via irigasi (96.52)");
      if (t["ekstraksi-kuret"]) lines.push("Ekstraksi serumen via kuretase kering (96.52)");
      if (t["ekstraksi-suction"])
        lines.push("Ekstraksi serumen via mikrosuction otomikroskop (96.52)");
      if (t["softener-docusate"])
        lines.push("Resep softener docusate 5% 2× sehari × 3 hari — kontrol untuk ekstraksi");
      if (t["oe-topikal"]) lines.push("Ofloksasin 0.3% 2× sehari × 5–7 hari");
      if (t["audiometri-9541"]) lines.push("Audiometri nada murni (95.41) untuk HL persisten");
      if (t["edukasi-stop-cotton-bud"]) lines.push("Edukasi STOP cotton bud");
      if (t["edukasi-kontrol-3hari"]) lines.push("Kontrol 3 hari (pasca softener)");
      if (t["edukasi-kontrol-7hari"]) lines.push("Kontrol 1 minggu (post-trauma/OE)");
      if (t["edukasi-abd-rutin"]) lines.push("Edukasi ABD bersih rutin 3–6 bulan");
      if (t["rujuk-tht-bila-kompleks"]) lines.push("Rujuk Sp.THT bila gagal ekstraksi");
      if (lines.length === 0) lines.push("Observasi & edukasi; kontrol sesuai kebutuhan");
      return lines.join(". ") + ".";
    },
  },
  references: [
    { label: "AAO-HNS Clinical Practice Guideline: Cerumen Impaction (update 2017)" },
    { label: "PPK PERHATI-KL — Serumen Impaksi" },
    { label: "Cochrane Review 2018 — Ear drops for cerumen" },
    { label: "WHO Ear & Hearing Care training resource (2020)" },
  ],
  patientFacingScreening: {
    id: "serumen-self-check",
    name: "Cek mandiri: telinga buntu karena serumen?",
    description:
      "Isi 5 pertanyaan singkat. Sistem kasih saran apakah perlu ke klinik atau bisa pakai tetes pelunak dulu di rumah.",
    reference: { label: "AAO-HNS — patient information" },
    inputs: [
      {
        type: "yesNo",
        id: "telinga-penuh",
        label: "Telinga terasa penuh / buntu?",
        weightYes: 2,
      },
      {
        type: "yesNo",
        id: "pendengaran-turun",
        label: "Pendengaran satu/dua telinga turun?",
        weightYes: 2,
      },
      {
        type: "yesNo",
        id: "nyeri-hebat",
        label: "Nyeri telinga hebat / demam?",
        weightYes: 3,
      },
      {
        type: "yesNo",
        id: "keluar-cairan",
        label: "Keluar cairan dari telinga?",
        weightYes: 3,
      },
      {
        type: "yesNo",
        id: "pernah-operasi-telinga",
        label: "Pernah operasi telinga / pasang grommet?",
        weightYes: 2,
      },
    ],
    tiers: [
      {
        threshold: 3,
        label: "Ke dokter hari ini",
        recommendation:
          "Ada tanda perlu pemeriksaan (nyeri hebat / cairan / riwayat operasi). Jangan korek sendiri — datang ke klinik.",
      },
      {
        threshold: 2,
        label: "Jadwal kontrol dalam 2–3 hari",
        recommendation:
          "Kemungkinan besar serumen impaksi. Bisa pakai tetes pelunak (docusate / minyak zaitun) 2–3 hari lalu datang untuk ekstraksi.",
      },
      {
        threshold: 0,
        label: "Observasi di rumah",
        recommendation:
          "Tidak ada tanda bahaya. Hindari cotton bud & tunggu 2–3 hari. Datang bila keluhan berlanjut.",
      },
    ],
  },
  monetization: [
    {
      id: "platform-fee",
      type: "platform-fee",
      label: "Platform fee",
      priceIdr: 5_000,
      description:
        "Biaya platform per kunjungan (ditanggung pasien sesuai tier Gratis Selamanya).",
    },
    {
      id: "softener-otc",
      type: "otc-referral",
      label: "Referral OTC: softener telinga",
      partner: "Apotek mitra Salam AI",
      description:
        "QR/code referral ke apotek untuk beli Docusate 5% / minyak zaitun tetes telinga — margin affiliate ~10–15%.",
    },
    {
      id: "audiometri-lab",
      type: "lab-referral",
      label: "Referral lab: audiometri (95.41)",
      partner: "Pusat audiologi mitra",
      description:
        "Bila HL persisten pasca-ekstraksi. Rp 250k per tes, fee referral ~10%.",
    },
    {
      id: "telekonsul-follow-up",
      type: "telekonsul",
      label: "Telekonsul follow-up (cek via foto otoskop)",
      priceIdr: 35_000,
      description:
        "Pasien kirim foto liang telinga → dokter review tanpa datang lagi. Ideal untuk kontrol 3–7 hari.",
    },
    {
      id: "edukasi-pdf",
      type: "edukasi-pdf",
      label: "e-Edukasi: Cara merawat telinga sehat",
      priceIdr: 10_000,
      description:
        "PDF printable 1 halaman + video 90 detik. Upsell ke pasien atau dibagikan gratis sebagai lead magnet klinik.",
    },
  ],
};

export default spec;
