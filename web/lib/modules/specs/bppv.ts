/**
 * Module 6 — Benign Paroxysmal Positional Vertigo (BPPV) (H81.1)
 * Reference: AAO-HNS Clinical Practice Guideline BPPV (2017 update) ·
 * Bárány Society diagnostic criteria · Epley canalith repositioning
 *
 * Karakter: MANUVER-BASED · diagnosis & terapi sama-sama via manuver fisik.
 * Default = NORMAL. Modul fokus pada Dix-Hallpike (diagnosis) + Epley (terapi).
 *
 * Logic decisión:
 *   - Vertigo positional <60 detik + nystagmus karakteristik pada Dix-Hallpike
 *     → Posterior canal BPPV → Epley
 *   - Nystagmus horizontal pada Roll test → Lateral canal BPPV → Lempert/Gufoni
 *   - Red flags neurologis (defisit fokal, ataksia, sakit kepala atypical) →
 *     SWITCH ke evaluasi sentral (CT/MRI), JANGAN diagnosis BPPV
 */

import type { ModuleSpec, ScoringResult } from "../types";

// ==========================================================================
// Scoring computers
// ==========================================================================

const dixHallpikeCompute = (v: Record<string, number>): ScoringResult => {
  // 0=tidak dilakukan, 1=negatif, 2=positif kanan, 3=positif kiri, 4=positif bilateral
  const result = v.result ?? 0;
  const labels = [
    "Dix-Hallpike belum dilakukan",
    "Dix-Hallpike negatif (tidak ada vertigo + nystagmus)",
    "Positif KANAN — nystagmus torsional+upbeating saat kepala ke kanan",
    "Positif KIRI — nystagmus torsional+upbeating saat kepala ke kiri",
    "Positif BILATERAL",
  ];
  const sev: ScoringResult["severity"] =
    result >= 2 ? "high" : result === 1 ? "low" : "low";
  return {
    total: result,
    severity: sev,
    interpretation: labels[result] ?? labels[0],
    recommendation:
      result === 2
        ? "Posterior canal BPPV KANAN — lakukan Epley maneuver KANAN"
        : result === 3
          ? "Posterior canal BPPV KIRI — lakukan Epley maneuver KIRI"
          : result === 4
            ? "BPPV bilateral — Epley bertahap sisi terberat dulu"
            : result === 1
              ? "Negatif. Pertimbangkan Roll test (lateral canal) atau cari etiologi vertigo lain."
              : undefined,
  };
};

const rollTestCompute = (v: Record<string, number>): ScoringResult => {
  // 0=tidak dilakukan, 1=negatif, 2=geotropik (CRSC kanal), 3=apogeotropik (cupulolitiasis)
  const result = v.result ?? 0;
  const labels = [
    "Roll test belum dilakukan",
    "Roll test negatif",
    "Geotropik — canalithiasis kanal lateral (Lempert/BBQ roll)",
    "Apogeotropik — cupulolithiasis kanal lateral (Gufoni)",
  ];
  return {
    total: result,
    severity: result >= 2 ? "moderate" : "low",
    interpretation: labels[result] ?? labels[0],
    recommendation:
      result === 2
        ? "Lateral canal BPPV (canalithiasis) — Lempert / BBQ roll maneuver"
        : result === 3
          ? "Lateral canal BPPV (cupulolithiasis) — Gufoni / forced prolonged position"
          : undefined,
  };
};

const dhiShortCompute = (v: Record<string, number>): ScoringResult => {
  // Dizziness Handicap Inventory short — 4 dimensi (functional/emotional/physical/total impact)
  // skala 0-4 per item
  const total = Object.values(v).reduce((a, b) => a + b, 0);
  if (total >= 13)
    return {
      total,
      severity: "high",
      interpretation: "Handicap berat — dampak signifikan pada aktivitas",
      recommendation:
        "Manuver repositioning prioritas, edukasi kepatuhan tinggi, follow-up 1 minggu.",
    };
  if (total >= 6)
    return {
      total,
      severity: "moderate",
      interpretation: "Handicap sedang",
    };
  return { total, severity: "low", interpretation: "Handicap ringan" };
};

// ==========================================================================
// ModuleSpec
// ==========================================================================

const spec: ModuleSpec = {
  id: "bppv",
  title: "BPPV (Benign Paroxysmal Positional Vertigo)",
  subspecialty: "Vertigo",
  iconName: "rotate-3d",
  tags: ["H81.1", "Dix-Hallpike", "Epley", "AAO-HNS"],
  diagnoses: [
    {
      icd10Code: "H81.1",
      display: "Benign Paroxysmal Positional Vertigo (BPPV)",
      defaultPrimary: true,
      isChronic: false,
      reasoning:
        "Vertigo positional, durasi <60 detik per episode, dipicu perubahan posisi kepala, dengan nystagmus karakteristik pada Dix-Hallpike.",
    },
    {
      icd10Code: "H81.10",
      display: "BPPV, kanal tidak ditentukan",
    },
    {
      icd10Code: "H81.13",
      display: "BPPV, kanal posterior",
    },
    {
      icd10Code: "H81.14",
      display: "BPPV, kanal lateral (horizontal)",
    },
    {
      icd10Code: "H81.4",
      display: "Vertigo sentral (rule-out — bila ada red flag neurologis)",
    },
    {
      icd10Code: "H83.0",
      display: "Labirinitis",
    },
    {
      icd10Code: "H81.0",
      display: "Penyakit Ménière (DD/)",
    },
  ],
  cdssRules: [
    {
      id: "central-vertigo-redflag",
      evaluate: (ctx) => {
        const a = ctx.anamnesis;
        const e = ctx.examination;
        const redFlag =
          a["sakit-kepala-hebat"] ||
          a["defisit-fokal"] ||
          a["diplopia-disartria"] ||
          a["ataksia"] ||
          e["nystagmus-vertikal-spontan"] ||
          e["nystagmus-non-fatigable"];
        if (redFlag) {
          return {
            ruleId: "central-vertigo-redflag",
            level: "danger",
            message:
              "RED FLAG VERTIGO SENTRAL — sakit kepala hebat / defisit fokal / nystagmus vertikal spontan / non-fatigable. JANGAN diagnosis BPPV. CT/MRI kepala + konsul neurologi.",
            reference: { label: "AAO-HNS BPPV CPG · HINTS exam" },
            suggestPrimaryIcd10: "H81.4",
            suggestTreatmentIds: ["ct-mri-kepala", "rujuk-neurologi"],
          };
        }
        return null;
      },
    },
    {
      id: "posterior-bppv-epley",
      evaluate: (ctx) => {
        const dh = ctx.scoring["dix-hallpike"]?.values.result ?? 0;
        if (dh === 2) {
          return {
            ruleId: "posterior-bppv-epley",
            level: "success",
            message:
              "Posterior canal BPPV KANAN. Lakukan Epley maneuver KANAN sekarang. Follow-up 1 minggu — Dix-Hallpike ulang untuk konfirmasi.",
            reference: { label: "AAO-HNS BPPV CPG (2017 update)" },
            suggestPrimaryIcd10: "H81.13",
            suggestTreatmentIds: ["epley-kanan", "edukasi-pasca-manuver"],
          };
        }
        if (dh === 3) {
          return {
            ruleId: "posterior-bppv-epley",
            level: "success",
            message:
              "Posterior canal BPPV KIRI. Lakukan Epley maneuver KIRI sekarang. Follow-up 1 minggu.",
            reference: { label: "AAO-HNS BPPV CPG" },
            suggestPrimaryIcd10: "H81.13",
            suggestTreatmentIds: ["epley-kiri", "edukasi-pasca-manuver"],
          };
        }
        if (dh === 4) {
          return {
            ruleId: "posterior-bppv-epley",
            level: "warn",
            message:
              "BPPV BILATERAL — Epley bertahap. Mulai dari sisi yang lebih simptomatis, evaluasi 1 minggu sebelum sisi lain.",
            reference: { label: "AAO-HNS BPPV CPG" },
            suggestTreatmentIds: ["epley-kanan", "epley-kiri"],
          };
        }
        return null;
      },
    },
    {
      id: "lateral-bppv-lempert",
      evaluate: (ctx) => {
        const rt = ctx.scoring["roll-test"]?.values.result ?? 0;
        if (rt === 2) {
          return {
            ruleId: "lateral-bppv-lempert",
            level: "success",
            message:
              "Lateral canal BPPV (geotropik) — lakukan Lempert / BBQ roll maneuver 360°.",
            reference: { label: "AAO-HNS BPPV CPG" },
            suggestPrimaryIcd10: "H81.14",
            suggestTreatmentIds: ["lempert", "edukasi-pasca-manuver"],
          };
        }
        if (rt === 3) {
          return {
            ruleId: "lateral-bppv-lempert",
            level: "success",
            message:
              "Lateral canal BPPV (apogeotropik / cupulolithiasis) — Gufoni atau forced prolonged position.",
            reference: { label: "AAO-HNS BPPV CPG" },
            suggestPrimaryIcd10: "H81.14",
            suggestTreatmentIds: ["gufoni", "edukasi-pasca-manuver"],
          };
        }
        return null;
      },
    },
    {
      id: "no-vestibular-suppressants",
      evaluate: (ctx) => {
        const dh = ctx.scoring["dix-hallpike"]?.values.result ?? 0;
        if (dh >= 2) {
          return {
            ruleId: "no-vestibular-suppressants",
            level: "info",
            message:
              "AAO-HNS recommends AGAINST vestibular suppressants (betahistin, dimenhidrinat) sebagai terapi rutin BPPV — manuver canalith repositioning sebagai first-line.",
            reference: { label: "AAO-HNS BPPV CPG (2017) — Strong recommendation against" },
          };
        }
        return null;
      },
    },
    {
      id: "recurrent-bppv",
      evaluate: (ctx) => {
        if (ctx.anamnesis["riwayat-bppv-sebelumnya"]) {
          return {
            ruleId: "recurrent-bppv",
            level: "info",
            message:
              "BPPV rekuren — pertimbangkan suplemen vitamin D bila kadar rendah, edukasi self-Epley di rumah, evaluasi BMD bila perempuan postmenopause.",
            reference: { label: "Talaat et al. — Vitamin D dan BPPV recurrence" },
          };
        }
        return null;
      },
    },
  ],
  anamnesis: {
    title: "Anamnesis (tap bila POSITIF) — fokus karakteristik vertigo",
    helper:
      "Cardinal: vertigo SINGKAT (<1 menit) dipicu perubahan POSISI kepala (bangun tidur, menengadah, miring).",
    items: [
      {
        id: "vertigo-positional",
        normalLabel: "Tidak ada vertigo",
        abnormalLabel:
          "Vertigo dipicu perubahan POSISI kepala (cardinal BPPV)",
        tag: "positional-vertigo",
      },
      {
        id: "durasi-singkat",
        normalLabel: "Durasi vertigo lama / kontinu",
        abnormalLabel: "Durasi singkat <60 detik per episode",
        tag: "short-duration",
      },
      {
        id: "pemicu-bangun-tidur",
        normalLabel: "Tidak terkait bangun tidur",
        abnormalLabel: "Pemicu khas: bangun tidur / membalik di tempat tidur",
      },
      {
        id: "pemicu-menengadah",
        normalLabel: "Tidak terkait menengadah",
        abnormalLabel: "Pemicu menengadah ke atas / membungkuk",
      },
      {
        id: "mual-muntah-ringan",
        normalLabel: "Tidak ada mual",
        abnormalLabel: "Mual / muntah ringan saat episode",
      },
      {
        id: "tidak-ada-penurunan-pendengaran",
        normalLabel: "Tidak ada penurunan pendengaran (typical BPPV)",
        abnormalLabel:
          "ADA penurunan pendengaran (DD/ Ménière, neuritis vestibularis)",
        tag: "hearing-affected",
      },
      {
        id: "tidak-ada-tinnitus",
        normalLabel: "Tidak ada tinnitus baru",
        abnormalLabel: "Ada tinnitus baru (DD/ Ménière)",
      },
      {
        id: "riwayat-trauma-kepala",
        normalLabel: "Tidak ada trauma kepala",
        abnormalLabel: "Riwayat trauma kepala (BPPV pasca-trauma sering)",
      },
      {
        id: "riwayat-bppv-sebelumnya",
        normalLabel: "Episode pertama",
        abnormalLabel: "Riwayat BPPV sebelumnya (rekuren)",
        tag: "recurrent",
      },
      // Red flags neurologis
      {
        id: "sakit-kepala-hebat",
        normalLabel: "Tidak ada sakit kepala",
        abnormalLabel: "SAKIT KEPALA HEBAT atypical (RED FLAG sentral)",
        tag: "redflag",
      },
      {
        id: "defisit-fokal",
        normalLabel: "Tidak ada defisit fokal",
        abnormalLabel: "Kelemahan/baal satu sisi tubuh (RED FLAG sentral)",
        tag: "redflag",
      },
      {
        id: "diplopia-disartria",
        normalLabel: "Penglihatan & bicara normal",
        abnormalLabel:
          "Diplopia / disartria / disfagia (RED FLAG sentral)",
        tag: "redflag",
      },
      {
        id: "ataksia",
        normalLabel: "Tidak ada ataksia",
        abnormalLabel:
          "Ataksia (jalan sempoyongan menetap, bukan hanya saat episode) — RED FLAG sentral",
        tag: "redflag",
      },
    ],
  },
  examination: {
    title: "Pemeriksaan vestibuler (tap bila ABNORMAL)",
    helper:
      "Manuver provokasi: Dix-Hallpike (kanal posterior) & Roll test (kanal lateral). Observasi nystagmus dengan Frenzel/video kalau ada.",
    items: [
      {
        id: "nystagmus-spontan",
        normalLabel: "Tidak ada nystagmus spontan",
        abnormalLabel: "Nystagmus spontan saat istirahat (curigai patologi non-BPPV)",
      },
      {
        id: "nystagmus-vertikal-spontan",
        normalLabel: "Tidak ada nystagmus vertikal",
        abnormalLabel:
          "Nystagmus VERTIKAL spontan (RED FLAG sentral — bukan BPPV perifer)",
        tag: "redflag-eye",
      },
      {
        id: "nystagmus-non-fatigable",
        normalLabel: "Nystagmus fatigable (typical BPPV)",
        abnormalLabel:
          "Nystagmus NON-FATIGABLE (tidak menghilang dengan repetisi — RED FLAG sentral)",
        tag: "redflag-eye",
      },
      {
        id: "head-impulse-positif",
        normalLabel: "Head Impulse Test (HIT) negatif",
        abnormalLabel:
          "HIT positif (saccadic catch-up — tanda lesi vestibuler perifer non-BPPV)",
      },
      {
        id: "skew-deviation",
        normalLabel: "Tidak ada skew deviation",
        abnormalLabel: "Skew deviation (RED FLAG sentral — HINTS)",
        tag: "redflag-eye",
      },
      {
        id: "romberg-positif",
        normalLabel: "Romberg negatif",
        abnormalLabel: "Romberg positif (instability)",
      },
      {
        id: "tandem-gait-buruk",
        normalLabel: "Tandem gait baik",
        abnormalLabel: "Tandem gait buruk / tidak bisa (curigai sentral/serebelum)",
      },
      {
        id: "saraf-kranial-defisit",
        normalLabel: "Saraf kranial dalam batas normal",
        abnormalLabel: "Defisit saraf kranial (RED FLAG sentral)",
        tag: "redflag",
      },
      {
        id: "otoskopi-normal",
        normalLabel: "Otoskopi: liang & MT normal",
        abnormalLabel: "Otoskopi: ada perforasi/sekret (DD/ otitis-related vertigo)",
      },
    ],
  },
  scoring: [
    {
      id: "dix-hallpike",
      name: "Dix-Hallpike Maneuver (kanal posterior)",
      description:
        "Provocative maneuver standar untuk diagnosis BPPV kanal posterior. Pasien duduk → diturunkan ke supine dengan kepala menggantung 30° + rotasi 45°. Observasi nystagmus 30 detik per sisi.",
      reference: { label: "AAO-HNS BPPV CPG · Bárány Society criteria" },
      inputs: [
        {
          type: "select",
          id: "result",
          label: "Hasil",
          default: 0,
          options: [
            { value: 0, label: "Belum dilakukan" },
            { value: 1, label: "Negatif (tidak ada vertigo + nystagmus)" },
            {
              value: 2,
              label:
                "Positif KANAN — nystagmus torsional+upbeating saat kepala ke kanan",
            },
            {
              value: 3,
              label:
                "Positif KIRI — nystagmus torsional+upbeating saat kepala ke kiri",
            },
            { value: 4, label: "Positif BILATERAL" },
          ],
        },
      ],
      compute: dixHallpikeCompute,
    },
    {
      id: "roll-test",
      name: "Supine Roll Test (kanal lateral)",
      description:
        "Untuk BPPV kanal lateral. Pasien supine, kepala diputar 90° ke kanan lalu kiri. Observasi arah nystagmus.",
      reference: { label: "AAO-HNS BPPV CPG" },
      inputs: [
        {
          type: "select",
          id: "result",
          label: "Hasil",
          default: 0,
          options: [
            { value: 0, label: "Belum dilakukan" },
            { value: 1, label: "Negatif" },
            {
              value: 2,
              label: "Geotropik — canalithiasis kanal lateral",
            },
            {
              value: 3,
              label: "Apogeotropik — cupulolithiasis kanal lateral",
            },
          ],
        },
      ],
      compute: rollTestCompute,
    },
    {
      id: "dhi-short",
      name: "Dizziness Handicap Inventory (singkat)",
      description:
        "4-item screen — dampak vertigo pada aktivitas. Skala 0=tidak·2=kadang·4=ya.",
      reference: { label: "Jacobson & Newman 1990 (full DHI)" },
      inputs: [
        {
          type: "scale",
          id: "physical",
          label: "Fisik: pusing terasa berat saat menengadah (0=tidak, 4=ya)",
          min: 0,
          max: 4,
          step: 2,
          default: 0,
        },
        {
          type: "scale",
          id: "functional",
          label: "Fungsional: vertigo mengganggu pekerjaan/sekolah",
          min: 0,
          max: 4,
          step: 2,
          default: 0,
        },
        {
          type: "scale",
          id: "emotional",
          label: "Emosional: takut keluar rumah karena pusing",
          min: 0,
          max: 4,
          step: 2,
          default: 0,
        },
        {
          type: "scale",
          id: "social",
          label: "Sosial: menghindari aktivitas sosial",
          min: 0,
          max: 4,
          step: 2,
          default: 0,
        },
      ],
      compute: dhiShortCompute,
    },
  ],
  pathway: [
    {
      id: "step-1",
      title: "Anamnesis & screen RED FLAG sentral",
      detail:
        "Vertigo positional <60 dtk → BPPV. Bila ada sakit kepala hebat / defisit fokal / nystagmus vertikal → CT/MRI dulu.",
    },
    {
      id: "step-2",
      title: "Dix-Hallpike (kanal posterior)",
      detail:
        "Standard diagnostic maneuver. Observasi nystagmus torsional+upbeating saat sisi terlibat ke bawah.",
    },
    {
      id: "step-3",
      title: "Bila Dix-Hallpike negatif → Roll test (kanal lateral)",
      detail:
        "Cek BPPV kanal lateral. Geotropik = canalithiasis, apogeotropik = cupulolithiasis.",
    },
    {
      id: "step-4",
      title: "Manuver repositioning sesuai kanal",
      detail:
        "Kanal posterior → Epley · Lateral canalithiasis → Lempert/BBQ roll · Cupulolithiasis → Gufoni.",
    },
    {
      id: "step-5",
      title: "Edukasi pasca-manuver",
      detail:
        "Tidak ada larangan tidur menyamping (Cohen 2004). Hindari posisi yang memprovokasi 24 jam pertama. Self-Epley bila rekuren.",
    },
    {
      id: "step-6",
      title: "Follow-up 1 minggu",
      detail:
        "Dix-Hallpike ulang. Bila masih positif → ulangi Epley. Pertimbangkan rujukan vestibuler bila >3× gagal.",
    },
  ],
  treatments: [
    {
      id: "epley-kanan",
      label: "Epley Maneuver — kanan (95.46)",
      category: "tindakan",
      icd9Code: "95.46",
      icd9NameId: "Manuver canalith repositioning (Epley/Sémont)",
      feeIdr: 250_000,
      reference: { label: "AAO-HNS BPPV CPG (Strong recommendation)" },
    },
    {
      id: "epley-kiri",
      label: "Epley Maneuver — kiri (95.46)",
      category: "tindakan",
      icd9Code: "95.46",
      icd9NameId: "Manuver canalith repositioning (Epley/Sémont)",
      feeIdr: 250_000,
      reference: { label: "AAO-HNS BPPV CPG" },
    },
    {
      id: "lempert",
      label: "Lempert / BBQ roll — kanal lateral 360° (95.46)",
      category: "tindakan",
      icd9Code: "95.46",
      icd9NameId: "Manuver canalith repositioning (Lempert)",
      feeIdr: 250_000,
      reference: { label: "AAO-HNS BPPV CPG" },
    },
    {
      id: "gufoni",
      label: "Gufoni Maneuver (cupulolithiasis lateral)",
      category: "tindakan",
      reference: { label: "AAO-HNS BPPV CPG" },
    },
    {
      id: "audiometri",
      label: "Audiometri nada murni (95.41) — bila DD/ Ménière",
      category: "tindakan",
      icd9Code: "95.41",
      icd9NameId: "Audiometri nada murni",
      feeIdr: 250_000,
    },
    {
      id: "ct-mri-kepala",
      label: "CT / MRI kepala (87.03 / 88.91) — bila red flag sentral",
      category: "tindakan",
      icd9Code: "88.91",
      icd9NameId: "MRI kepala",
      feeIdr: 3_000_000,
    },
    {
      id: "vit-d-suplemen",
      label: "Suplementasi Vitamin D (BPPV rekuren bila kadar rendah)",
      category: "medikamentosa",
      prescription: {
        drugName: "Vitamin D3 (Cholecalciferol)",
        genericName: "Cholecalciferol",
        drugForm: "Tablet/kapsul",
        strength: "1000 IU",
        dose: "1 kapsul",
        frequency: "1× sehari",
        duration: "8 minggu, evaluasi 25(OH)D",
        route: "Per oral",
        instructions: "Dengan makanan berlemak untuk absorpsi optimal.",
      },
      reference: { label: "Talaat et al. 2016 — Vit D & BPPV recurrence" },
    },
    {
      id: "edukasi-pasca-manuver",
      label: "Edukasi pasca-manuver (tidak ada pembatasan posisi rutin)",
      category: "edukasi",
      defaultSelected: true,
    },
    {
      id: "edukasi-self-epley",
      label: "Edukasi self-Epley di rumah (bila rekuren)",
      category: "edukasi",
    },
    {
      id: "rujuk-neurologi",
      label: "Rujuk neurologi (red flag sentral)",
      category: "rujukan",
    },
    {
      id: "rujuk-vestibuler",
      label: "Rujuk vestibuler / fisioterapi (gagal manuver >3×)",
      category: "rujukan",
    },
  ],
  education: {
    title: "Edukasi pasien — BPPV",
    bullets: [
      "BPPV = vertigo karena kristal kalsium kecil (otokonia) lepas di telinga dalam — BUKAN penyakit otak/serius.",
      "Vertigo singkat (<1 menit) yang muncul saat pindah posisi (bangun, menengadah, miring) adalah ciri khas BPPV.",
      "Manuver Epley yang tadi dilakukan menggerakkan kristal kembali ke tempatnya — banyak pasien sembuh dalam 1 sesi.",
      "Tidak perlu menghindari posisi tidur tertentu setelah manuver (penelitian terbaru). Aktivitas normal boleh.",
      "Hindari menengadah ekstrem / pose yoga inversi 24 jam pertama untuk mencegah kambuh.",
      "Bila gejala kembali: ulangi posisi yang memicu sebentar (otak adaptasi) atau lakukan Epley sendiri (akan diajarkan bila rekuren).",
      "BPPV bisa kambuh — sekitar 30% dalam 1 tahun. Itu normal, bukan tanda penyakit baru.",
      "SEGERA ke IGD bila: vertigo disertai sakit kepala hebat, kelemahan satu sisi, bicara cadel, pandangan ganda, atau pingsan.",
    ],
    channels: ["print", "wa"],
  },
  soapMapping: {
    subjective: (ctx) => {
      const a = ctx.anamnesis;
      const cc = ctx.chiefComplaint?.trim();
      const items: string[] = [];
      if (a["vertigo-positional"])
        items.push("vertigo dipicu perubahan posisi kepala (cardinal)");
      if (a["durasi-singkat"]) items.push("durasi singkat <60 detik");
      if (a["pemicu-bangun-tidur"]) items.push("dipicu bangun tidur/membalik");
      if (a["pemicu-menengadah"]) items.push("dipicu menengadah/membungkuk");
      if (a["mual-muntah-ringan"]) items.push("mual ringan");
      if (a["tidak-ada-penurunan-pendengaran"])
        items.push("ADA penurunan pendengaran (DD/ Ménière)");
      if (a["tidak-ada-tinnitus"]) items.push("ada tinnitus baru");
      if (a["riwayat-trauma-kepala"]) items.push("riwayat trauma kepala");
      if (a["riwayat-bppv-sebelumnya"]) items.push("BPPV rekuren");
      if (a["sakit-kepala-hebat"])
        items.push("sakit kepala hebat (RED FLAG sentral)");
      if (a["defisit-fokal"]) items.push("defisit fokal (RED FLAG)");
      if (a["diplopia-disartria"])
        items.push("diplopia/disartria (RED FLAG)");
      if (a["ataksia"]) items.push("ataksia menetap (RED FLAG)");
      const summary =
        items.length > 0
          ? `Pasien mengeluhkan ${items.join(", ")}.`
          : "Tidak ada keluhan vertigo aktif.";
      return cc ? `Keluhan utama: ${cc}. ${summary}` : summary;
    },
    objective: (ctx) => {
      const e = ctx.examination;
      const items: string[] = [];
      if (e["nystagmus-spontan"]) items.push("nystagmus spontan");
      if (e["nystagmus-vertikal-spontan"])
        items.push("nystagmus VERTIKAL spontan (RED FLAG)");
      if (e["nystagmus-non-fatigable"])
        items.push("nystagmus non-fatigable (RED FLAG)");
      if (e["head-impulse-positif"]) items.push("Head Impulse Test positif");
      if (e["skew-deviation"]) items.push("skew deviation (RED FLAG HINTS)");
      if (e["romberg-positif"]) items.push("Romberg positif");
      if (e["tandem-gait-buruk"]) items.push("tandem gait buruk");
      if (e["saraf-kranial-defisit"])
        items.push("defisit saraf kranial (RED FLAG)");
      if (e["otoskopi-normal"]) items.push("otoskopi: ada perforasi/sekret");
      const head =
        items.length > 0
          ? `Pemeriksaan vestibuler: ${items.join(", ")}.`
          : "Pemeriksaan: tidak ada nystagmus spontan, HIT negatif, otoskopi normal.";
      const lines = [head];
      const dh = ctx.scoring["dix-hallpike"]?.values.result ?? 0;
      const rt = ctx.scoring["roll-test"]?.values.result ?? 0;
      const dhi = ctx.scoring["dhi-short"]?.result.total ?? 0;
      if (dh > 0)
        lines.push(`Dix-Hallpike: ${ctx.scoring["dix-hallpike"]?.result.interpretation}.`);
      if (rt > 0)
        lines.push(`Roll test: ${ctx.scoring["roll-test"]?.result.interpretation}.`);
      if (dhi > 0)
        lines.push(`DHI singkat = ${dhi} (${ctx.scoring["dhi-short"]?.result.interpretation}).`);
      return lines.join(" ");
    },
    assessment: (ctx) => {
      const a = ctx.anamnesis;
      const e = ctx.examination;
      const dx = ctx.diagnoses[0]?.icd10Code ?? "H81.1";
      const redFlag =
        a["sakit-kepala-hebat"] ||
        a["defisit-fokal"] ||
        a["diplopia-disartria"] ||
        a["ataksia"] ||
        e["nystagmus-vertikal-spontan"] ||
        e["nystagmus-non-fatigable"] ||
        e["skew-deviation"] ||
        e["saraf-kranial-defisit"];
      if (redFlag)
        return `**RULE-OUT VERTIGO SENTRAL** (RED FLAG positif). Bukan diagnosis BPPV definitif sampai imaging menyingkirkan. ICD-10: H81.4 / DD/ vaskuler serebelum/batang otak.`;
      const dh = ctx.scoring["dix-hallpike"]?.values.result ?? 0;
      const rt = ctx.scoring["roll-test"]?.values.result ?? 0;
      if (dh >= 2)
        return `BPPV kanal POSTERIOR (${dh === 4 ? "bilateral" : dh === 2 ? "kanan" : "kiri"}) — ${dx === "H81.1" ? "H81.13" : dx}. Diagnosis konfirmasi via Dix-Hallpike positif.`;
      if (rt >= 2)
        return `BPPV kanal LATERAL (${rt === 2 ? "canalithiasis" : "cupulolithiasis"}) — H81.14. Diagnosis konfirmasi via Roll test.`;
      return `Suspek BPPV (${dx}) — manuver provokasi belum lengkap atau negatif. Pertimbangkan etiologi vertigo lain.`;
    },
    plan: (ctx) => {
      const t = ctx.treatments;
      const lines: string[] = [];
      if (t["epley-kanan"]) lines.push("Epley maneuver KANAN (95.46) sekarang");
      if (t["epley-kiri"]) lines.push("Epley maneuver KIRI (95.46) sekarang");
      if (t["lempert"]) lines.push("Lempert/BBQ roll 360° (95.46)");
      if (t["gufoni"]) lines.push("Gufoni maneuver");
      if (t["audiometri"]) lines.push("Audiometri (95.41) untuk DD/ Ménière");
      if (t["ct-mri-kepala"]) lines.push("CT/MRI kepala — rule out vertigo sentral");
      if (t["vit-d-suplemen"])
        lines.push("Vitamin D3 1000 IU/hari (BPPV rekuren)");
      if (t["edukasi-pasca-manuver"]) lines.push("Edukasi pasca-manuver");
      if (t["edukasi-self-epley"]) lines.push("Edukasi self-Epley di rumah");
      if (t["rujuk-neurologi"]) lines.push("Rujuk neurologi");
      if (t["rujuk-vestibuler"]) lines.push("Rujuk vestibuler/fisioterapi");
      lines.push("Follow-up 1 minggu — Dix-Hallpike ulang.");
      return lines.join(". ") + ".";
    },
  },
  references: [
    {
      label: "AAO-HNS Clinical Practice Guideline: BPPV (2017 Update)",
    },
    { label: "Bárány Society Diagnostic Criteria for BPPV" },
    { label: "Epley JM. Canalith Repositioning Procedure (1992)" },
    { label: "Talaat HS et al. Vitamin D and BPPV recurrence (2016)" },
  ],
};

export default spec;
