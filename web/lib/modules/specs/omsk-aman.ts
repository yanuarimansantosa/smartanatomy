/**
 * Module 3 — Otitis Media Supuratif Kronik (OMSK) Tipe Aman / Tubotimpanik (H66.1)
 * Reference: PPK PERHATI-KL · WHO classification · AAO-HNS Guideline COM
 *
 * Karakter: kronik · perforasi sentral (pars tensa), tanpa kolesteatoma.
 * Tujuan modul: bedakan TIPE AMAN (sentral, kering/intermiten) vs BAHAYA
 * (atik/marginal, kolesteatoma) → modul terpisah `omsk-bahaya` untuk tipe bahaya.
 *
 * Decision logic:
 *   - Otore aktif → antibiotik topikal + aural toilet, kontrol 2 mgg
 *   - Telinga kering ≥3 bulan + perforasi persisten → kandidat timpanoplasti
 *   - Hearing loss konduktif sedang → audiometri sebelum tindakan
 *   - Kecurigaan kolesteatoma (atik retraction / debris putih) → SWITCH ke modul OMSK Bahaya
 */

import type { ModuleSpec, ScoringResult } from "../types";

// ==========================================================================
// Scoring computers
// ==========================================================================

const perforationCompute = (v: Record<string, number>): ScoringResult => {
  const type = v.type ?? 0;
  // 0=intak, 1=sentral kecil, 2=sentral besar, 3=subtotal, 4=total
  if (type === 0)
    return { total: 0, severity: "low", interpretation: "Membran timpani intak" };
  const interp =
    type === 1
      ? "Perforasi sentral kecil (<25% pars tensa)"
      : type === 2
        ? "Perforasi sentral besar (25–50%)"
        : type === 3
          ? "Perforasi subtotal (>50%)"
          : "Perforasi total (anulus utuh)";
  const sev: ScoringResult["severity"] =
    type >= 3 ? "high" : type >= 2 ? "moderate" : "low";
  return {
    total: type,
    severity: sev,
    interpretation: interp,
    recommendation:
      type >= 1
        ? "Tipe AMAN bila perforasi sentral & tanpa retraksi atik. Konfirmasi tidak ada kolesteatoma."
        : undefined,
  };
};

const otorrheaCompute = (v: Record<string, number>): ScoringResult => {
  const status = v.status ?? 0;
  // 0=kering, 1=intermiten, 2=aktif mukoid, 3=aktif purulen
  const labels = [
    "Telinga kering",
    "Otore intermiten (kambuh saat ISPA / kemasukan air)",
    "Otore aktif mukoid",
    "Otore aktif purulen / berbau busuk",
  ];
  const sev: ScoringResult["severity"] =
    status >= 3 ? "high" : status === 2 ? "moderate" : status === 1 ? "low" : "low";
  return {
    total: status,
    severity: sev,
    interpretation: labels[status] ?? labels[0],
    recommendation:
      status >= 2
        ? "Aural toilet + antibiotik topikal kuinolon (ofloksasin) 2× sehari · hindari air masuk"
        : status === 0
          ? "Telinga kering ≥3 bulan → kandidat timpanoplasti"
          : "Edukasi proteksi air, kontrol bila kambuh",
  };
};

const hearingLossCompute = (v: Record<string, number>): ScoringResult => {
  const db = v.dbHL ?? 0;
  // estimasi PTA (dB HL) — dari penurunan pendengaran subjektif / audiometri
  const sev: ScoringResult["severity"] =
    db >= 70 ? "very-high" : db >= 41 ? "high" : db >= 26 ? "moderate" : "low";
  const interp =
    db <= 25
      ? "Pendengaran normal (≤25 dB)"
      : db <= 40
        ? "Tuli ringan (26–40 dB)"
        : db <= 55
          ? "Tuli sedang (41–55 dB)"
          : db <= 70
            ? "Tuli sedang-berat (56–70 dB)"
            : db <= 90
              ? "Tuli berat (71–90 dB)"
              : "Tuli sangat berat (>90 dB)";
  return {
    total: db,
    severity: sev,
    interpretation: `${interp} — estimasi konduktif/campur`,
    recommendation:
      db >= 41
        ? "Audiometri formal (95.41) wajib sebelum timpanoplasti / pertimbangkan ABD"
        : db >= 26
          ? "Audiometri (95.41) untuk konfirmasi tipe & gap"
          : "Tidak ada gangguan signifikan",
  };
};

// ==========================================================================
// ModuleSpec
// ==========================================================================

const spec: ModuleSpec = {
  id: "omsk-aman",
  title: "OMSK Tipe Aman (Tubotimpanik)",
  subspecialty: "Telinga",
  iconName: "ear",
  tags: ["H66.1", "tubotimpanik", "PERHATI-KL", "AAO-HNS"],
  diagnoses: [
    {
      icd10Code: "H66.1",
      display: "Otitis media supuratif kronik tubotimpanik (tipe aman)",
      defaultPrimary: true,
      isChronic: true,
      reasoning:
        "Perforasi sentral pars tensa, tanpa kolesteatoma — risiko komplikasi rendah, fokus rehabilitasi pendengaran.",
    },
    {
      icd10Code: "H66.3",
      display: "Otitis media supuratif kronik lainnya",
      isChronic: true,
    },
    {
      icd10Code: "H72.0",
      display: "Perforasi sentral membran timpani",
    },
    {
      icd10Code: "H90.6",
      display: "Tuli campur bilateral",
    },
    {
      icd10Code: "H90.2",
      display: "Tuli konduktif tidak ditentukan",
    },
  ],
  cdssRules: [
    {
      id: "switch-omsk-bahaya",
      evaluate: (ctx) => {
        const debrisPutih = ctx.examination["debris-putih"];
        const retraksiAtik = ctx.examination["retraksi-atik"];
        const granulasi = ctx.examination["granulasi"];
        if (debrisPutih || retraksiAtik || granulasi) {
          return {
            ruleId: "switch-omsk-bahaya",
            level: "danger",
            message:
              "RED FLAG kolesteatoma terdeteksi (debris putih / retraksi atik / granulasi). Pertimbangkan SWITCH ke modul OMSK Bahaya (H66.2) untuk evaluasi komplikasi & rencana mastoidektomi.",
            reference: {
              label: "PERHATI-KL — OMSK tipe bahaya / kolesteatoma",
            },
            suggestPrimaryIcd10: "H66.2",
          };
        }
        return null;
      },
    },
    {
      id: "tympanoplasty-candidate",
      evaluate: (ctx) => {
        const dryEar = ctx.scoring["otorrhea"]?.values.status === 0;
        const perforated =
          (ctx.scoring["perforation"]?.values.type ?? 0) >= 1;
        const dryDuration = ctx.anamnesis["kering-3bulan"];
        if (dryEar && perforated && dryDuration) {
          return {
            ruleId: "tympanoplasty-candidate",
            level: "success",
            message:
              "KANDIDAT TIMPANOPLASTI: telinga kering ≥3 bulan + perforasi persisten. Audiometri pra-bedah, edukasi prosedur.",
            reference: { label: "AAO-HNS COM Guideline" },
            suggestTreatmentIds: ["audiometri", "tympanoplasty"],
          };
        }
        return null;
      },
    },
    {
      id: "active-discharge-treatment",
      evaluate: (ctx) => {
        const status = ctx.scoring["otorrhea"]?.values.status ?? 0;
        if (status >= 2) {
          return {
            ruleId: "active-discharge-treatment",
            level: "warn",
            message:
              "Otore aktif: aural toilet + antibiotik topikal kuinolon (ofloksasin) 2× sehari × 7–10 hari, hindari air, kontrol 2 minggu.",
            reference: { label: "AAO-HNS · PPK PERHATI-KL" },
            suggestTreatmentIds: ["aural-toilet", "ofloksasin-topikal", "edukasi-proteksi-air"],
          };
        }
        return null;
      },
    },
    {
      id: "hearing-loss-warn",
      evaluate: (ctx) => {
        const db = ctx.scoring["hearing-loss"]?.values.dbHL ?? 0;
        if (db >= 41) {
          return {
            ruleId: "hearing-loss-warn",
            level: "warn",
            message:
              "Tuli sedang+. Audiometri formal wajib (95.41) — pertimbangkan ABD bila tidak operatif atau bilateral.",
            reference: { label: "WHO grades of hearing impairment" },
            suggestTreatmentIds: ["audiometri"],
          };
        }
        return null;
      },
    },
  ],
  anamnesis: {
    title: "Anamnesis (tap bila ABNORMAL)",
    helper:
      "Default semua normal. Tap hanya yang positif. Cardinal: otore kronik berulang.",
    items: [
      {
        id: "otore-kronik",
        normalLabel: "Tidak ada riwayat otore kronik",
        abnormalLabel: "Otore (keluar cairan dari telinga) >2 bulan / berulang",
        tag: "otore-kronik",
      },
      {
        id: "penurunan-pendengaran",
        normalLabel: "Tidak ada penurunan pendengaran",
        abnormalLabel: "Penurunan pendengaran pada telinga sakit",
        tag: "hearing-loss",
      },
      {
        id: "kering-3bulan",
        normalLabel: "Otore masih sering",
        abnormalLabel: "Telinga kering konsisten ≥3 bulan terakhir",
        tag: "dry-3mo",
      },
      {
        id: "tinitus",
        normalLabel: "Tidak ada tinnitus",
        abnormalLabel: "Tinnitus pada telinga sakit",
      },
      {
        id: "vertigo",
        normalLabel: "Tidak ada vertigo / pusing berputar",
        abnormalLabel: "Vertigo / pusing berputar (curigai komplikasi labirin)",
        tag: "vertigo",
      },
      {
        id: "nyeri-telinga",
        normalLabel: "Tidak ada nyeri telinga",
        abnormalLabel: "Nyeri telinga (otalgia) — curigai infeksi aktif/komplikasi",
      },
      {
        id: "demam",
        normalLabel: "Tidak demam",
        abnormalLabel: "Demam — curigai eksaserbasi akut",
      },
      {
        id: "riwayat-trauma",
        normalLabel: "Tidak ada riwayat trauma telinga",
        abnormalLabel: "Riwayat trauma / barotrauma sebelumnya",
      },
      {
        id: "kemasukan-air",
        normalLabel: "Telinga aman dari air",
        abnormalLabel: "Sering kemasukan air (mandi/berenang) — pemicu kambuh",
      },
    ],
  },
  examination: {
    title: "Pemeriksaan otoskopi & klinis (tap bila ABNORMAL)",
    helper:
      "Fokus: lokasi & jenis perforasi, kondisi mukosa kavum timpani, ada/tidak debris putih (kolesteatoma).",
    items: [
      {
        id: "perforasi-sentral",
        normalLabel: "Membran timpani intak",
        abnormalLabel: "Perforasi sentral pars tensa (anulus utuh)",
        tag: "perforation-central",
      },
      {
        id: "retraksi-atik",
        normalLabel: "Pars flaksida normal",
        abnormalLabel: "Retraksi pars flaksida / kantong retraksi atik",
        tag: "retraction-attic",
      },
      {
        id: "debris-putih",
        normalLabel: "Tidak ada debris putih",
        abnormalLabel: "Debris putih / massa keratin di kavum/atik (curigai kolesteatoma)",
        tag: "cholesteatoma-suspect",
      },
      {
        id: "granulasi",
        normalLabel: "Tidak ada granulasi",
        abnormalLabel: "Jaringan granulasi pada margin perforasi / kavum",
        tag: "granulation",
      },
      {
        id: "mukosa-edema",
        normalLabel: "Mukosa kavum tenang",
        abnormalLabel: "Mukosa kavum edema / hiperemis (proses aktif)",
      },
      {
        id: "secret-purulen",
        normalLabel: "Tidak ada sekret",
        abnormalLabel: "Sekret purulen di liang telinga",
      },
      {
        id: "rinne-negatif",
        normalLabel: "Tes Rinne positif (AC>BC)",
        abnormalLabel: "Tes Rinne NEGATIF (BC>AC) — gap konduktif",
        tag: "rinne-neg",
      },
      {
        id: "weber-lateralisasi",
        normalLabel: "Tes Weber tidak lateralisasi",
        abnormalLabel: "Tes Weber lateralisasi ke telinga sakit (konduktif)",
      },
      {
        id: "fistula-positif",
        normalLabel: "Tes fistula negatif",
        abnormalLabel: "Tes fistula POSITIF (vertigo + nystagmus saat tekanan) — curigai erosi kanal",
        tag: "fistula-pos",
      },
    ],
  },
  scoring: [
    {
      id: "perforation",
      name: "Tipe perforasi membran timpani",
      description:
        "Klasifikasi perforasi pars tensa sentral. Tipe BAHAYA (atik/marginal) tidak dinilai di sini — gunakan modul OMSK Bahaya.",
      reference: { label: "PERHATI-KL · Helmholtz classification" },
      inputs: [
        {
          type: "select",
          id: "type",
          label: "Tipe perforasi",
          default: 0,
          options: [
            { value: 0, label: "Intak (tidak ada perforasi)" },
            { value: 1, label: "Sentral kecil (<25% pars tensa)" },
            { value: 2, label: "Sentral besar (25–50%)" },
            { value: 3, label: "Subtotal (>50%, anulus utuh)" },
            { value: 4, label: "Total (anulus utuh, pars tensa hilang)" },
          ],
        },
      ],
      compute: perforationCompute,
    },
    {
      id: "otorrhea",
      name: "Status otore",
      description: "Status sekresi telinga saat ini.",
      reference: { label: "AAO-HNS COM" },
      inputs: [
        {
          type: "select",
          id: "status",
          label: "Status otore",
          default: 0,
          options: [
            { value: 0, label: "Telinga kering" },
            { value: 1, label: "Intermiten (kambuh saat ISPA/air masuk)" },
            { value: 2, label: "Aktif mukoid" },
            { value: 3, label: "Aktif purulen / berbau" },
          ],
        },
      ],
      compute: otorrheaCompute,
    },
    {
      id: "hearing-loss",
      name: "Estimasi penurunan pendengaran (PTA)",
      description:
        "Estimasi pure tone average — input audiometri bila tersedia, atau estimasi klinis dari tes berbisik / suara percakapan.",
      reference: { label: "WHO grades of hearing impairment 2021" },
      inputs: [
        {
          type: "scale",
          id: "dbHL",
          label: "PTA (dB HL) — telinga sakit",
          min: 0,
          max: 110,
          step: 5,
          default: 0,
        },
      ],
      compute: hearingLossCompute,
    },
  ],
  pathway: [
    {
      id: "step-1",
      title: "Anamnesis & otoskopi",
      detail:
        "Pastikan perforasi SENTRAL pars tensa. Singkirkan retraksi atik / debris putih (= bahaya).",
    },
    {
      id: "step-2",
      title: "Tes pendengaran sederhana (Rinne/Weber)",
      detail: "Konfirmasi pola konduktif. Audiometri formal bila gap >25 dB.",
    },
    {
      id: "step-3",
      title: "Tatalaksana fase aktif (bila otore)",
      detail:
        "Aural toilet (suction/swab) + antibiotik topikal kuinolon 2×/hari × 7–10 hari. Hindari air.",
    },
    {
      id: "step-4",
      title: "Edukasi & kontrol 2 minggu",
      detail: "Cek kekeringan telinga. Lanjutkan proteksi air & follow-up.",
    },
    {
      id: "step-5",
      title: "Bila kering ≥3 bulan: rencana timpanoplasti",
      detail:
        "Audiometri formal pra-bedah, konseling prosedur (ICD-9 19.4 / 19.5x), siapkan rujukan bedah.",
    },
    {
      id: "step-6",
      title: "Surveilans tahunan",
      detail:
        "Pantau jika ada tanda bahaya (retraksi, vertigo, nyeri, paresis fasialis) → segera switch ke modul Bahaya.",
    },
  ],
  treatments: [
    {
      id: "aural-toilet",
      label: "Aural toilet (96.52)",
      category: "tindakan",
      icd9Code: "96.52",
      icd9NameId: "Pencucian / pembersihan liang telinga",
      feeIdr: 75_000,
      reference: { label: "PPK PERHATI-KL" },
    },
    {
      id: "ofloksasin-topikal",
      label: "Ofloksasin tetes telinga (medikamentosa)",
      category: "medikamentosa",
      defaultSelected: false,
      prescription: {
        drugName: "Ofloksasin tetes telinga 0.3%",
        genericName: "Ofloxacin",
        drugForm: "Tetes telinga",
        strength: "0.3%",
        dose: "5 tetes",
        frequency: "2× sehari",
        duration: "10 hari",
        route: "Telinga sakit",
        instructions:
          "Bersihkan dulu, miringkan kepala, teteskan, tekan tragus 5×, pertahankan posisi 5 menit. Hindari air masuk telinga.",
        quantity: 1,
        unit: "botol",
      },
      reference: { label: "AAO-HNS COM Guideline (topical quinolone)" },
    },
    {
      id: "amoksisilin-asam-klavulanat",
      label: "Amoksisilin-Asam Klavulanat oral (bila eksaserbasi sistemik)",
      category: "medikamentosa",
      prescription: {
        drugName: "Amoksisilin-Asam Klavulanat",
        genericName: "Amoxicillin + Clavulanic acid",
        drugForm: "Tablet",
        strength: "500/125 mg",
        dose: "1 tablet",
        frequency: "3× sehari",
        duration: "7 hari",
        route: "Per oral",
        instructions: "Sesudah makan. Habiskan sampai tuntas.",
        quantity: 21,
        unit: "tablet",
      },
      reference: { label: "PPK PERHATI-KL — eksaserbasi akut OMSK" },
    },
    {
      id: "audiometri",
      label: "Audiometri nada murni (95.41)",
      category: "tindakan",
      icd9Code: "95.41",
      icd9NameId: "Audiometri nada murni",
      feeIdr: 250_000,
      reference: { label: "Standar audiologi PERHATI-KL" },
    },
    {
      id: "tympanoplasty",
      label: "Timpanoplasti tipe I (miringoplasti) — 19.4",
      category: "tindakan",
      icd9Code: "19.4",
      icd9NameId: "Miringoplasti / timpanoplasti tipe I",
      feeIdr: 9_500_000,
      isOperative: true,
      reference: { label: "AAO-HNS Tympanoplasty Guideline" },
    },
    {
      id: "edukasi-proteksi-air",
      label: "Edukasi: proteksi air masuk telinga",
      category: "edukasi",
    },
    {
      id: "edukasi-follow-up",
      label: "Edukasi: kontrol bila kambuh / vertigo / nyeri / paresis fasial",
      category: "edukasi",
      defaultSelected: true,
    },
    {
      id: "rujuk-bedah",
      label: "Rujuk bedah otologi (bila timpanoplasti tidak tersedia)",
      category: "rujukan",
    },
  ],
  education: {
    title: "Edukasi pasien — OMSK Tipe Aman",
    bullets: [
      "OMSK tipe aman = perforasi gendang telinga di tengah, biasanya tanpa komplikasi serius bila terkontrol.",
      "Kunci: JAGA TELINGA TETAP KERING. Gunakan penyumbat telinga saat mandi/keramas/berenang.",
      "Bila keluar cairan: bersihkan dengan benar (jangan korek dalam) + obat tetes sesuai resep, hindari air.",
      "Kontrol rutin meski telinga kering — pendengaran perlu dipantau.",
      "Segera kembali bila: vertigo, nyeri telinga hebat, demam, wajah perot, atau penurunan pendengaran tiba-tiba.",
      "Bila telinga sudah kering ≥3 bulan, ada pilihan operasi tambal gendang telinga (timpanoplasti) untuk memperbaiki pendengaran.",
      "Hindari membersihkan telinga dengan cotton bud — bisa memperberat perforasi.",
    ],
    channels: ["print", "wa"],
  },
  soapMapping: {
    subjective: (ctx) => {
      const a = ctx.anamnesis;
      const cc = ctx.chiefComplaint?.trim();
      const items: string[] = [];
      if (a["otore-kronik"]) items.push("Otore kronik berulang >2 bulan");
      if (a["penurunan-pendengaran"]) items.push("penurunan pendengaran");
      if (a["kering-3bulan"]) items.push("telinga kering ≥3 bulan terakhir");
      if (a["tinitus"]) items.push("tinnitus");
      if (a["vertigo"]) items.push("vertigo (perlu evaluasi komplikasi)");
      if (a["nyeri-telinga"]) items.push("nyeri telinga");
      if (a["demam"]) items.push("demam");
      if (a["riwayat-trauma"]) items.push("riwayat trauma telinga");
      if (a["kemasukan-air"]) items.push("sering kemasukan air");
      const summary =
        items.length > 0
          ? `Pasien mengeluhkan ${items.join(", ")}.`
          : "Tidak ada keluhan otologi aktif. Surveilans OMSK.";
      return cc ? `Keluhan utama: ${cc}. ${summary}` : summary;
    },
    objective: (ctx) => {
      const e = ctx.examination;
      const items: string[] = [];
      if (e["perforasi-sentral"]) items.push("perforasi sentral pars tensa");
      if (e["retraksi-atik"]) items.push("retraksi pars flaksida (red flag bahaya)");
      if (e["debris-putih"]) items.push("debris putih (curigai kolesteatoma — RED FLAG)");
      if (e["granulasi"]) items.push("jaringan granulasi");
      if (e["mukosa-edema"]) items.push("mukosa kavum edema");
      if (e["secret-purulen"]) items.push("sekret purulen di liang telinga");
      if (e["rinne-negatif"]) items.push("Rinne negatif");
      if (e["weber-lateralisasi"]) items.push("Weber lateralisasi ke telinga sakit");
      if (e["fistula-positif"]) items.push("tes fistula POSITIF (RED FLAG erosi kanal)");
      const head =
        items.length > 0
          ? `Otoskopi & klinis: ${items.join(", ")}.`
          : "Otoskopi: liang lapang, MT intak, refleks cahaya normal.";
      const perfType = ctx.scoring["perforation"]?.values.type ?? 0;
      const otorrheaStatus = ctx.scoring["otorrhea"]?.values.status ?? 0;
      const dbHL = ctx.scoring["hearing-loss"]?.values.dbHL ?? 0;
      const lines = [head];
      if (perfType > 0)
        lines.push(`Tipe perforasi: ${ctx.scoring["perforation"]?.result.interpretation}.`);
      if (otorrheaStatus > 0 || perfType > 0)
        lines.push(`Status otore: ${ctx.scoring["otorrhea"]?.result.interpretation}.`);
      if (dbHL >= 26)
        lines.push(`Pendengaran: ${ctx.scoring["hearing-loss"]?.result.interpretation}.`);
      return lines.join(" ");
    },
    assessment: (ctx) => {
      const dx = ctx.diagnoses[0]?.icd10Code ?? "H66.1";
      const e = ctx.examination;
      const bahaya =
        e["debris-putih"] || e["retraksi-atik"] || e["granulasi"] || e["fistula-positif"];
      const baseLine =
        dx === "H66.1"
          ? "OMSK tubotimpanik (TIPE AMAN, H66.1) — perforasi sentral pars tensa."
          : `${dx} per ICD-10.`;
      if (bahaya)
        return `${baseLine} **PERHATIAN**: ditemukan tanda yang menyarankan SWITCH ke evaluasi OMSK Bahaya (H66.2) — kolesteatoma / komplikasi belum dapat disingkirkan.`;
      const dryEar = ctx.scoring["otorrhea"]?.values.status === 0;
      if (dryEar)
        return `${baseLine} Fase tenang (telinga kering). Pertimbangkan rehabilitasi pendengaran via timpanoplasti bila kering ≥3 bulan.`;
      return `${baseLine} Fase aktif (otore) — fokus pada eradikasi infeksi & proteksi air.`;
    },
    plan: (ctx) => {
      const t = ctx.treatments;
      const lines: string[] = [];
      if (t["aural-toilet"]) lines.push("Aural toilet (96.52) hari ini");
      if (t["ofloksasin-topikal"])
        lines.push("Ofloksasin 0.3% tetes telinga 2× sehari × 10 hari");
      if (t["amoksisilin-asam-klavulanat"])
        lines.push("Amox-Clav 500/125mg 3× sehari × 7 hari (eksaserbasi)");
      if (t["audiometri"]) lines.push("Audiometri nada murni (95.41)");
      if (t["tympanoplasty"])
        lines.push(
          "Rencana timpanoplasti tipe I (19.4) — telinga harus kering ≥3 bulan, audiometri pra-bedah",
        );
      if (t["edukasi-proteksi-air"]) lines.push("Edukasi proteksi air masuk telinga");
      if (t["edukasi-follow-up"])
        lines.push("Edukasi tanda bahaya: vertigo / nyeri hebat / paresis wajah / demam");
      if (t["rujuk-bedah"]) lines.push("Rujuk bedah otologi");
      lines.push("Kontrol 2 minggu — evaluasi kekeringan telinga & respons.");
      return lines.join(". ") + ".";
    },
  },
  references: [
    {
      label: "PPK PERHATI-KL — OMSK tipe tubotimpanik (aman)",
    },
    {
      label: "AAO-HNS Clinical Practice Guideline: Chronic Otitis Media",
    },
    {
      label: "WHO grades of hearing impairment (2021)",
    },
  ],
};

export default spec;
