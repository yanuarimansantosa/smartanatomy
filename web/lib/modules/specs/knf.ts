/**
 * Module 9 — Karsinoma Nasofaring / KNF (C11)
 * Reference: PERHATI-KL Konsensus KNF 2020 · NCCN Head & Neck v3.2024 ·
 *            Chen YP et al. Nasopharyngeal carcinoma. Lancet 2019;394:64 ·
 *            WHO Classification Head & Neck Tumours 4th ed (2017)
 *
 * KARAKTER MODUL — RED FLAG-DRIVEN EARLY DETECTION:
 *   KNF endemik di Indonesia (insidens 6-10/100rb, suku Cina-selatan/Karo/
 *   Mandar lebih tinggi). Late presentation = mortalitas tinggi. Modul ini
 *   bukan untuk staging/onkologi — modul ini untuk dokter primer & THT umum
 *   supaya CATCH KNF lebih awal via 7 RED FLAG yang sering disepelekan:
 *
 *   1. Otitis media efusi UNILATERAL pada DEWASA (>40th)        ← #1 missed dx
 *   2. Hidung tersumbat unilateral persisten (>4 minggu)
 *   3. Epistaksis berulang ringan (post-blow nose)
 *   4. Pembesaran KGB leher (level II/V) — sering bilateral
 *   5. Cranial neuropathy (diplopia/CN VI palsy = sinus kavernosus)
 *   6. Sakit kepala retro-orbital persisten
 *   7. Suara serak / disfonia tanpa lesi laring (CN X invasion)
 *
 *   Engine memetakan kombinasi red flag → suspicion score → mandatori biopsi
 *   nasofaring + MRI + rujukan onkologi. NO LLM — semua deterministic.
 */

import type { ModuleSpec, ScoringResult } from "../types";

// ---------------------------------------------------------------------------
// KNF Suspicion Score (custom — derived from PERHATI-KL early detection)
// ---------------------------------------------------------------------------
// Skema: 7 red flag (weight 2 untuk telinga unilateral dewasa & cranial nerve,
// weight 1 untuk lainnya) + risk factor (riwayat keluarga, etnis high-risk).
// Threshold:
//   ≥4  → MANDATORI biopsi nasofaring + MRI
//   2-3 → Nasofaringoskopi + EBV IgA VCA serologi
//   <2  → Observasi 4 minggu, follow-up ulang

const knfSuspicionCompute = (v: Record<string, number>): ScoringResult => {
  const total =
    (v.ome_unilateral_dewasa ?? 0) * 2 +
    (v.hidung_unilateral ?? 0) * 1 +
    (v.epistaksis ?? 0) * 1 +
    (v.kgb_leher ?? 0) * 2 +
    (v.cranial_nerve ?? 0) * 2 +
    (v.headache_retroorbital ?? 0) * 1 +
    (v.disfonia ?? 0) * 1 +
    (v.riwayat_keluarga ?? 0) * 1 +
    (v.etnis_high_risk ?? 0) * 1;

  const sev: ScoringResult["severity"] =
    total >= 4 ? "very-high" : total >= 2 ? "high" : total >= 1 ? "moderate" : "low";

  const interp =
    total >= 4
      ? "MANDATORI: nasofaringoskopi + biopsi nasofaring (21.32) + MRI nasofaring + rujukan Onkologi"
      : total >= 2
        ? "TINGGI: nasofaringoskopi in-clinic + EBV IgA VCA serologi + follow-up 2 minggu"
        : total >= 1
          ? "SEDANG: observasi 4 minggu, edukasi red flag, kontrol ulang dgn evaluasi telinga & KGB"
          : "Risiko rendah — terapi sesuai dx alternatif (rinitis, OME pediatrik)";

  return {
    total,
    severity: sev,
    interpretation: `KNF Suspicion ${total} — ${
      total >= 4 ? "VERY HIGH" : total >= 2 ? "HIGH" : total >= 1 ? "MODERATE" : "LOW"
    }`,
    recommendation: interp,
  };
};

// ---------------------------------------------------------------------------
// Module spec
// ---------------------------------------------------------------------------

const spec: ModuleSpec = {
  id: "knf",
  title: "Karsinoma Nasofaring",
  subspecialty: "Onkologi THT",
  iconName: "scan-search",
  tags: ["C11", "RED FLAG", "Early Detection", "EBV"],

  // EMERGENCY trigger — bukan time-critical, tapi "RED ZONE" untuk catch
  // missed diagnosis. Banner amber muncul kalau OME unilateral dewasa.
  emergencyTriggers: [
    {
      level: "amber",
      title: "RED ZONE: Otitis Media Efusi Unilateral pada Dewasa",
      message:
        "OME unilateral dewasa (>40th) = SUSPECT KNF SAMPAI TERBUKTI TIDAK. " +
        "Wajib nasofaringoskopi + biopsi area Rosenmüller fossa.",
      trigger: (ctx) => !!ctx.anamnesis["ome-unilateral-dewasa"],
      actions: [
        { id: "nasofaringoskopi", label: "Jadwalkan nasofaringoskopi" },
        { id: "biopsi", label: "Order biopsi nasofaring" },
      ],
    },
    {
      level: "red",
      title: "RED ZONE: Cranial Nerve Palsy + Massa Nasofaring",
      message:
        "Diplopia / CN VI palsy + massa nasofaring = invasi sinus kavernosus. " +
        "Stadium lanjut. MRI urgent + rujukan Onkologi Medik + Radioterapi.",
      trigger: (ctx) =>
        !!ctx.anamnesis["cranial-nerve-palsy"] &&
        !!ctx.examination["massa-nasofaring"],
    },
  ],

  diagnoses: [
    {
      icd10Code: "C11.9",
      display: "Karsinoma nasofaring, unspecified",
      defaultPrimary: true,
      isChronic: true,
      reasoning:
        "Default working dx selama belum ada hasil biopsi. Akan di-refine ke C11.0/.1/.2/.3 setelah lokasi tumor jelas.",
    },
    {
      icd10Code: "C11.0",
      display: "C11.0 — Atap nasofaring (superior wall)",
      isChronic: true,
      reasoning: "Dinding superior, sering CN II-VI involvement.",
    },
    {
      icd10Code: "C11.1",
      display: "C11.1 — Dinding posterior nasofaring",
      isChronic: true,
    },
    {
      icd10Code: "C11.2",
      display: "C11.2 — Dinding lateral (Rosenmüller fossa)",
      isChronic: true,
      reasoning:
        "Lokasi paling sering KNF (>80%). Dekat Eustachian tube → OME unilateral.",
    },
    {
      icd10Code: "D10.6",
      display: "D10.6 — Tumor jinak nasofaring (rule-out)",
      isChronic: true,
      reasoning: "Dx alternatif (angiofibroma juvenil pada laki-laki muda).",
    },
    {
      icd10Code: "H68.0",
      display: "H68.0 — Otitis media efusi (sebagai presenting sign)",
      isChronic: false,
      reasoning:
        "Coding tambahan kalau OME jadi presenting symptom — tetap kerjakan workup KNF.",
    },
  ],

  cdssRules: [
    // RULE 1 — OME unilateral dewasa = suspek KNF (#1 missed diagnosis)
    {
      id: "ome-unilateral-dewasa-suspect-knf",
      evaluate: (ctx) => {
        if (!ctx.anamnesis["ome-unilateral-dewasa"]) return null;
        return {
          ruleId: "ome-unilateral-dewasa-suspect-knf",
          level: "danger",
          message:
            "🚨 OME unilateral pada dewasa = suspek KNF. Wajib nasofaringoskopi area " +
            "Rosenmüller fossa. Jangan didx 'OME idiopatik' tanpa singkirkan KNF dulu.",
          reference: {
            label: "PERHATI-KL Konsensus KNF 2020 — Bab Skrining",
          },
          suggestPrimaryIcd10: "C11.9",
          suggestTreatmentIds: ["nasofaringoskopi", "biopsi-nasofaring"],
        };
      },
    },

    // RULE 2 — Trias klasik (hidung+epistaksis+KGB) = workup full
    {
      id: "trias-klasik-knf",
      evaluate: (ctx) => {
        const a = ctx.anamnesis;
        const e = ctx.examination;
        const trias =
          (a["hidung-tersumbat-unilateral"] ?? false) &&
          (a["epistaksis-berulang"] ?? false) &&
          (e["kgb-leher-membesar"] ?? false);
        if (!trias) return null;
        return {
          ruleId: "trias-klasik-knf",
          level: "danger",
          message:
            "Trias klasik KNF terdeteksi (hidung tersumbat unilateral + epistaksis " +
            "berulang + KGB leher). Sensitivitas ~90% untuk KNF stadium II+. " +
            "Wajib biopsi nasofaring + MRI + rujukan Onkologi.",
          reference: {
            label: "Chen YP et al. Lancet 2019;394:64-80",
          },
          suggestPrimaryIcd10: "C11.9",
          suggestTreatmentIds: [
            "biopsi-nasofaring",
            "mri-nasofaring",
            "rujukan-onkologi",
          ],
        };
      },
    },

    // RULE 3 — Cranial neuropathy = stadium lanjut, urgent
    {
      id: "cranial-nerve-stadium-lanjut",
      evaluate: (ctx) => {
        if (!ctx.anamnesis["cranial-nerve-palsy"]) return null;
        return {
          ruleId: "cranial-nerve-stadium-lanjut",
          level: "emergency",
          message:
            "Cranial neuropathy = invasi basis kranii / sinus kavernosus = " +
            "stadium T4. URGENT MRI + rujukan Onkologi Medik + Radioterapi (≤7 hari).",
          reference: { label: "NCCN Head & Neck v3.2024 — NPC-1" },
          suggestPrimaryIcd10: "C11.0",
          suggestTreatmentIds: ["mri-nasofaring", "rujukan-onkologi", "ebv-iga-vca"],
        };
      },
    },

    // RULE 4 — KGB leher dewasa tanpa infeksi jelas
    {
      id: "kgb-leher-isolated-suspect-knf",
      evaluate: (ctx) => {
        const e = ctx.examination;
        if (!e["kgb-leher-membesar"]) return null;
        if (e["faring-hiperemis"] || e["tonsil-membesar"]) return null;
        // KGB tanpa sumber infeksi atas yang jelas → wajib evaluate nasofaring
        return {
          ruleId: "kgb-leher-isolated-suspect-knf",
          level: "warn",
          message:
            "KGB leher membesar tanpa sumber infeksi jelas = wajib evaluasi " +
            "nasofaring & laring (KNF, limfoma, tiroid). Lakukan nasofaringoskopi.",
          reference: { label: "PERHATI-KL Konsensus KNF 2020" },
          suggestTreatmentIds: ["nasofaringoskopi"],
        };
      },
    },

    // RULE 5 — Suspicion score handling
    {
      id: "suspicion-score-very-high",
      evaluate: (ctx) => {
        const sc = ctx.scoring["knf-suspicion"];
        if (!sc || sc.result.severity !== "very-high") return null;
        return {
          ruleId: "suspicion-score-very-high",
          level: "danger",
          message: `${sc.result.interpretation}. ${sc.result.recommendation}`,
          reference: { label: "Engine — KNF Suspicion Score" },
          suggestPrimaryIcd10: "C11.9",
          suggestTreatmentIds: [
            "nasofaringoskopi",
            "biopsi-nasofaring",
            "mri-nasofaring",
            "rujukan-onkologi",
          ],
        };
      },
    },
    {
      id: "suspicion-score-high",
      evaluate: (ctx) => {
        const sc = ctx.scoring["knf-suspicion"];
        if (!sc || sc.result.severity !== "high") return null;
        return {
          ruleId: "suspicion-score-high",
          level: "warn",
          message: `${sc.result.interpretation}. ${sc.result.recommendation}`,
          reference: { label: "Engine — KNF Suspicion Score" },
          suggestTreatmentIds: ["nasofaringoskopi", "ebv-iga-vca"],
        };
      },
    },

    // RULE 6 — Risk factor flag
    {
      id: "risk-factor-flag",
      evaluate: (ctx) => {
        const a = ctx.anamnesis;
        const flagged =
          (a["riwayat-keluarga-knf"] ?? false) || (a["etnis-high-risk"] ?? false);
        if (!flagged) return null;
        return {
          ruleId: "risk-factor-flag",
          level: "info",
          message:
            "Risk factor KNF teridentifikasi (riwayat keluarga atau etnis high-risk: " +
            "Tionghoa selatan, Karo, Mandar). Threshold suspicion lebih rendah — " +
            "lakukan nasofaringoskopi screening tahunan walau gejala minimal.",
          reference: { label: "Bei JX et al. EBV & NPC. Cancer 2010;116:4953" },
        };
      },
    },
  ],

  anamnesis: {
    title: "Anamnesis — RED FLAG KNF",
    helper:
      "Default = NORMAL. Tap red flag yang positif. RED FLAG telinga unilateral " +
      "pada dewasa = #1 missed diagnosis KNF di Indonesia.",
    items: [
      // === RED FLAG (4 items, weight tinggi) ===
      {
        id: "ome-unilateral-dewasa",
        normalLabel: "Tidak ada keluhan telinga unilateral atau pasien <40th",
        abnormalLabel:
          "🚨 Telinga tersumbat / berdengung UNILATERAL pada DEWASA (>40th)",
        tag: "red-flag",
      },
      {
        id: "hidung-tersumbat-unilateral",
        normalLabel: "Hidung lega kedua sisi atau sumbatan bilateral simetris",
        abnormalLabel:
          "🚨 Hidung tersumbat UNILATERAL persisten (>4 minggu)",
        tag: "red-flag",
      },
      {
        id: "epistaksis-berulang",
        normalLabel: "Tidak ada mimisan",
        abnormalLabel:
          "🚨 Epistaksis berulang (sering ringan, post-blow nose / morning blood)",
        tag: "red-flag",
      },
      {
        id: "cranial-nerve-palsy",
        normalLabel: "Tidak ada gangguan saraf kranial",
        abnormalLabel:
          "🚨 Diplopia / strabismus / wajah baal / suara serak (cranial nerve palsy)",
        tag: "red-flag",
      },
      // === Symptoms tambahan ===
      {
        id: "headache-retroorbital",
        normalLabel: "Tidak ada sakit kepala persisten",
        abnormalLabel: "Sakit kepala retro-orbital / verteks persisten",
      },
      {
        id: "disfonia",
        normalLabel: "Suara normal",
        abnormalLabel: "Suara serak tanpa lesi laring (suspect CN X invasion)",
      },
      {
        id: "trismus",
        normalLabel: "Buka mulut normal (>3 jari)",
        abnormalLabel: "Trismus (buka mulut <3 jari) — invasi otot pterygoid",
      },
      {
        id: "berat-badan-turun",
        normalLabel: "Berat badan stabil",
        abnormalLabel: "Penurunan berat badan >5% dalam 3 bulan",
      },
      // === Risk factors ===
      {
        id: "riwayat-keluarga-knf",
        normalLabel: "Tidak ada riwayat keluarga kanker nasofaring",
        abnormalLabel: "Riwayat keluarga KNF (orangtua/saudara kandung)",
      },
      {
        id: "etnis-high-risk",
        normalLabel: "Etnis bukan high-risk untuk KNF",
        abnormalLabel:
          "Etnis high-risk (Tionghoa selatan / Karo Sumut / Mandar Sulbar)",
      },
      {
        id: "merokok-aktif",
        normalLabel: "Tidak merokok atau berhenti >5 tahun",
        abnormalLabel: "Perokok aktif (>10 batang/hari)",
      },
      {
        id: "konsumsi-ikan-asin",
        normalLabel: "Konsumsi ikan asin tidak rutin",
        abnormalLabel: "Konsumsi ikan asin / makanan diawetkan rutin sejak kecil",
      },
    ],
  },

  examination: {
    title: "Pemeriksaan Fisik — Fokus KGB Leher + Endoskopi Nasofaring",
    helper:
      "Wajib palpasi KGB leher (level I-V bilateral). Nasofaringoskopi rigid/" +
      "flexible kalau tersedia — fokus area Rosenmüller fossa & atap nasofaring.",
    items: [
      // === KGB & neck ===
      {
        id: "kgb-leher-membesar",
        normalLabel: "KGB leher tidak teraba",
        abnormalLabel: "KGB leher membesar (level II/V) — keras, mobile/fixed",
      },
      {
        id: "kgb-bilateral",
        normalLabel: "KGB unilateral atau tidak ada",
        abnormalLabel: "KGB bilateral — pola tipikal KNF",
      },
      {
        id: "kgb-fixed",
        normalLabel: "KGB mobile",
        abnormalLabel: "KGB fixed / matted — invasi ke jaringan sekitar",
      },
      // === Hidung ===
      {
        id: "massa-nasofaring",
        normalLabel: "Nasofaring bersih (rinoskopi posterior / endoskopi)",
        abnormalLabel: "Massa di nasofaring (Rosenmüller fossa / atap / dinding)",
      },
      {
        id: "darah-nasofaring",
        normalLabel: "Tidak ada darah / krusta di nasofaring",
        abnormalLabel: "Darah / krusta di nasofaring",
      },
      // === Telinga (untuk konfirmasi OME) ===
      {
        id: "membran-timpani-suram",
        normalLabel: "Membran timpani normal kedua sisi",
        abnormalLabel:
          "Membran timpani suram / retraksi / air-fluid level UNILATERAL",
      },
      // === Mata & saraf kranial ===
      {
        id: "diplopia-objektif",
        normalLabel: "Gerakan bola mata normal",
        abnormalLabel: "Diplopia / CN VI palsy (strabismus konvergen)",
      },
      {
        id: "wajah-asimetris",
        normalLabel: "Wajah simetris",
        abnormalLabel: "Wajah asimetris (CN V/VII palsy)",
      },
      // === Konfounders untuk CDSS ===
      {
        id: "faring-hiperemis",
        normalLabel: "Faring tidak hiperemis (eksklusi infeksi atas)",
        abnormalLabel: "Faring hiperemis (infeksi akut sebagai konfounder)",
      },
      {
        id: "tonsil-membesar",
        normalLabel: "Tonsil tidak membesar",
        abnormalLabel: "Tonsil membesar / detritus (eksklusi tonsilitis sumber KGB)",
      },
    ],
  },

  scoring: [
    {
      id: "knf-suspicion",
      name: "KNF Suspicion Score",
      description:
        "Custom screening score untuk dokter primer & THT umum. 7 red flag + " +
        "2 risk factor. Threshold: ≥4 = mandatori biopsi, 2-3 = workup, <2 = " +
        "observasi 4 minggu.",
      reference: {
        label: "PERHATI-KL Konsensus KNF 2020 (early detection schema)",
      },
      inputs: [
        {
          type: "yesNo",
          id: "ome_unilateral_dewasa",
          label: "OME unilateral pada pasien >40th? (weight 2)",
        },
        {
          type: "yesNo",
          id: "hidung_unilateral",
          label: "Hidung tersumbat unilateral >4 minggu? (weight 1)",
        },
        {
          type: "yesNo",
          id: "epistaksis",
          label: "Epistaksis berulang (terutama post-blow)? (weight 1)",
        },
        {
          type: "yesNo",
          id: "kgb_leher",
          label: "KGB leher level II/V membesar? (weight 2)",
        },
        {
          type: "yesNo",
          id: "cranial_nerve",
          label: "Cranial neuropathy (CN III-X)? (weight 2)",
        },
        {
          type: "yesNo",
          id: "headache_retroorbital",
          label: "Sakit kepala retro-orbital persisten? (weight 1)",
        },
        {
          type: "yesNo",
          id: "disfonia",
          label: "Disfonia tanpa lesi laring? (weight 1)",
        },
        {
          type: "yesNo",
          id: "riwayat_keluarga",
          label: "Riwayat keluarga KNF? (weight 1)",
        },
        {
          type: "yesNo",
          id: "etnis_high_risk",
          label: "Etnis high-risk (Cina selatan/Karo/Mandar)? (weight 1)",
        },
      ],
      compute: knfSuspicionCompute,
    },
  ],

  pathway: [
    {
      id: "step-1-anamnesis-redflag",
      title: "1. Anamnesis fokus 7 RED FLAG KNF",
      detail:
        "Tap red flag yang positif. Special attention: telinga unilateral pada " +
        "dewasa & cranial nerve symptoms.",
    },
    {
      id: "step-2-exam-kgb",
      title: "2. Pemeriksaan KGB leher level I-V bilateral",
      detail:
        "Palpasi sistematis. Note ukuran, konsistensi, mobile/fixed, bilateral?",
    },
    {
      id: "step-3-nasofaringoskopi",
      title: "3. Nasofaringoskopi (rigid/flexible) — area Rosenmüller fossa",
      detail:
        "WAJIB kalau KGB leher (+) atau OME unilateral dewasa. Foto/video " +
        "untuk dokumentasi & rujukan.",
    },
    {
      id: "step-4-biopsi",
      title: "4. Biopsi nasofaring (ICD-9 21.32) kalau tampak massa",
      detail:
        "Gold standard. Lakukan in-clinic kalau lokasi mudah, atau rujuk OK " +
        "kalau membutuhkan general anestesi.",
    },
    {
      id: "step-5-imaging",
      title: "5. MRI nasofaring + leher (T1+T2+contrast)",
      detail:
        "Gold standard imaging untuk extent tumor. CT alternatif kalau MRI " +
        "tidak tersedia (kurang sensitif untuk soft tissue).",
    },
    {
      id: "step-6-staging-rujukan",
      title: "6. Staging AJCC + rujukan Onkologi Medik & Radioterapi",
      detail:
        "Stage I → radioterapi tunggal. Stage II-IVA → chemoradiation cisplatin. " +
        "Stage IVB → paliasi sistemik.",
    },
    {
      id: "step-7-edukasi-keluarga",
      title: "7. Edukasi keluarga & screening kontak",
      detail:
        "First-degree relative pasien KNF wajib screening (nasofaringoskopi + " +
        "EBV IgA VCA tahunan).",
    },
  ],

  treatments: [
    // === Diagnostik ===
    {
      id: "nasofaringoskopi",
      label: "Nasofaringoskopi (rigid/flexible) in-clinic",
      category: "tindakan",
      icd9Code: "21.21",
      icd9NameId: "Rinoskopi",
      feeIdr: 350000,
      isOperative: false,
      defaultSelected: true,
      reference: { label: "PERHATI-KL Konsensus KNF 2020" },
    },
    {
      id: "biopsi-nasofaring",
      label: "Biopsi nasofaring (in-clinic atau OK)",
      category: "tindakan",
      icd9Code: "21.32",
      icd9NameId: "Biopsi tumor jinak nasofaring",
      feeIdr: 1500000,
      isOperative: true,
      reference: { label: "PERHATI-KL Konsensus KNF 2020" },
    },
    {
      id: "ebv-iga-vca",
      label: "EBV IgA VCA + EA-D serologi (lab referral)",
      category: "tindakan",
      feeIdr: 450000,
      isOperative: false,
      reference: {
        label: "Chen YP et al. Lancet 2019 — EBV serology screening utility",
      },
    },
    {
      id: "mri-nasofaring",
      label: "MRI nasofaring + leher (T1+T2+contrast) — radiologi rujukan",
      category: "tindakan",
      feeIdr: 2500000,
      isOperative: false,
      reference: { label: "NCCN Head & Neck v3.2024 — NPC-A" },
    },
    {
      id: "ct-nasofaring",
      label: "CT scan nasofaring + leher (alternatif kalau MRI tidak tersedia)",
      category: "tindakan",
      icd9Code: "87.03",
      icd9NameId: "CT scan kepala",
      feeIdr: 1200000,
      isOperative: false,
    },

    // === Edukasi sebelum rujukan ===
    {
      id: "edukasi-pre-rujukan",
      label: "Edukasi pasien & keluarga (proses workup, kemungkinan dx, prognosis)",
      category: "edukasi",
      defaultSelected: true,
    },
    {
      id: "edukasi-screening-keluarga",
      label: "Edukasi screening first-degree relatives (nasofaringoskopi tahunan)",
      category: "edukasi",
    },
    {
      id: "edukasi-stop-merokok",
      label: "Edukasi stop merokok & hindari ikan asin diawetkan",
      category: "edukasi",
    },

    // === Simptomatik (tidak menunda workup!) ===
    {
      id: "miringotomi-grommet",
      label: "Miringotomi + grommet untuk OME persisten (PALIATIF — TIDAK " +
        "menunda workup KNF)",
      category: "tindakan",
      icd9Code: "20.09",
      icd9NameId: "Miringotomi dengan insersi tube",
      feeIdr: 2500000,
      isOperative: true,
      reference: {
        label: "PERHATI-KL — peringatan: miringotomi tanpa workup nasofaring " +
          "= malpraktek pada dewasa OME unilateral",
      },
    },

    // === Rujukan ===
    {
      id: "rujukan-onkologi",
      label: "Rujukan Sp.Onkologi Medik + Sp.Radioterapi (chemoradiation team)",
      category: "rujukan",
      defaultSelected: false,
    },
    {
      id: "rujukan-tht-onkologi",
      label: "Rujukan Sp.THT-KL Subsp. Onkologi (kalau biopsi tidak bisa di-clinic)",
      category: "rujukan",
    },
    {
      id: "rujukan-konseling-genetik",
      label: "Rujukan Konseling Genetik (riwayat keluarga + etnis high-risk)",
      category: "rujukan",
    },
  ],

  education: {
    title: "Edukasi Pasien — Karsinoma Nasofaring",
    bullets: [
      "Karsinoma nasofaring (KNF) adalah kanker yang muncul di belakang hidung. Endemik di Indonesia — bukan penyakit langka.",
      "Gejala dini sering ringan & menyamar: telinga tersumbat satu sisi, mimisan ringan, hidung mampet sebelah, atau benjolan di leher.",
      "Penyebab pasti belum jelas, tapi terkait virus EBV, faktor genetik (riwayat keluarga, etnis tertentu), dan konsumsi makanan diawetkan sejak kecil.",
      "Diagnosis ditegakkan dengan biopsi (mengambil jaringan kecil dari nasofaring). Imaging (MRI) untuk lihat luas tumor.",
      "Pengobatan utama: radioterapi (untuk stadium awal) atau gabungan kemoterapi + radioterapi (stadium lanjut). Bukan operasi.",
      "Prognosis SANGAT BAIK kalau ditemukan stadium awal: angka kesembuhan stadium I-II bisa >80%. Kunci = deteksi dini.",
      "Keluarga inti (orang tua, saudara kandung, anak) sebaiknya screening tahunan kalau ada riwayat KNF di keluarga.",
      "Stop merokok & kurangi konsumsi ikan asin / makanan diawetkan untuk pencegahan jangka panjang.",
    ],
    channels: ["print", "wa"],
  },

  soapMapping: {
    subjective: (ctx) => {
      const a = ctx.anamnesis;
      const flags: string[] = [];
      if (a["ome-unilateral-dewasa"])
        flags.push("telinga unilateral persisten pada dewasa (RED FLAG)");
      if (a["hidung-tersumbat-unilateral"])
        flags.push("hidung tersumbat unilateral >4 minggu (RED FLAG)");
      if (a["epistaksis-berulang"])
        flags.push("epistaksis berulang (RED FLAG)");
      if (a["cranial-nerve-palsy"])
        flags.push("cranial neuropathy (RED FLAG — stadium lanjut)");
      if (a["headache-retroorbital"])
        flags.push("sakit kepala retro-orbital persisten");
      if (a["disfonia"]) flags.push("disfonia");
      if (a["trismus"]) flags.push("trismus");
      if (a["berat-badan-turun"]) flags.push("BB turun >5% dalam 3 bulan");

      const risk: string[] = [];
      if (a["riwayat-keluarga-knf"]) risk.push("riwayat keluarga KNF (+)");
      if (a["etnis-high-risk"]) risk.push("etnis high-risk");
      if (a["merokok-aktif"]) risk.push("perokok aktif");
      if (a["konsumsi-ikan-asin"])
        risk.push("riwayat konsumsi ikan asin sejak kecil");

      const cc = ctx.chiefComplaint || "evaluasi gejala THT persisten";
      const flagText = flags.length
        ? `Red flag: ${flags.join("; ")}.`
        : "Tidak ada red flag KNF spesifik.";
      const riskText = risk.length
        ? ` Risiko: ${risk.join("; ")}.`
        : "";
      return `${cc}. ${flagText}${riskText}`;
    },
    objective: (ctx) => {
      const e = ctx.examination;
      const findings: string[] = [];
      if (e["kgb-leher-membesar"]) {
        let kgb = "KGB leher level II/V membesar";
        if (e["kgb-bilateral"]) kgb += " bilateral";
        if (e["kgb-fixed"]) kgb += ", fixed/matted";
        else kgb += ", mobile";
        findings.push(kgb);
      }
      if (e["massa-nasofaring"])
        findings.push("massa di nasofaring (Rosenmüller fossa / atap)");
      if (e["darah-nasofaring"]) findings.push("darah/krusta di nasofaring");
      if (e["membran-timpani-suram"])
        findings.push("MT suram/retraksi UNILATERAL (OME unilateral)");
      if (e["diplopia-objektif"]) findings.push("CN VI palsy (diplopia objektif)");
      if (e["wajah-asimetris"]) findings.push("CN V/VII palsy (wajah asimetris)");

      const score = ctx.scoring["knf-suspicion"]?.result;
      const scoreText = score
        ? ` KNF Suspicion Score ${score.total} (${score.severity}).`
        : "";

      return findings.length
        ? `${findings.join("; ")}.${scoreText}`
        : `Tidak ada temuan fisik signifikan.${scoreText}`;
    },
    assessment: (ctx) => {
      const primary = ctx.diagnoses.find((d) => d.primary);
      const score = ctx.scoring["knf-suspicion"]?.result;
      const sev = score?.severity ?? "low";

      let workingDx = "Suspek karsinoma nasofaring (C11.9)";
      if (primary) workingDx = `${primary.icd10Code} (working dx)`;

      let stage = "";
      if (sev === "very-high") stage = " — Suspicion VERY HIGH, mandatori workup biopsi+MRI";
      else if (sev === "high") stage = " — Suspicion HIGH, workup nasofaringoskopi+EBV";
      else if (sev === "moderate") stage = " — Suspicion MODERATE, observasi 4 minggu";

      return `${workingDx}${stage}.`;
    },
    plan: (ctx) => {
      const t = ctx.treatments;
      const items: string[] = [];

      if (t["nasofaringoskopi"]) items.push("Nasofaringoskopi in-clinic (21.21)");
      if (t["biopsi-nasofaring"]) items.push("Biopsi nasofaring (21.32)");
      if (t["ebv-iga-vca"]) items.push("EBV IgA VCA + EA-D serologi");
      if (t["mri-nasofaring"]) items.push("MRI nasofaring + leher (kontras)");
      else if (t["ct-nasofaring"]) items.push("CT scan nasofaring + leher");

      if (t["miringotomi-grommet"])
        items.push("Miringotomi + grommet (PALIATIF, tidak menunda workup KNF)");

      const edu: string[] = [];
      if (t["edukasi-pre-rujukan"]) edu.push("edukasi pre-rujukan");
      if (t["edukasi-screening-keluarga"]) edu.push("screening keluarga");
      if (t["edukasi-stop-merokok"]) edu.push("stop merokok & hindari ikan asin");
      if (edu.length) items.push(`Edukasi: ${edu.join(", ")}`);

      const ruj: string[] = [];
      if (t["rujukan-onkologi"]) ruj.push("Sp.Onkologi Medik + Sp.Radioterapi");
      if (t["rujukan-tht-onkologi"]) ruj.push("Sp.THT-KL Subsp.Onkologi");
      if (t["rujukan-konseling-genetik"]) ruj.push("Konseling Genetik");
      if (ruj.length) items.push(`Rujukan: ${ruj.join("; ")}`);

      return items.length
        ? items.join(". ") + "."
        : "Tidak ada plan tertulis.";
    },
  },

  references: [
    {
      label: "PERHATI-KL Konsensus Karsinoma Nasofaring 2020",
    },
    {
      label: "NCCN Clinical Practice Guidelines — Head & Neck v3.2024 (NPC)",
    },
    {
      label: "Chen YP et al. Nasopharyngeal carcinoma. Lancet 2019;394:64-80",
    },
    {
      label: "WHO Classification of Head & Neck Tumours 4th ed (2017)",
    },
    {
      label: "Bei JX et al. EBV and nasopharyngeal carcinoma. Cancer 2010;116:4953",
    },
  ],
};

export default spec;
