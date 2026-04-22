/**
 * Module 10 — Tuli Kongenital / Congenital Hearing Loss (H90.x)
 * Reference: JCIH 2019 Position Statement · AAP/Bright Futures 2024 ·
 *            PERHATI-KL Panduan Skrining Pendengaran Bayi 2019 ·
 *            Kemenkes RI Pedoman SHDI (Skrining Pendengaran & Deteksi Dini) 2023 ·
 *            WHO World Report on Hearing 2021 · NICE NG98 (paediatric hearing)
 *
 * KARAKTER MODUL — GOLDEN PERIOD <6 BULAN:
 *   Tuli kongenital (bilateral sensorineural >40 dB) terjadi pada ~1-3 per 1000
 *   kelahiran di Indonesia. Golden period intervensi = <6 bulan usia (JCIH "1-3-6"):
 *
 *     1-mo → universal newborn hearing screening (OAE pass/refer)
 *     3-mo → diagnostic ABR + AABR konfirmasi kalau refer
 *     6-mo → intervensi (hearing aid, cochlear implant eval, speech therapy)
 *
 *   Late identification = permanent deficit bahasa/kognitif. Modul ini untuk
 *   dokter primer, SpA, & THT umum → tap risk factor → mandatori OAE/AABR →
 *   rujuk pediatric audiology sebelum usia 3 bulan. NO LLM.
 */

import type { ModuleSpec, ScoringResult } from "../types";

// ---------------------------------------------------------------------------
// JCIH Risk Register Score (derived from JCIH 2019 Risk Indicators)
// ---------------------------------------------------------------------------
// 12 risk indicator JCIH 2019. Setiap (+) = 1 poin. Threshold:
//   ≥3  → high-risk, targeted screening + follow-up 6-bulanan
//   1-2 → moderate, AABR wajib + follow-up 12-bulanan
//   0   → universal screening cukup (OAE)

const jcihRiskCompute = (v: Record<string, number>): ScoringResult => {
  const total =
    (v.nicu_5d ?? 0) +
    (v.ecmo_or_ventilator ?? 0) +
    (v.hyperbilirubinemia_exchange ?? 0) +
    (v.ototoxic_drug ?? 0) +
    (v.birth_asphyxia ?? 0) +
    (v.congenital_infection ?? 0) +
    (v.craniofacial ?? 0) +
    (v.family_history ?? 0) +
    (v.syndromic ?? 0) +
    (v.neurodegenerative ?? 0) +
    (v.head_trauma ?? 0) +
    (v.postnatal_meningitis ?? 0);

  const sev: ScoringResult["severity"] =
    total >= 3 ? "very-high" : total >= 1 ? "high" : "low";

  const interp =
    total >= 3
      ? "HIGH-RISK: targeted diagnostic ABR + follow-up audiologi 6-bulanan sampai 3 tahun"
      : total >= 1
        ? "MODERATE: AABR wajib (bukan hanya OAE), follow-up 12-bulanan"
        : "LOW: universal newborn hearing screening (OAE) sesuai protokol";

  return {
    total,
    severity: sev,
    interpretation: `JCIH Risk Register ${total}/12 — ${
      total >= 3 ? "HIGH-RISK" : total >= 1 ? "MODERATE" : "LOW"
    }`,
    recommendation: interp,
  };
};

// ---------------------------------------------------------------------------
// Age-at-presentation computer (untuk flag golden period)
// ---------------------------------------------------------------------------
// Input: usia bayi dalam bulan (scale 0-36).
// Tier:
//   <=3 bln  → GOLDEN — cepat workup
//   4-6 bln  → LATE tapi masih intervenable
//   7-12 bln → DELAYED — defisit bahasa mulai
//   >12 bln  → VERY LATE — comprehensive rehab

const agePresentationCompute = (v: Record<string, number>): ScoringResult => {
  const age = v.age_months ?? 0;
  const sev: ScoringResult["severity"] =
    age <= 3 ? "low" : age <= 6 ? "moderate" : age <= 12 ? "high" : "very-high";

  const interp =
    age <= 3
      ? "GOLDEN PERIOD — konfirmasi dx <3 bulan, intervensi <6 bulan"
      : age <= 6
        ? "Masih dalam window intervensi — accelerate workup, jangan wait-and-see"
        : age <= 12
          ? "Defisit bahasa mulai; intervensi komprehensif (HA + speech therapy)"
          : "Very late — evaluasi koklear implan + rehabilitasi bahasa intensif";

  return {
    total: age,
    severity: sev,
    interpretation: `Usia saat presentasi ${age} bulan`,
    recommendation: interp,
  };
};

// ---------------------------------------------------------------------------
// Module spec
// ---------------------------------------------------------------------------

const spec: ModuleSpec = {
  id: "tuli-kongenital",
  title: "Tuli Kongenital",
  subspecialty: "Otologi / Audiologi Pediatrik",
  iconName: "ear-off",
  tags: ["H90", "JCIH 1-3-6", "Newborn Screening", "Golden Period"],

  emergencyTriggers: [
    {
      level: "red",
      title: "WINDOW INTERVENSI TERTUTUP — usia >12 bulan, belum intervensi",
      message:
        "Bayi/anak >12 bulan tanpa intervensi audiologi. Defisit bahasa permanen " +
        "kemungkinan terjadi. RUJUK URGENT ke pediatric audiology + speech-language " +
        "pathologist untuk evaluasi koklear implan.",
      trigger: (ctx) =>
        !!ctx.anamnesis["usia-lebih-12-bulan"] &&
        !ctx.anamnesis["sudah-pakai-hearing-aid"],
      actions: [
        { id: "rujukan-audiologi", label: "Rujuk audiologi pediatrik" },
        { id: "rujukan-speech", label: "Rujuk terapi wicara" },
      ],
    },
    {
      level: "amber",
      title: "GOLDEN PERIOD: Bayi belum lulus OAE — workup segera",
      message:
        "OAE refer = belum lulus screening. Wajib AABR konfirmasi <3 bulan usia " +
        "untuk dapat diagnosis & intervensi sebelum 6 bulan (JCIH 1-3-6).",
      trigger: (ctx) => !!ctx.examination["oae-refer-bilateral"],
      actions: [
        { id: "aabr-diagnostic", label: "Order AABR diagnostic" },
        { id: "rujukan-audiologi", label: "Rujuk audiologi pediatrik" },
      ],
    },
  ],

  diagnoses: [
    {
      icd10Code: "H90.3",
      display: "H90.3 — Tuli sensorineural bilateral",
      defaultPrimary: true,
      isChronic: true,
      reasoning: "Pola paling sering untuk tuli kongenital (genetik, TORCH, NICU).",
    },
    {
      icd10Code: "H90.5",
      display: "H90.5 — Tuli sensorineural unilateral",
      isChronic: true,
      reasoning:
        "Unilateral masih perlu intervensi: risiko gangguan lokalisasi suara & bahasa 2x lebih tinggi dari normal.",
    },
    {
      icd10Code: "H90.0",
      display: "H90.0 — Tuli konduktif bilateral",
      isChronic: true,
      reasoning:
        "Suspek atresia aurikula / mikrotia bilateral, OME persisten, malformasi osikular.",
    },
    {
      icd10Code: "H90.2",
      display: "H90.2 — Tuli konduktif unilateral",
      isChronic: true,
    },
    {
      icd10Code: "H90.6",
      display: "H90.6 — Tuli campuran (konduktif + sensorineural) bilateral",
      isChronic: true,
    },
    {
      icd10Code: "H91.3",
      display: "H91.3 — Tuli ototoksik (post-aminoglikosida / kemoterapi)",
      isChronic: true,
      reasoning: "Wajib dibedakan dari kongenital untuk pelaporan & compensation.",
    },
    {
      icd10Code: "Z01.10",
      display: "Z01.10 — Skrining pendengaran (screening saja, hasil pass)",
      reasoning: "Untuk visit yang hanya skrining newborn tanpa temuan.",
    },
  ],

  cdssRules: [
    // RULE 1 — NICU >5 hari = high risk JCIH #1
    {
      id: "nicu-high-risk",
      evaluate: (ctx) => {
        if (!ctx.anamnesis["nicu-lebih-5-hari"]) return null;
        return {
          ruleId: "nicu-high-risk",
          level: "warn",
          message:
            "NICU >5 hari = JCIH Risk Indicator #1. OAE saja TIDAK CUKUP — " +
            "wajib AABR diagnostic karena risiko auditory neuropathy spectrum disorder (ANSD) lebih tinggi.",
          reference: { label: "JCIH 2019 Position Statement — Risk Indicators" },
          suggestTreatmentIds: ["aabr-diagnostic", "rujukan-audiologi"],
        };
      },
    },

    // RULE 2 — Family history = sindromik atau non-sindromik GJB2
    {
      id: "family-history-genetic",
      evaluate: (ctx) => {
        if (!ctx.anamnesis["riwayat-keluarga-tuli"]) return null;
        return {
          ruleId: "family-history-genetic",
          level: "info",
          message:
            "Riwayat keluarga tuli permanen = kemungkinan non-sindromik (GJB2/Connexin-26 paling sering di Indonesia) atau sindromik (Pendred, Usher, Waardenburg). " +
            "Tawarkan konseling genetik + pemeriksaan GJB2 sequencing kalau tersedia.",
          reference: {
            label: "Bitner-Glindzicz M. GJB2 mutations. Br Med Bull 2002;63:73",
          },
          suggestTreatmentIds: ["rujukan-konseling-genetik"],
        };
      },
    },

    // RULE 3 — TORCH / CMV = most common non-genetic cause
    {
      id: "congenital-cmv-screening",
      evaluate: (ctx) => {
        if (!ctx.anamnesis["infeksi-kongenital"]) return null;
        return {
          ruleId: "congenital-cmv-screening",
          level: "warn",
          message:
            "Infeksi kongenital TORCH — CMV adalah penyebab non-genetik #1 tuli kongenital (progresif, bisa muncul setelah newborn screening pass). " +
            "Wajib CMV PCR urin (kalau <21 hari) atau dried blood spot PCR. Late-onset progression → follow-up audiologi 6-bulanan minimal sampai 3 tahun.",
          reference: {
            label: "Goderis J et al. Hearing loss & congenital CMV. Pediatrics 2014;134:972",
          },
          suggestTreatmentIds: ["aabr-diagnostic", "cmv-pcr"],
        };
      },
    },

    // RULE 4 — OAE refer bilateral = mandatori workup
    {
      id: "oae-refer-bilateral",
      evaluate: (ctx) => {
        if (!ctx.examination["oae-refer-bilateral"]) return null;
        return {
          ruleId: "oae-refer-bilateral",
          level: "danger",
          message:
            "OAE refer bilateral — wajib AABR diagnostic dalam 3 bulan usia (JCIH '1-3-6'). " +
            "Jangan re-screen ulang sebagai satu-satunya langkah; re-screen boleh tapi paralel dengan AABR.",
          reference: { label: "JCIH 2019 — Diagnostic Timeline" },
          suggestPrimaryIcd10: "H90.3",
          suggestTreatmentIds: ["aabr-diagnostic", "rujukan-audiologi"],
        };
      },
    },

    // RULE 5 — Craniofacial anomaly = konduktif kemungkinan besar
    {
      id: "craniofacial-conductive",
      evaluate: (ctx) => {
        const e = ctx.examination;
        if (!e["mikrotia-atresia"] && !e["kraniofasial-anomali"]) return null;
        return {
          ruleId: "craniofacial-conductive",
          level: "warn",
          message:
            "Anomali kraniofasial / mikrotia-atresia aurikula → tuli konduktif kemungkinan. " +
            "CT temporal bone sebelum 1 tahun untuk evaluasi osikular & saraf fasial, BAHA trial bisa dipertimbangkan dari 6 bulan.",
          reference: {
            label: "Roberson JB. Bone-anchored hearing aid. Otolaryngol Clin North Am 2014;47:923",
          },
          suggestPrimaryIcd10: "H90.0",
          suggestTreatmentIds: ["ct-temporal-bone", "rujukan-audiologi"],
        };
      },
    },

    // RULE 6 — Risk score very-high
    {
      id: "jcih-score-very-high",
      evaluate: (ctx) => {
        const sc = ctx.scoring["jcih-risk"];
        if (!sc || sc.result.severity !== "very-high") return null;
        return {
          ruleId: "jcih-score-very-high",
          level: "danger",
          message: `${sc.result.interpretation}. ${sc.result.recommendation}`,
          reference: { label: "Engine — JCIH Risk Register" },
          suggestTreatmentIds: [
            "aabr-diagnostic",
            "rujukan-audiologi",
            "follow-up-6bulan",
          ],
        };
      },
    },

    // RULE 7 — Golden period window
    {
      id: "late-presentation-urgent",
      evaluate: (ctx) => {
        const sc = ctx.scoring["age-presentation"];
        if (!sc) return null;
        if (sc.result.severity === "low") return null;
        const level =
          sc.result.severity === "very-high"
            ? "emergency"
            : sc.result.severity === "high"
              ? "danger"
              : "warn";
        return {
          ruleId: "late-presentation-urgent",
          level,
          message: sc.result.recommendation ?? sc.result.interpretation,
          reference: { label: "JCIH 2019 — '1-3-6' Timeline" },
        };
      },
    },

    // RULE 8 — Usia >12 bln & belum intervensi
    {
      id: "language-deprivation-risk",
      evaluate: (ctx) => {
        const a = ctx.anamnesis;
        if (!a["usia-lebih-12-bulan"]) return null;
        if (a["sudah-pakai-hearing-aid"]) return null;
        return {
          ruleId: "language-deprivation-risk",
          level: "emergency",
          message:
            "Anak >12 bulan tanpa amplifikasi — risiko permanent language deprivation. " +
            "Accelerate: ABR + BERA urgent, fitting hearing aid segera walau sambil tunggu konfirmasi koklear implan.",
          reference: {
            label: "Yoshinaga-Itano C. Early identification & language outcome. Pediatrics 1998;102:1161",
          },
          suggestTreatmentIds: [
            "aabr-diagnostic",
            "hearing-aid-trial",
            "rujukan-audiologi",
            "rujukan-speech",
          ],
        };
      },
    },
  ],

  anamnesis: {
    title: "Anamnesis — JCIH Risk Register + Riwayat Kehamilan/Perinatal",
    helper:
      "Default = NORMAL (bayi low-risk). Tap indikator risiko yang positif. " +
      "Tanya orangtua secara spesifik: reaksi bayi ke suara kencang, bereaksi ke nama, " +
      "babbling 6-9 bulan, kata pertama 12 bulan.",
    items: [
      // === JCIH Risk Indicators (12) ===
      {
        id: "nicu-lebih-5-hari",
        normalLabel: "Tidak pernah NICU / NICU <5 hari",
        abnormalLabel: "NICU >5 hari (JCIH #1)",
        tag: "jcih-risk",
      },
      {
        id: "ecmo-ventilator",
        normalLabel: "Tidak pakai ECMO / ventilator prolonged",
        abnormalLabel: "ECMO atau ventilator >5 hari",
        tag: "jcih-risk",
      },
      {
        id: "hiperbilirubinemia-exchange",
        normalLabel: "Tidak ada hiperbilirubinemia berat / tidak perlu transfusi tukar",
        abnormalLabel:
          "Hiperbilirubinemia berat (perlu transfusi tukar atau bilirubin >20)",
        tag: "jcih-risk",
      },
      {
        id: "obat-ototoksik",
        normalLabel: "Tidak pernah terima aminoglikosida / platinum / loop diuretik prolonged",
        abnormalLabel:
          "Riwayat aminoglikosida (gentamicin/amikacin) >5 hari atau cisplatin/carboplatin",
        tag: "jcih-risk",
      },
      {
        id: "asfiksia-lahir",
        normalLabel: "Lahir bugar (APGAR 5' ≥7)",
        abnormalLabel: "Asfiksia berat (APGAR 5' <5 atau perlu resusitasi lanjutan)",
        tag: "jcih-risk",
      },
      {
        id: "infeksi-kongenital",
        normalLabel: "Tidak ada infeksi TORCH / CMV kongenital",
        abnormalLabel:
          "Infeksi TORCH kongenital (CMV, rubella, toxoplasma, sifilis, zika)",
        tag: "jcih-risk",
      },
      {
        id: "anomali-kraniofasial-anam",
        normalLabel: "Wajah tampak normal",
        abnormalLabel:
          "Anomali kraniofasial (mikrotia, atresia, cleft palate, sindrom Down/Treacher-Collins/Waardenburg)",
        tag: "jcih-risk",
      },
      {
        id: "riwayat-keluarga-tuli",
        normalLabel: "Tidak ada riwayat tuli permanen di keluarga",
        abnormalLabel:
          "Riwayat tuli permanen pada orangtua/saudara kandung (first-degree)",
        tag: "jcih-risk",
      },
      {
        id: "sindrom-terkait-tuli",
        normalLabel: "Tidak ada diagnosis sindromik",
        abnormalLabel:
          "Sindrom terkait tuli (Usher, Pendred, Waardenburg, Alport, Jervell-Lange-Nielsen)",
        tag: "jcih-risk",
      },
      {
        id: "neurodegeneratif",
        normalLabel: "Perkembangan neurologis normal",
        abnormalLabel: "Penyakit neurodegeneratif (Hunter, Friedreich ataxia, dll)",
        tag: "jcih-risk",
      },
      {
        id: "trauma-kepala",
        normalLabel: "Tidak ada trauma kepala berat",
        abnormalLabel:
          "Riwayat trauma kepala dengan fraktur basis kranii / hilang kesadaran",
        tag: "jcih-risk",
      },
      {
        id: "meningitis-postnatal",
        normalLabel: "Tidak ada riwayat meningitis",
        abnormalLabel: "Meningitis bakterial postnatal (pneumokokal, H. influenzae)",
        tag: "jcih-risk",
      },

      // === Perilaku pasien / observasi orangtua ===
      {
        id: "bereaksi-suara-kencang",
        normalLabel: "Bayi kaget / bereaksi saat ada suara kencang",
        abnormalLabel:
          "Bayi TIDAK bereaksi saat ada suara kencang (misal pintu dibanting)",
      },
      {
        id: "bereaksi-nama",
        normalLabel: "Bayi menoleh saat dipanggil namanya (>6 bulan)",
        abnormalLabel:
          "Bayi tidak menoleh saat dipanggil (usia 6-12 bulan — RED FLAG)",
      },
      {
        id: "babbling-delayed",
        normalLabel: "Babbling / ba-ba-ma-ma mulai usia 6-9 bulan",
        abnormalLabel:
          "Tidak babbling / vokalisasi berkurang pada usia 6-9 bulan",
      },
      {
        id: "kata-pertama-delayed",
        normalLabel: "Kata pertama (mama/papa bermakna) usia 10-14 bulan",
        abnormalLabel:
          "Tidak ada kata pertama sampai usia >15 bulan",
      },

      // === Usia presentasi (untuk golden period flag) ===
      {
        id: "usia-lebih-12-bulan",
        normalLabel: "Usia ≤12 bulan (window intervensi masih terbuka)",
        abnormalLabel: "Usia >12 bulan tanpa intervensi (late presentation)",
      },
      {
        id: "sudah-pakai-hearing-aid",
        normalLabel: "Belum pakai hearing aid",
        abnormalLabel: "Sudah pakai hearing aid / BAHA / CI",
      },
    ],
  },

  examination: {
    title: "Pemeriksaan — OAE/AABR + Otoskopi + Craniofacial Survey",
    helper:
      "Bayi: lakukan OAE (distortion product) sebagai first-tier. Kalau refer " +
      "atau high-risk → AABR. Anak >2 thn: tambah timpanometri + audiometri bermain.",
    items: [
      // === Screening results ===
      {
        id: "oae-refer-bilateral",
        normalLabel: "OAE PASS bilateral (emisi normal kedua telinga)",
        abnormalLabel: "🚨 OAE REFER bilateral (gagal screening kedua sisi)",
      },
      {
        id: "oae-refer-unilateral",
        normalLabel: "Tidak ada OAE refer unilateral",
        abnormalLabel: "OAE REFER unilateral (satu sisi)",
      },
      {
        id: "aabr-abnormal",
        normalLabel: "AABR belum dilakukan atau hasil normal",
        abnormalLabel:
          "🚨 AABR diagnostic: ambang >40 dB (sensorineural loss terkonfirmasi)",
      },

      // === Otoskopi ===
      {
        id: "kanalis-atresia",
        normalLabel: "Kanalis auditorius eksternus paten bilateral",
        abnormalLabel: "Atresia kanalis aurikularis (uni/bilateral)",
      },
      {
        id: "mikrotia-atresia",
        normalLabel: "Aurikula bentuk & ukuran normal",
        abnormalLabel: "Mikrotia / anotia (grade II-IV)",
      },
      {
        id: "membran-timpani-efusi",
        normalLabel: "Membran timpani jernih, refleks cahaya normal",
        abnormalLabel:
          "Membran timpani suram / retraksi / air-fluid level (OME — singkirkan dulu)",
      },

      // === Craniofacial survey ===
      {
        id: "kraniofasial-anomali",
        normalLabel: "Tidak ada anomali wajah",
        abnormalLabel:
          "Anomali kraniofasial (hipertelorisme, white forelock, heterochromia, mandibular hypoplasia)",
      },
      {
        id: "leher-branchial",
        normalLabel: "Tidak ada kista / fistula branchial",
        abnormalLabel:
          "Kista/fistula branchial cleft (suspect Branchio-oto-renal syndrome)",
      },
      {
        id: "mata-sindromik",
        normalLabel: "Mata normal",
        abnormalLabel:
          "Retinitis pigmentosa / koloboma (suspect Usher syndrome)",
      },

      // === Follow-up cues ===
      {
        id: "respons-tes-suara",
        normalLabel:
          "Merespons tes suara sesuai usia (startle reflex, orienting response)",
        abnormalLabel: "Tidak merespons tes suara tingkah laku sesuai usia",
      },
    ],
  },

  scoring: [
    {
      id: "jcih-risk",
      name: "JCIH Risk Register",
      description:
        "12 indikator risiko JCIH 2019. Skor ≥3 = high-risk (butuh targeted " +
        "diagnostic ABR + follow-up 6-bulanan). Skor 1-2 = AABR wajib. 0 = OAE cukup.",
      reference: { label: "JCIH 2019 Position Statement" },
      inputs: [
        { type: "yesNo", id: "nicu_5d", label: "NICU >5 hari?" },
        { type: "yesNo", id: "ecmo_or_ventilator", label: "ECMO / ventilator >5 hari?" },
        {
          type: "yesNo",
          id: "hyperbilirubinemia_exchange",
          label: "Hiperbilirubinemia perlu transfusi tukar?",
        },
        {
          type: "yesNo",
          id: "ototoxic_drug",
          label: "Aminoglikosida >5 hari / cisplatin?",
        },
        { type: "yesNo", id: "birth_asphyxia", label: "Asfiksia lahir berat?" },
        {
          type: "yesNo",
          id: "congenital_infection",
          label: "Infeksi TORCH / CMV kongenital?",
        },
        { type: "yesNo", id: "craniofacial", label: "Anomali kraniofasial?" },
        {
          type: "yesNo",
          id: "family_history",
          label: "Riwayat keluarga tuli permanen?",
        },
        { type: "yesNo", id: "syndromic", label: "Sindrom terkait tuli?" },
        { type: "yesNo", id: "neurodegenerative", label: "Penyakit neurodegeneratif?" },
        { type: "yesNo", id: "head_trauma", label: "Trauma kepala fraktur basis kranii?" },
        { type: "yesNo", id: "postnatal_meningitis", label: "Meningitis bakterial postnatal?" },
      ],
      compute: jcihRiskCompute,
    },
    {
      id: "age-presentation",
      name: "Usia Presentasi (Golden Period)",
      description:
        "Usia bayi/anak saat datang pertama kali. Menentukan urgensi workup & " +
        "rehabilitasi. Threshold '1-3-6' JCIH: screen by 1 mo, diagnose by 3 mo, intervene by 6 mo.",
      reference: { label: "JCIH 2019 — '1-3-6' Principle" },
      inputs: [
        {
          type: "scale",
          id: "age_months",
          label: "Usia saat ini (bulan)",
          min: 0,
          max: 60,
          step: 1,
          default: 3,
        },
      ],
      compute: agePresentationCompute,
    },
  ],

  pathway: [
    {
      id: "step-1-universal-screen",
      title: "1. Universal Newborn Hearing Screening (sebelum pulang / <1 bulan)",
      detail:
        "OAE (DPOAE) kedua telinga. Pass = observasi rutin. Refer → AABR dalam 1 bulan.",
    },
    {
      id: "step-2-aabr-confirm",
      title: "2. AABR Diagnostic (sebelum usia 3 bulan)",
      detail:
        "Lakukan di tenang/sleep. Ambang click ABR + frequency-specific tone burst ABR. " +
        "Dokumentasikan ambang masing-masing telinga.",
    },
    {
      id: "step-3-etiology",
      title: "3. Etiology Workup (paralel dengan konfirmasi dx)",
      detail:
        "CMV PCR (kalau <21 hari usia), genetik GJB2 sequencing kalau tersedia, " +
        "TORCH serologi ibu & bayi, CT temporal bone kalau suspect konduktif.",
    },
    {
      id: "step-4-fit-amplification",
      title: "4. Fitting Amplifikasi (sebelum usia 6 bulan)",
      detail:
        "Hearing aid digital sesuai audiogram. BAHA kalau konduktif + mikrotia bilateral. " +
        "Monitoring 3-bulanan tahun pertama.",
    },
    {
      id: "step-5-speech-therapy",
      title: "5. Terapi Wicara / Auditory-Verbal Therapy",
      detail:
        "Mulai segera setelah amplifikasi. Target: bahasa sesuai usia pendengaran " +
        "(hearing age = chronological age - age at fitting).",
    },
    {
      id: "step-6-ci-evaluation",
      title: "6. Evaluasi Koklear Implan (kalau HA inadequate)",
      detail:
        "Kriteria: tuli sensorineural berat-sangat berat bilateral + progres bahasa " +
        "minimal walau sudah HA 3-6 bulan + keluarga siap rehabilitasi. Waktu optimal: 12-24 bulan.",
    },
    {
      id: "step-7-followup",
      title: "7. Follow-up Audiologi Jangka Panjang",
      detail:
        "6-bulanan untuk high-risk sampai usia 3 tahun, lalu tahunan. Monitoring " +
        "late-onset / progressive loss (terutama pasca-CMV, connexin-26).",
    },
  ],

  treatments: [
    // === Screening / Diagnostik ===
    {
      id: "oae-screening",
      label: "OAE (DPOAE) screening bilateral",
      category: "tindakan",
      icd9Code: "95.47",
      icd9NameId: "Skrining audiometri",
      feeIdr: 250000,
      isOperative: false,
      defaultSelected: true,
    },
    {
      id: "aabr-diagnostic",
      label: "AABR diagnostic (click + frequency-specific tone burst)",
      category: "tindakan",
      icd9Code: "95.46",
      icd9NameId: "Audiometri lain",
      feeIdr: 650000,
      isOperative: false,
    },
    {
      id: "timpanometri",
      label: "Timpanometri + refleks stapedial (anak >6 bulan)",
      category: "tindakan",
      icd9Code: "89.39",
      icd9NameId: "Tes fungsi vestibular/pendengaran",
      feeIdr: 175000,
      isOperative: false,
    },
    {
      id: "audiometri-bermain",
      label: "Audiometri bermain (visual reinforcement / conditioned play, usia 2-5th)",
      category: "tindakan",
      feeIdr: 300000,
      isOperative: false,
    },

    // === Etiology workup ===
    {
      id: "cmv-pcr",
      label: "CMV PCR urin (kalau <21 hari) atau dried blood spot",
      category: "tindakan",
      feeIdr: 550000,
      isOperative: false,
      reference: { label: "Goderis J et al. Pediatrics 2014;134:972" },
    },
    {
      id: "gjb2-sequencing",
      label: "GJB2 (Connexin-26) sequencing — konseling genetik",
      category: "tindakan",
      feeIdr: 1500000,
      isOperative: false,
      reference: {
        label: "Bitner-Glindzicz M. Br Med Bull 2002;63:73",
      },
    },
    {
      id: "torch-serologi",
      label: "TORCH serologi ibu + bayi (CMV, rubella, toxoplasma, HSV)",
      category: "tindakan",
      feeIdr: 800000,
      isOperative: false,
    },
    {
      id: "ct-temporal-bone",
      label: "CT temporal bone (suspect malformasi osikular / atresia)",
      category: "tindakan",
      icd9Code: "87.03",
      icd9NameId: "CT scan kepala",
      feeIdr: 1200000,
      isOperative: false,
    },

    // === Intervensi ===
    {
      id: "hearing-aid-trial",
      label: "Hearing aid trial (digital, behind-the-ear) — fitting audiolog",
      category: "tindakan",
      feeIdr: 0,
      isOperative: false,
      reference: {
        label: "AAA Pediatric Amplification Guidelines 2013",
      },
    },
    {
      id: "baha-softband",
      label: "BAHA softband trial (kalau konduktif + mikrotia <5 thn)",
      category: "tindakan",
      feeIdr: 0,
      isOperative: false,
    },
    {
      id: "ci-evaluation",
      label: "Evaluasi koklear implan (bila HA inadequate 3-6 bln)",
      category: "rujukan",
    },

    // === Rujukan ===
    {
      id: "rujukan-audiologi",
      label: "Rujukan Audiologi Pediatrik (Sp.THT-KL konsultan otologi)",
      category: "rujukan",
      defaultSelected: true,
    },
    {
      id: "rujukan-speech",
      label: "Rujukan Terapi Wicara / Auditory-Verbal Therapist",
      category: "rujukan",
    },
    {
      id: "rujukan-konseling-genetik",
      label: "Rujukan Konseling Genetik (keluarga + GJB2 sequencing)",
      category: "rujukan",
    },
    {
      id: "rujukan-pediatri-tumbang",
      label: "Rujukan SpA Tumbuh-Kembang (skrining komorbid)",
      category: "rujukan",
    },
    {
      id: "follow-up-6bulan",
      label: "Follow-up audiologi 6-bulanan sampai usia 3 tahun",
      category: "rujukan",
    },

    // === Edukasi ===
    {
      id: "edukasi-golden-period",
      label:
        "Edukasi orangtua: Golden period <6 bulan, konsekuensi delay, target JCIH 1-3-6",
      category: "edukasi",
      defaultSelected: true,
    },
    {
      id: "edukasi-stimulasi-bahasa",
      label: "Edukasi stimulasi bahasa rutin (read aloud, music, sign exposure)",
      category: "edukasi",
    },
    {
      id: "edukasi-keluarga-genetik",
      label: "Edukasi keluarga: risk untuk anak berikutnya, screening saudara",
      category: "edukasi",
    },
    {
      id: "edukasi-amplifikasi-harian",
      label:
        "Edukasi pemakaian HA harian (all-waking-hours), perawatan baterai, earmold",
      category: "edukasi",
    },
  ],

  education: {
    title: "Edukasi Orangtua — Tuli Kongenital & Golden Period Intervensi",
    bullets: [
      "Tuli kongenital (bawaan) terjadi pada 1-3 per 1000 kelahiran di Indonesia. Bukan langka, banyak yang baru ketahuan telat.",
      "Window intervensi terbaik: 6 bulan pertama usia. Setelah itu, otak bayi mulai 'menutup' jalur pendengaran — lebih sulit belajar bahasa normal.",
      "Prinsip internasional '1-3-6': skrining sebelum 1 bulan → konfirmasi diagnosis sebelum 3 bulan → intervensi (alat bantu dengar) sebelum 6 bulan.",
      "OAE (tes awal) bukan diagnosis final — kalau 'refer' bukan berarti pasti tuli, tapi HARUS lanjut AABR/BERA untuk pastikan.",
      "Bayi yang tuli tidak akan 'ngamuk' atau tampak rewel — justru anteng. Makanya mudah terlewat. Jangan tunggu sampai bayi 'tampak tuli' baru periksa.",
      "Kalau bayi pakai alat bantu dengar, HARUS dipakai hampir sepanjang waktu bangun (minimal 10 jam/hari). Pemakaian jarang = progres bahasa lambat.",
      "Terapi wicara bukan sekali jadi — butuh rutin mingguan 1-3 tahun. Orangtua adalah 'terapis utama' di rumah (baca, nyanyi, obrolan terus-menerus).",
      "Kalau keluarga ada riwayat tuli permanen (orangtua/saudara), anak selanjutnya punya risiko sampai 25%. Konseling genetik membantu perencanaan.",
      "Virus CMV saat kehamilan = penyebab non-genetik nomor 1. Kadang tidak terdeteksi saat lahir, bisa muncul belakangan → follow-up penting.",
      "Koklear implan adalah operasi penanaman alat di dalam telinga dalam — pertimbangan kalau alat bantu dengar biasa tidak cukup. Hasil terbaik kalau dipasang 12-24 bulan.",
    ],
    channels: ["print", "wa"],
  },

  soapMapping: {
    subjective: (ctx) => {
      const a = ctx.anamnesis;
      const risk: string[] = [];
      if (a["nicu-lebih-5-hari"]) risk.push("NICU >5 hari");
      if (a["ecmo-ventilator"]) risk.push("ECMO/ventilator prolonged");
      if (a["hiperbilirubinemia-exchange"]) risk.push("hiperbilirubinemia transfusi tukar");
      if (a["obat-ototoksik"]) risk.push("riwayat ototoksik");
      if (a["asfiksia-lahir"]) risk.push("asfiksia lahir");
      if (a["infeksi-kongenital"]) risk.push("infeksi kongenital TORCH");
      if (a["anomali-kraniofasial-anam"]) risk.push("anomali kraniofasial");
      if (a["riwayat-keluarga-tuli"]) risk.push("riwayat keluarga tuli permanen");
      if (a["sindrom-terkait-tuli"]) risk.push("sindrom terkait tuli");
      if (a["meningitis-postnatal"]) risk.push("meningitis postnatal");

      const behav: string[] = [];
      if (a["bereaksi-suara-kencang"]) behav.push("tidak bereaksi ke suara kencang");
      if (a["bereaksi-nama"]) behav.push("tidak menoleh saat dipanggil");
      if (a["babbling-delayed"]) behav.push("babbling delayed");
      if (a["kata-pertama-delayed"]) behav.push("kata pertama delayed");

      const cc = ctx.chiefComplaint || "evaluasi pendengaran bayi/anak";
      const riskText = risk.length ? ` Risk: ${risk.join(", ")}.` : " JCIH risk: tidak ada.";
      const behavText = behav.length
        ? ` Observasi orangtua: ${behav.join(", ")}.`
        : " Observasi orangtua: respons suara sesuai usia.";
      return `${cc}.${riskText}${behavText}`;
    },
    objective: (ctx) => {
      const e = ctx.examination;
      const screen: string[] = [];
      if (e["oae-refer-bilateral"]) screen.push("OAE REFER bilateral");
      else if (e["oae-refer-unilateral"]) screen.push("OAE refer unilateral");
      else screen.push("OAE pass bilateral");
      if (e["aabr-abnormal"]) screen.push("AABR: ambang >40 dB (sensorineural)");

      const otosk: string[] = [];
      if (e["kanalis-atresia"]) otosk.push("atresia kanalis aurikularis");
      if (e["mikrotia-atresia"]) otosk.push("mikrotia/anotia");
      if (e["membran-timpani-efusi"]) otosk.push("MT efusi (OME)");
      if (e["kraniofasial-anomali"]) otosk.push("anomali kraniofasial");
      if (e["leher-branchial"]) otosk.push("kista/fistula branchial");
      if (e["mata-sindromik"]) otosk.push("temuan mata sindromik");

      const score = ctx.scoring["jcih-risk"]?.result;
      const age = ctx.scoring["age-presentation"]?.result;
      const scoreText = score ? ` JCIH ${score.total}/12 (${score.severity}).` : "";
      const ageText = age ? ` Usia presentasi ${age.total} bulan.` : "";

      const body = [
        screen.join(", "),
        otosk.length ? `Otoskopi: ${otosk.join(", ")}` : "Otoskopi: dalam batas normal",
      ].join(". ");
      return `${body}.${scoreText}${ageText}`;
    },
    assessment: (ctx) => {
      const primary = ctx.diagnoses.find((d) => d.primary);
      const score = ctx.scoring["jcih-risk"]?.result;
      const age = ctx.scoring["age-presentation"]?.result;

      let dx = "Suspek gangguan pendengaran — belum terkonfirmasi";
      if (primary) dx = `${primary.icd10Code} (working dx)`;

      let stage = "";
      if (score && score.severity === "very-high") stage += " — HIGH-RISK JCIH ≥3";
      else if (score && score.severity === "high") stage += " — moderate risk JCIH 1-2";

      let ageTag = "";
      if (age && age.severity === "very-high")
        ageTag = ", LATE PRESENTATION (risk language deprivation)";
      else if (age && age.severity === "high")
        ageTag = ", delayed presentation";
      else if (age && age.severity === "low")
        ageTag = ", dalam window golden period";

      return `${dx}${stage}${ageTag}.`;
    },
    plan: (ctx) => {
      const t = ctx.treatments;
      const items: string[] = [];

      if (t["oae-screening"]) items.push("OAE screening bilateral");
      if (t["aabr-diagnostic"]) items.push("AABR diagnostic <3 bulan");
      if (t["timpanometri"]) items.push("Timpanometri");
      if (t["audiometri-bermain"]) items.push("Audiometri bermain");
      if (t["cmv-pcr"]) items.push("CMV PCR");
      if (t["gjb2-sequencing"]) items.push("GJB2 sequencing");
      if (t["torch-serologi"]) items.push("TORCH serologi");
      if (t["ct-temporal-bone"]) items.push("CT temporal bone");

      if (t["hearing-aid-trial"]) items.push("Hearing aid trial (fitting audiolog)");
      if (t["baha-softband"]) items.push("BAHA softband trial");
      if (t["ci-evaluation"]) items.push("Evaluasi koklear implan");

      const ruj: string[] = [];
      if (t["rujukan-audiologi"]) ruj.push("Audiologi Pediatrik");
      if (t["rujukan-speech"]) ruj.push("Terapi Wicara/AVT");
      if (t["rujukan-konseling-genetik"]) ruj.push("Konseling Genetik");
      if (t["rujukan-pediatri-tumbang"]) ruj.push("SpA Tumbuh-Kembang");
      if (t["follow-up-6bulan"]) ruj.push("Follow-up audiologi 6-bulanan");
      if (ruj.length) items.push(`Rujukan: ${ruj.join("; ")}`);

      const edu: string[] = [];
      if (t["edukasi-golden-period"]) edu.push("golden period <6 bln");
      if (t["edukasi-stimulasi-bahasa"]) edu.push("stimulasi bahasa rutin");
      if (t["edukasi-keluarga-genetik"]) edu.push("risk keluarga");
      if (t["edukasi-amplifikasi-harian"]) edu.push("pemakaian HA all-waking-hours");
      if (edu.length) items.push(`Edukasi: ${edu.join(", ")}`);

      return items.length ? items.join(". ") + "." : "Tidak ada plan tertulis.";
    },
  },

  references: [
    {
      label: "Joint Committee on Infant Hearing (JCIH). Year 2019 Position Statement. J Early Hearing Detect Interv 2019;4:1-44",
    },
    {
      label: "PERHATI-KL. Panduan Skrining Pendengaran Bayi 2019",
    },
    {
      label: "Kemenkes RI. Pedoman Skrining Pendengaran & Deteksi Dini (SHDI) 2023",
    },
    {
      label: "WHO. World Report on Hearing 2021",
    },
    {
      label: "Yoshinaga-Itano C et al. Language of early-identified children. Pediatrics 1998;102:1161-71",
    },
    {
      label: "Goderis J et al. Congenital CMV & hearing loss: meta-analysis. Pediatrics 2014;134:972-82",
    },
    {
      label: "Bitner-Glindzicz M. Hereditary deafness & phenotyping. Br Med Bull 2002;63:73-94",
    },
    {
      label: "American Academy of Audiology. Pediatric Amplification Guidelines 2013",
    },
  ],

  patientFacingScreening: {
    id: "tuli-kongenital-screening-orangtua",
    name: "Skrining Orangtua — Cek Pendengaran Bayi di Rumah",
    description:
      "Checklist untuk orangtua bayi 0-24 bulan: deteksi dini kecurigaan gangguan pendengaran. Bukan pengganti OAE/AABR — kalau skor ≥3, bawa bayi ke klinik untuk skrining formal.",
    reference: { label: "Adaptasi JCIH + Kemenkes SHDI 2023" },
    inputs: [
      {
        type: "yesNo",
        id: "tidak_bereaksi_suara",
        label: "Bayi tidak terkaget saat ada suara keras (pintu dibanting, tepuk tangan)?",
        weightYes: 1,
      },
      {
        type: "yesNo",
        id: "tidak_menoleh",
        label: "Bayi >6 bulan tidak menoleh saat dipanggil namanya?",
        weightYes: 1,
      },
      {
        type: "yesNo",
        id: "tidak_babbling",
        label: "Bayi 6-12 bulan tidak mengoceh 'mama-papa-baba'?",
        weightYes: 1,
      },
      {
        type: "yesNo",
        id: "tidak_kata_pertama",
        label: "Anak >15 bulan belum mengucapkan kata bermakna?",
        weightYes: 1,
      },
      {
        type: "yesNo",
        id: "nicu_riwayat",
        label: "Bayi pernah dirawat NICU >5 hari?",
        weightYes: 1,
      },
      {
        type: "yesNo",
        id: "keluarga_tuli",
        label: "Ada riwayat tuli permanen di keluarga inti?",
        weightYes: 1,
      },
      {
        type: "yesNo",
        id: "tidak_lulus_oae",
        label: "Bayi belum pernah tes OAE atau hasil 'refer'?",
        weightYes: 1,
      },
    ],
    tiers: [
      {
        threshold: 3,
        label: "Perlu skrining SEGERA",
        recommendation:
          "Bawa bayi ke klinik THT/audiolog dalam 2 minggu untuk OAE + AABR. Window intervensi terbaik <6 bulan usia.",
      },
      {
        threshold: 1,
        label: "Perlu pemeriksaan",
        recommendation:
          "Jadwalkan OAE dalam 1 bulan. Kalau bayi belum pernah skrining, jangan ditunda.",
      },
      {
        threshold: 0,
        label: "Observasi",
        recommendation:
          "Lanjut pantau milestone bahasa tiap bulan. Pastikan sudah lulus OAE newborn screening.",
      },
    ],
  },

  monetization: [
    {
      id: "platform-fee-tuli",
      type: "platform-fee",
      label: "Platform fee skrining neonatus (Rp 5k/pasien)",
      priceIdr: 5000,
      description:
        "Fee platform per kunjungan skrining pendengaran bayi — cashflow utama",
    },
    {
      id: "oae-fee",
      type: "lab-referral",
      label: "OAE screening referral (partner klinik audiologi)",
      partner: "Klinik audiologi partner",
      priceIdr: 250000,
      description:
        "OAE DPOAE 250k, fee platform 10% = 25k/referral",
    },
    {
      id: "hearing-aid-referral",
      type: "otc-referral",
      label: "Hearing aid referral (partner distributor)",
      partner: "Distributor hearing aid digital",
      description:
        "HA digital 4-15jt/pair, komisi partnership 5-10%",
    },
    {
      id: "pdf-edukasi-orangtua",
      type: "edukasi-pdf",
      label: "PDF 'Golden Period Pendengaran Bayi' (Rp 25k)",
      priceIdr: 25000,
      description:
        "PDF 12 halaman untuk orangtua baru — checklist + tanda bahaya",
    },
    {
      id: "telekonsul-audiolog",
      type: "telekonsul",
      label: "Telekonsultasi follow-up audiolog (Rp 75k)",
      priceIdr: 75000,
      description:
        "Follow-up HA fitting + progress bahasa via video call",
    },
  ],
};

export default spec;
