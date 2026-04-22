/**
 * Module 8 — Trauma Wajah & Maksilofasial (S02.x)
 * Reference: PPK PERHATI-KL · ATLS principles · Manson facial trauma
 *
 * Karakter: trauma · fraktur · imaging-driven decision · potensi komplikasi
 *           airway/CSF/perdarahan. Default primary S02.2 (nasal fracture =
 *           paling sering). RED FLAG-DRIVEN — 4 trigger emergency yang
 *           langsung men-switch ke EMERGENCY mode (banner merah).
 *
 * Anti-pattern yang dihindari: dokter tidak boleh "skip" red flag check.
 * Engine selalu evaluate emergency trigger setiap context change.
 */

import type { ModuleSpec } from "../types";

const spec: ModuleSpec = {
  id: "trauma-wajah",
  title: "Trauma Wajah & Maksilofasial",
  subspecialty: "Trauma",
  iconName: "shield-alert",
  tags: ["S02.x", "RED FLAG", "imaging", "fraktur"],

  // -------------------------------------------------------------------------
  // EMERGENCY trigger — fires on any 1 red flag
  // -------------------------------------------------------------------------
  emergencyTriggers: [
    {
      level: "red",
      title: "EMERGENCY · TRAUMA WAJAH KOMPLIKASI",
      message:
        "Red flag aktif. Prioritas: airway → bleeding control → C-spine immobilisasi → rujuk segera (IGD/ICU/Bedah Saraf bila CSF leak).",
      actions: [
        { id: "ttv-now", label: "Catat TTV + GCS sekarang" },
        { id: "rujuk-igd", label: "Rujuk IGD" },
      ],
      trigger: (ctx) => {
        const a = ctx.anamnesis;
        return !!(
          a["penurunan-kesadaran"] ||
          a["perdarahan-hebat"] ||
          a["gangguan-napas"] ||
          a["csf-rhinorrhea"]
        );
      },
    },
  ],

  // -------------------------------------------------------------------------
  // Diagnoses
  // -------------------------------------------------------------------------
  diagnoses: [
    {
      icd10Code: "S02.2",
      display: "Fraktur nasal (S02.2)",
      defaultPrimary: true,
      reasoning: "Fraktur wajah tersering; default primary saat trauma + deformitas.",
    },
    {
      icd10Code: "S02.6",
      display: "Fraktur mandibula (S02.6x)",
      reasoning: "Bila ada maloklusi / nyeri tekan mandibula / krepitasi",
    },
    {
      icd10Code: "S02.8",
      display: "Fraktur tulang wajah lain — orbita/zigoma (S02.8)",
      reasoning: "Bila ada periorbital edema + diplopia + enophthalmos",
    },
    {
      icd10Code: "S02.9",
      display: "Fraktur tulang wajah, tidak terinci (S02.9)",
    },
    {
      icd10Code: "S06.9",
      display: "Cedera intrakranial (S06.9) — komorbid",
      reasoning: "Pertimbangkan bila penurunan kesadaran / GCS<15",
    },
  ],

  // -------------------------------------------------------------------------
  // CDSS rules
  // -------------------------------------------------------------------------
  cdssRules: [
    {
      id: "csf-rhinorrhea-emergency",
      evaluate: (ctx) => {
        if (!ctx.anamnesis["csf-rhinorrhea"]) return null;
        return {
          ruleId: "csf-rhinorrhea-emergency",
          level: "emergency",
          message:
            "CSF rhinorrhea (+) — curiga fraktur basis kranii anterior. JANGAN tampon hidung. Konsul Bedah Saraf segera. Antibiotik profilaksis broad-spectrum.",
          reference: { label: "PERHATI-KL · Manson facial trauma" },
          suggestPrimaryIcd10: "S06.9",
        };
      },
    },
    {
      id: "airway-compromise",
      evaluate: (ctx) => {
        if (!ctx.anamnesis["gangguan-napas"]) return null;
        return {
          ruleId: "airway-compromise",
          level: "emergency",
          message:
            "Gangguan napas — kemungkinan obstruksi airway oleh edema/perdarahan/dislokasi. Siapkan airway management (intubasi atau cricothyroidotomy bila gagal).",
          reference: { label: "ATLS — primary survey" },
        };
      },
    },
    {
      id: "fraktur-nasal-mapping",
      evaluate: (ctx) => {
        const e = ctx.examination;
        const nasalAbnormal =
          e["nasal-deformitas"] || e["nasal-krepitasi"] || e["nasal-epistaksis-aktif"];
        if (!nasalAbnormal) return null;
        return {
          ruleId: "fraktur-nasal-mapping",
          level: "info",
          message:
            "Tanda fraktur nasal (+). Pertimbangkan closed reduction nasal (21.71) — optimal hari 5-10 (setelah edema turun).",
          reference: { label: "PERHATI-KL — closed reduction nasal" },
          suggestPrimaryIcd10: "S02.2",
          suggestTreatmentIds: ["closed-reduction-nasal"],
        };
      },
    },
    {
      id: "fraktur-orbital-mapping",
      evaluate: (ctx) => {
        const e = ctx.examination;
        const orbitalAbnormal =
          e["orbital-edema"] || e["orbital-diplopia"] || e["orbital-enophthalmos"];
        if (!orbitalAbnormal) return null;
        return {
          ruleId: "fraktur-orbital-mapping",
          level: "warn",
          message:
            "Tanda fraktur orbita (+). Wajib CT scan facial bone (axial+coronal). Bila enophthalmos progresif / diplopia persisten → rujuk Sp.BP / Sp.M untuk reduksi+plat.",
          reference: { label: "Manson facial trauma — orbital floor fracture" },
          suggestPrimaryIcd10: "S02.8",
          suggestTreatmentIds: ["ct-facial", "rujukan-bedah-plastik"],
        };
      },
    },
    {
      id: "fraktur-mandibular-mapping",
      evaluate: (ctx) => {
        const e = ctx.examination;
        const mandibAbnormal =
          e["mandib-maloklusi"] || e["mandib-nyeri-tekan"] || e["mandib-krepitasi"];
        if (!mandibAbnormal) return null;
        return {
          ruleId: "fraktur-mandibular-mapping",
          level: "warn",
          message:
            "Tanda fraktur mandibula (+). Wajib panoramic X-ray atau CT mandibula. Maloklusi → rujuk Sp.BM (Bedah Mulut) untuk ORIF.",
          reference: { label: "PERHATI-KL — fraktur mandibula" },
          suggestPrimaryIcd10: "S02.6",
          suggestTreatmentIds: ["xray-panoramic", "rujukan-bedah-mulut"],
        };
      },
    },
    {
      id: "imaging-decision",
      evaluate: (ctx) => {
        const e = ctx.examination;
        const a = ctx.anamnesis;
        const anyDeformity =
          e["nasal-deformitas"] ||
          e["nasal-krepitasi"] ||
          e["mandib-maloklusi"] ||
          e["mandib-krepitasi"] ||
          e["orbital-edema"] ||
          e["orbital-enophthalmos"];
        const minorOnly =
          a["nyeri-wajah"] && !anyDeformity && !a["penurunan-kesadaran"];

        if (minorOnly) {
          return {
            ruleId: "imaging-decision",
            level: "success",
            message:
              "Trauma minor (nyeri tanpa deformitas/red flag) → cukup evaluasi klinis + observasi 48 jam. Imaging tidak rutin.",
            reference: { label: "ATLS — selective imaging" },
          };
        }
        if (anyDeformity || a["penurunan-kesadaran"] || a["csf-rhinorrhea"]) {
          return {
            ruleId: "imaging-decision",
            level: "warn",
            message:
              "Deformitas / red flag (+) → CT scan facial bone (axial+coronal) gold standard. X-ray Waters/lateral hidung sebagai alternatif bila CT tidak tersedia.",
            reference: { label: "PERHATI-KL imaging trauma wajah" },
            suggestTreatmentIds: ["ct-facial"],
          };
        }
        return null;
      },
    },
    {
      id: "antibiotik-profilaksis",
      evaluate: (ctx) => {
        const a = ctx.anamnesis;
        const e = ctx.examination;
        const compoundOrCsf =
          e["nasal-luka-terbuka"] || a["csf-rhinorrhea"];
        if (!compoundOrCsf) return null;
        return {
          ruleId: "antibiotik-profilaksis",
          level: "info",
          message:
            "Fraktur terbuka / CSF leak → antibiotik profilaksis (cefadroxil/amoksiklav). Pertimbangkan toksoid tetanus bila status imunisasi tidak jelas.",
          reference: { label: "ATLS — open fracture management" },
          suggestTreatmentIds: ["cefadroxil-profilaksis"],
        };
      },
    },
  ],

  // -------------------------------------------------------------------------
  // Anamnesis (red flags grouped at top)
  // -------------------------------------------------------------------------
  anamnesis: {
    title: "Anamnesis",
    helper:
      "🔴 4 RED FLAG di atas — bila SALAH SATU YA, modul auto-switch ke EMERGENCY mode.",
    items: [
      // RED FLAGS
      {
        id: "penurunan-kesadaran",
        normalLabel: "Sadar penuh / GCS 15",
        abnormalLabel: "🔴 PENURUNAN KESADARAN / GCS <15",
        tag: "red-flag",
      },
      {
        id: "perdarahan-hebat",
        normalLabel: "Tidak ada perdarahan aktif",
        abnormalLabel: "🔴 PERDARAHAN HEBAT (sulit dikontrol)",
        tag: "red-flag",
      },
      {
        id: "gangguan-napas",
        normalLabel: "Pernapasan adekuat",
        abnormalLabel: "🔴 GANGGUAN NAPAS / stridor / SpO2<94%",
        tag: "red-flag",
      },
      {
        id: "csf-rhinorrhea",
        normalLabel: "Tidak ada CSF rhinorrhea",
        abnormalLabel: "🔴 CSF RHINORRHEA (rinorea jernih asin)",
        tag: "red-flag",
      },
      // Standard anamnesis
      {
        id: "riwayat-trauma",
        normalLabel: "Tidak ada riwayat trauma",
        abnormalLabel: "Ada riwayat trauma wajah",
        tag: "trauma",
      },
      {
        id: "nyeri-wajah",
        normalLabel: "Tidak nyeri",
        abnormalLabel: "Nyeri wajah (sebut lokasi di catatan)",
      },
      {
        id: "deformitas-tampak",
        normalLabel: "Tanpa deformitas tampak",
        abnormalLabel: "Pasien menyadari deformitas wajah/hidung",
      },
      {
        id: "trismus",
        normalLabel: "Mulut dapat dibuka normal",
        abnormalLabel: "Trismus (sulit membuka mulut)",
      },
      {
        id: "diplopia",
        normalLabel: "Tidak ada diplopia",
        abnormalLabel: "Penglihatan ganda (diplopia)",
      },
      {
        id: "obstruksi-nasal",
        normalLabel: "Hidung tidak tersumbat",
        abnormalLabel: "Hidung tersumbat post-trauma",
      },
      {
        id: "epistaksis",
        normalLabel: "Tidak ada epistaksis",
        abnormalLabel: "Epistaksis berulang/berkepanjangan",
      },
      {
        id: "anosmia",
        normalLabel: "Penciuman normal",
        abnormalLabel: "Anosmia / hiposmia post-trauma",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Examination — 3 zona (urutan: nasal → orbital → mandibular)
  // -------------------------------------------------------------------------
  examination: {
    title: "Pemeriksaan Fisik (3 Zona)",
    helper:
      "Periksa zona NASAL → ORBITAL → MANDIBULAR. Tap temuan abnormal — engine akan auto-suggest fraktur mapping.",
    items: [
      // Zona NASAL
      {
        id: "nasal-deformitas",
        normalLabel: "Hidung simetris, tanpa deformitas",
        abnormalLabel: "[NASAL] Deformitas hidung / pergeseran piramida",
        tag: "zona-nasal",
      },
      {
        id: "nasal-krepitasi",
        normalLabel: "Tanpa krepitasi nasal",
        abnormalLabel: "[NASAL] Krepitasi pada palpasi piramida hidung",
        tag: "zona-nasal",
      },
      {
        id: "nasal-epistaksis-aktif",
        normalLabel: "Tanpa epistaksis aktif",
        abnormalLabel: "[NASAL] Epistaksis aktif",
        tag: "zona-nasal",
      },
      {
        id: "nasal-deviasi-septum",
        normalLabel: "Septum tidak deviasi signifikan",
        abnormalLabel: "[NASAL] Deviasi septum / hematoma septal",
        tag: "zona-nasal",
      },
      {
        id: "nasal-luka-terbuka",
        normalLabel: "Tanpa laserasi nasal",
        abnormalLabel: "[NASAL] Luka terbuka / fraktur compound",
        tag: "zona-nasal",
      },
      // Zona ORBITAL
      {
        id: "orbital-edema",
        normalLabel: "Tanpa periorbital edema",
        abnormalLabel: "[ORBITAL] Periorbital edema / ekimosis (raccoon eyes)",
        tag: "zona-orbital",
      },
      {
        id: "orbital-diplopia",
        normalLabel: "Gerakan bola mata normal",
        abnormalLabel: "[ORBITAL] Diplopia saat upgaze (entrapment otot)",
        tag: "zona-orbital",
      },
      {
        id: "orbital-enophthalmos",
        normalLabel: "Tanpa enophthalmos",
        abnormalLabel: "[ORBITAL] Enophthalmos (mata tenggelam)",
        tag: "zona-orbital",
      },
      {
        id: "orbital-paresthesia-v2",
        normalLabel: "Sensori N.V2 normal",
        abnormalLabel: "[ORBITAL] Paresthesia infraorbital (N.V2)",
        tag: "zona-orbital",
      },
      // Zona MANDIBULAR
      {
        id: "mandib-maloklusi",
        normalLabel: "Oklusi gigi normal",
        abnormalLabel: "[MANDIB] Maloklusi (oklusi tidak match)",
        tag: "zona-mandib",
      },
      {
        id: "mandib-nyeri-tekan",
        normalLabel: "Tanpa nyeri tekan mandibula",
        abnormalLabel: "[MANDIB] Nyeri tekan corpus/ramus/kondilus",
        tag: "zona-mandib",
      },
      {
        id: "mandib-krepitasi",
        normalLabel: "Tanpa krepitasi mandibula",
        abnormalLabel: "[MANDIB] Krepitasi pada palpasi mandibula",
        tag: "zona-mandib",
      },
      {
        id: "mandib-trismus-pemfis",
        normalLabel: "Buka mulut ≥40mm",
        abnormalLabel: "[MANDIB] Buka mulut <30mm (trismus)",
        tag: "zona-mandib",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Pathway
  // -------------------------------------------------------------------------
  pathway: [
    { id: "p-1-abc", title: "Stabilkan ABC (Airway, Breathing, Circulation)" },
    { id: "p-2-survey", title: "Primary + secondary survey trauma menyeluruh" },
    { id: "p-3-zona", title: "Identifikasi zona fraktur (3 zona: nasal/orbital/mandibular)" },
    { id: "p-4-imaging", title: "Imaging selektif (CT facial bone bila deformitas/red flag)" },
    { id: "p-5-tx", title: "Tatalaksana: konservatif / closed reduction / ORIF" },
    { id: "p-6-followup", title: "Follow-up: H+3 (edema turun), H+10 (timing reduksi)" },
  ],

  // -------------------------------------------------------------------------
  // Treatments
  // -------------------------------------------------------------------------
  treatments: [
    {
      id: "closed-reduction-nasal",
      label: "Closed reduction fraktur nasal",
      category: "tindakan",
      icd9Code: "21.71",
      icd9NameId: "Reposisi tertutup fraktur nasal",
      feeIdr: 3_000_000,
      isOperative: true,
      reference: {
        label: "PERHATI-KL — optimal hari 5-10 (setelah edema turun, sebelum union)",
      },
    },
    {
      id: "rujukan-bedah-plastik",
      label: "Rujuk Sp.BP / Sp.M (fraktur orbita kompleks)",
      category: "rujukan",
      reference: { label: "Manson — orbital floor reconstruction" },
    },
    {
      id: "rujukan-bedah-mulut",
      label: "Rujuk Sp.BM (fraktur mandibula → ORIF)",
      category: "rujukan",
      icd9Code: "76.74",
      icd9NameId: "ORIF mandibula",
      reference: { label: "PERHATI-KL — fraktur mandibula displaced" },
    },
    {
      id: "rujukan-bedah-saraf",
      label: "Rujuk Bedah Saraf (CSF leak / fraktur basis kranii)",
      category: "rujukan",
      reference: { label: "ATLS — basal skull fracture management" },
    },
    {
      id: "ct-facial",
      label: "CT scan facial bone (axial + coronal)",
      category: "tindakan",
      icd9Code: "87.03",
      icd9NameId: "CT scan facial",
      feeIdr: 850_000,
    },
    {
      id: "xray-panoramic",
      label: "X-ray panoramic mandibula",
      category: "tindakan",
      icd9Code: "87.16",
      icd9NameId: "X-ray panoramic",
      feeIdr: 350_000,
    },
    {
      id: "xray-waters",
      label: "X-ray Waters + lateral hidung",
      category: "tindakan",
      icd9Code: "87.16",
      icd9NameId: "X-ray sinus paranasal",
      feeIdr: 250_000,
    },
    {
      id: "konservatif",
      label: "Konservatif: kompres dingin 48 jam + elevasi kepala + edukasi",
      category: "edukasi",
    },
    {
      id: "paracetamol-trauma",
      label: "Paracetamol 500mg PO 3-4×/hari (analgesik)",
      category: "medikamentosa",
      prescription: {
        drugName: "Paracetamol",
        genericName: "Paracetamol",
        strength: "500 mg",
        drugForm: "tablet",
        dose: "500 mg",
        frequency: "3-4× sehari (PRN)",
        duration: "5 hari",
        route: "oral",
        instructions: "Bila nyeri. Maks 4 g/hari.",
        quantity: 20,
        unit: "tablet",
      },
    },
    {
      id: "cefadroxil-profilaksis",
      label: "Cefadroxil 500mg PO 2×/hari (antibiotik profilaksis fraktur terbuka)",
      category: "medikamentosa",
      prescription: {
        drugName: "Cefadroxil",
        genericName: "Cefadroxil",
        strength: "500 mg",
        drugForm: "kapsul",
        dose: "500 mg",
        frequency: "2× sehari",
        duration: "7 hari",
        route: "oral",
        instructions: "Setelah makan. Habiskan.",
        quantity: 14,
        unit: "kapsul",
      },
      reference: { label: "ATLS — open fracture antibiotic prophylaxis" },
    },
    {
      id: "deksametason-edema",
      label: "Deksametason 0.5mg PO 3×/hari (anti-edema, 3 hari)",
      category: "medikamentosa",
      prescription: {
        drugName: "Deksametason",
        genericName: "Dexamethasone",
        strength: "0.5 mg",
        drugForm: "tablet",
        dose: "0.5 mg",
        frequency: "3× sehari",
        duration: "3 hari (tapering)",
        route: "oral",
        instructions: "Setelah makan. Tapering setelah 3 hari.",
        quantity: 9,
        unit: "tablet",
      },
    },
    {
      id: "tetanus-toksoid",
      label: "Tetanus toksoid (TT) booster (luka terbuka, status imunisasi tidak jelas)",
      category: "medikamentosa",
      prescription: {
        drugName: "Tetanus Toxoid",
        drugForm: "vial",
        dose: "0.5 ml",
        frequency: "Single dose",
        route: "IM",
        instructions: "IM deltoid",
        quantity: 1,
        unit: "vial",
      },
    },
  ],

  // -------------------------------------------------------------------------
  // Education
  // -------------------------------------------------------------------------
  education: {
    title: "Edukasi Pasien — Trauma Wajah",
    bullets: [
      "Kompres dingin 48 jam pertama (15 menit on / 15 menit off) untuk mengurangi edema.",
      "Elevasi kepala 30° saat tidur — mengurangi pembengkakan wajah.",
      "JANGAN menghembuskan hidung kuat-kuat (bisa menyebabkan emfisema subkutan / mendorong CSF leak).",
      "Hindari makanan keras / mengunyah berat bila ada kecurigaan fraktur mandibula.",
      "Bila keluar cairan jernih dari hidung yang asin → segera kembali (kemungkinan CSF leak).",
      "Pembengkakan dan memar (lebam) normal sampai 7-14 hari. Memar kuning kehijauan = penyembuhan normal.",
      "Bila ada perubahan penglihatan, baal di pipi, atau gigitan terasa berbeda → kontrol lebih cepat.",
      "Kontrol H+3 untuk evaluasi (edema turun → bisa lihat lebih jelas), H+5-10 untuk timing reduksi nasal.",
    ],
    channels: ["print", "wa"],
  },

  // -------------------------------------------------------------------------
  // SOAP composer
  // -------------------------------------------------------------------------
  soapMapping: {
    subjective: (ctx) => {
      const a = ctx.anamnesis;
      const redFlags: string[] = [];
      if (a["penurunan-kesadaran"]) redFlags.push("PENURUNAN KESADARAN");
      if (a["perdarahan-hebat"]) redFlags.push("PERDARAHAN HEBAT");
      if (a["gangguan-napas"]) redFlags.push("GANGGUAN NAPAS");
      if (a["csf-rhinorrhea"]) redFlags.push("CSF RHINORRHEA");

      const positives: string[] = [];
      if (a["nyeri-wajah"]) positives.push("nyeri wajah");
      if (a["deformitas-tampak"]) positives.push("deformitas tampak");
      if (a["trismus"]) positives.push("trismus");
      if (a["diplopia"]) positives.push("diplopia");
      if (a["obstruksi-nasal"]) positives.push("obstruksi nasal");
      if (a["epistaksis"]) positives.push("epistaksis");
      if (a["anosmia"]) positives.push("anosmia");

      const cc = ctx.chiefComplaint?.trim() || "Trauma wajah";
      const flagLine = redFlags.length
        ? `🔴 RED FLAG: ${redFlags.join(", ")}.`
        : "";
      const sx = positives.length
        ? `Pasien mengeluh ${positives.join(", ")}.`
        : "Tanpa keluhan tambahan saat ini.";
      return [cc + ".", flagLine, sx].filter(Boolean).join(" ");
    },
    objective: (ctx) => {
      const e = ctx.examination;
      const nasal: string[] = [];
      if (e["nasal-deformitas"]) nasal.push("deformitas hidung");
      if (e["nasal-krepitasi"]) nasal.push("krepitasi piramida");
      if (e["nasal-epistaksis-aktif"]) nasal.push("epistaksis aktif");
      if (e["nasal-deviasi-septum"]) nasal.push("deviasi septum/hematoma");
      if (e["nasal-luka-terbuka"]) nasal.push("LUKA TERBUKA");

      const orbital: string[] = [];
      if (e["orbital-edema"]) orbital.push("periorbital edema/ekimosis");
      if (e["orbital-diplopia"]) orbital.push("diplopia upgaze");
      if (e["orbital-enophthalmos"]) orbital.push("enophthalmos");
      if (e["orbital-paresthesia-v2"]) orbital.push("paresthesia N.V2");

      const mandib: string[] = [];
      if (e["mandib-maloklusi"]) mandib.push("maloklusi");
      if (e["mandib-nyeri-tekan"]) mandib.push("nyeri tekan mandibula");
      if (e["mandib-krepitasi"]) mandib.push("krepitasi mandibula");
      if (e["mandib-trismus-pemfis"]) mandib.push("trismus <30mm");

      const sections: string[] = [];
      if (nasal.length) sections.push(`Zona NASAL: ${nasal.join(", ")}`);
      if (orbital.length) sections.push(`Zona ORBITAL: ${orbital.join(", ")}`);
      if (mandib.length) sections.push(`Zona MANDIBULAR: ${mandib.join(", ")}`);

      return sections.length
        ? sections.join(". ") + "."
        : "Pemeriksaan 3 zona dalam batas normal.";
    },
    assessment: (ctx) => {
      const primary = ctx.diagnoses.find((d) => d.primary);
      const e = ctx.examination;
      const a = ctx.anamnesis;

      const fractures: string[] = [];
      if (e["nasal-deformitas"] || e["nasal-krepitasi"]) fractures.push("nasal (S02.2)");
      if (e["orbital-edema"] || e["orbital-enophthalmos"])
        fractures.push("orbita (S02.8)");
      if (e["mandib-maloklusi"] || e["mandib-krepitasi"])
        fractures.push("mandibula (S02.6)");

      const lines: string[] = [];
      if (primary) lines.push(`${primary.icd10Code} primary`);
      if (fractures.length) lines.push(`Suspect fraktur: ${fractures.join(" + ")}`);

      const redFlagAny =
        a["penurunan-kesadaran"] ||
        a["perdarahan-hebat"] ||
        a["gangguan-napas"] ||
        a["csf-rhinorrhea"];
      if (redFlagAny) lines.push("🔴 RED FLAG aktif");
      else lines.push("Red flag: tidak ada");

      return lines.length ? lines.join(". ") + "." : "Trauma wajah, fraktur belum dipetakan.";
    },
    plan: (ctx) => {
      const t = ctx.treatments;
      const tx: string[] = [];
      if (t["closed-reduction-nasal"]) tx.push("Closed reduction nasal (jadwal H+5-10)");
      if (t["ct-facial"]) tx.push("CT scan facial bone");
      if (t["xray-panoramic"]) tx.push("X-ray panoramic mandibula");
      if (t["xray-waters"]) tx.push("X-ray Waters + lateral hidung");
      if (t["rujukan-bedah-plastik"]) tx.push("Rujuk Sp.BP/Sp.M");
      if (t["rujukan-bedah-mulut"]) tx.push("Rujuk Sp.BM untuk ORIF");
      if (t["rujukan-bedah-saraf"]) tx.push("Rujuk Bedah Saraf (CSF leak)");
      if (t["paracetamol-trauma"]) tx.push("Paracetamol 500mg PRN × 5 hari");
      if (t["cefadroxil-profilaksis"]) tx.push("Cefadroxil 500mg 2× × 7 hari");
      if (t["deksametason-edema"]) tx.push("Dexa 0.5mg 3× × 3 hari (tapering)");
      if (t["tetanus-toksoid"]) tx.push("TT booster IM");
      if (t["konservatif"]) tx.push("Kompres dingin 48 jam + elevasi kepala");
      const followUp = "Kontrol H+3 (edema), H+10 (reduksi nasal optimal).";
      return tx.length ? `${tx.join(". ")}. ${followUp}` : `Edukasi + observasi. ${followUp}`;
    },
  },

  references: [
    { label: "PPK PERHATI-KL — Trauma Wajah & Maksilofasial" },
    { label: "ATLS 10th edition — Primary survey + facial trauma" },
    { label: "Manson PN — Facial fractures (Plastic Surgery, 4th ed.)" },
    { label: "Hopper RA, et al. CT for facial trauma — gold standard. Plast Reconstr Surg 2006" },
  ],
};

export default spec;
