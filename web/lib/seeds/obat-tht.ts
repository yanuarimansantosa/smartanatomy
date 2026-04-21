// Obat THT umum untuk picker resep MVP.
// Dosis preset = preset dewasa rata-rata; dokter wajib verifikasi sebelum sign.
// Brand: nama generik utama; sediaan & rute mengikuti enum di db/schema.ts.

export type DrugForm =
  | "tablet"
  | "kapsul"
  | "sirup"
  | "tetes"
  | "spray"
  | "salep"
  | "injeksi"
  | "lainnya";

export type DrugRoute =
  | "oral"
  | "topical"
  | "inhalasi"
  | "tetes"
  | "injeksi"
  | "lainnya";

export type ObatEntry = {
  drugName: string;
  genericName?: string;
  drugForm: DrugForm;
  strength: string;
  defaultDose: string;
  defaultFrequency: string;
  defaultDuration: string;
  route: DrugRoute;
  category:
    | "antibiotik"
    | "analgesik"
    | "antihistamin"
    | "kortikosteroid"
    | "dekongestan"
    | "telinga"
    | "hidung"
    | "mukolitik"
    | "antiemetik"
    | "vestibular";
};

export const OBAT_THT: ObatEntry[] = [
  // Antibiotik oral
  { drugName: "Amoksisilin", genericName: "Amoxicillin", drugForm: "kapsul", strength: "500 mg", defaultDose: "1 kapsul", defaultFrequency: "3x sehari", defaultDuration: "5 hari", route: "oral", category: "antibiotik" },
  { drugName: "Co-amoxiclav", genericName: "Amoxicillin + Clavulanate", drugForm: "tablet", strength: "625 mg", defaultDose: "1 tablet", defaultFrequency: "2x sehari", defaultDuration: "7 hari", route: "oral", category: "antibiotik" },
  { drugName: "Cefadroxil", genericName: "Cefadroxil", drugForm: "kapsul", strength: "500 mg", defaultDose: "1 kapsul", defaultFrequency: "2x sehari", defaultDuration: "5 hari", route: "oral", category: "antibiotik" },
  { drugName: "Cefixime", genericName: "Cefixime", drugForm: "kapsul", strength: "100 mg", defaultDose: "1 kapsul", defaultFrequency: "2x sehari", defaultDuration: "5 hari", route: "oral", category: "antibiotik" },
  { drugName: "Azitromisin", genericName: "Azithromycin", drugForm: "tablet", strength: "500 mg", defaultDose: "1 tablet", defaultFrequency: "1x sehari", defaultDuration: "3 hari", route: "oral", category: "antibiotik" },
  { drugName: "Levofloxacin", genericName: "Levofloxacin", drugForm: "tablet", strength: "500 mg", defaultDose: "1 tablet", defaultFrequency: "1x sehari", defaultDuration: "5 hari", route: "oral", category: "antibiotik" },
  { drugName: "Ciprofloxacin", genericName: "Ciprofloxacin", drugForm: "tablet", strength: "500 mg", defaultDose: "1 tablet", defaultFrequency: "2x sehari", defaultDuration: "7 hari", route: "oral", category: "antibiotik" },

  // Analgesik
  { drugName: "Paracetamol", genericName: "Acetaminophen", drugForm: "tablet", strength: "500 mg", defaultDose: "1 tablet", defaultFrequency: "3x sehari", defaultDuration: "PRN — bila demam/nyeri", route: "oral", category: "analgesik" },
  { drugName: "Ibuprofen", genericName: "Ibuprofen", drugForm: "tablet", strength: "400 mg", defaultDose: "1 tablet", defaultFrequency: "3x sehari setelah makan", defaultDuration: "3 hari", route: "oral", category: "analgesik" },
  { drugName: "Asam Mefenamat", genericName: "Mefenamic acid", drugForm: "tablet", strength: "500 mg", defaultDose: "1 tablet", defaultFrequency: "3x sehari setelah makan", defaultDuration: "3 hari", route: "oral", category: "analgesik" },

  // Antihistamin
  { drugName: "Loratadine", genericName: "Loratadine", drugForm: "tablet", strength: "10 mg", defaultDose: "1 tablet", defaultFrequency: "1x sehari", defaultDuration: "7 hari", route: "oral", category: "antihistamin" },
  { drugName: "Cetirizine", genericName: "Cetirizine", drugForm: "tablet", strength: "10 mg", defaultDose: "1 tablet", defaultFrequency: "1x sehari malam", defaultDuration: "7 hari", route: "oral", category: "antihistamin" },
  { drugName: "Desloratadine", genericName: "Desloratadine", drugForm: "tablet", strength: "5 mg", defaultDose: "1 tablet", defaultFrequency: "1x sehari", defaultDuration: "10 hari", route: "oral", category: "antihistamin" },
  { drugName: "CTM (Klorfeniramin)", genericName: "Chlorpheniramine", drugForm: "tablet", strength: "4 mg", defaultDose: "1 tablet", defaultFrequency: "3x sehari", defaultDuration: "5 hari", route: "oral", category: "antihistamin" },

  // Kortikosteroid
  { drugName: "Metilprednisolon", genericName: "Methylprednisolone", drugForm: "tablet", strength: "4 mg", defaultDose: "1 tablet", defaultFrequency: "2x sehari setelah makan", defaultDuration: "3 hari, lalu tappering", route: "oral", category: "kortikosteroid" },
  { drugName: "Dexametason", genericName: "Dexamethasone", drugForm: "tablet", strength: "0.5 mg", defaultDose: "1 tablet", defaultFrequency: "3x sehari", defaultDuration: "3 hari", route: "oral", category: "kortikosteroid" },

  // Hidung topikal
  { drugName: "Mometasone Furoate Spray Hidung", genericName: "Mometasone furoate", drugForm: "spray", strength: "50 mcg/spray", defaultDose: "2 semprot tiap lubang", defaultFrequency: "1x sehari pagi", defaultDuration: "30 hari", route: "topical", category: "hidung" },
  { drugName: "Fluticasone Spray Hidung", genericName: "Fluticasone propionate", drugForm: "spray", strength: "50 mcg/spray", defaultDose: "2 semprot tiap lubang", defaultFrequency: "1x sehari", defaultDuration: "30 hari", route: "topical", category: "hidung" },
  { drugName: "Oxymetazoline Spray Hidung", genericName: "Oxymetazoline", drugForm: "spray", strength: "0.05%", defaultDose: "1-2 semprot tiap lubang", defaultFrequency: "2x sehari", defaultDuration: "Maks 5 hari", route: "topical", category: "dekongestan" },

  // Telinga topikal
  { drugName: "Tetes Telinga Ofloxacin", genericName: "Ofloxacin", drugForm: "tetes", strength: "0.3%", defaultDose: "5 tetes", defaultFrequency: "2x sehari", defaultDuration: "7 hari", route: "tetes", category: "telinga" },
  { drugName: "Tetes Telinga Karbol Gliserin", genericName: "Carbol glycerin 10%", drugForm: "tetes", strength: "10%", defaultDose: "3-5 tetes", defaultFrequency: "2x sehari", defaultDuration: "5 hari", route: "tetes", category: "telinga" },
  { drugName: "Tetes Telinga Ciprofloxacin + Hidrokortison", genericName: "Ciprofloxacin + Hydrocortisone", drugForm: "tetes", strength: "0.2% / 1%", defaultDose: "3-4 tetes", defaultFrequency: "2x sehari", defaultDuration: "7 hari", route: "tetes", category: "telinga" },

  // Vestibular
  { drugName: "Betahistine", genericName: "Betahistine", drugForm: "tablet", strength: "24 mg", defaultDose: "1 tablet", defaultFrequency: "2x sehari", defaultDuration: "14 hari", route: "oral", category: "vestibular" },
  { drugName: "Dimenhidrinat", genericName: "Dimenhydrinate", drugForm: "tablet", strength: "50 mg", defaultDose: "1 tablet", defaultFrequency: "3x sehari", defaultDuration: "PRN — vertigo/mual", route: "oral", category: "antiemetik" },
  { drugName: "Flunarizine", genericName: "Flunarizine", drugForm: "tablet", strength: "5 mg", defaultDose: "1-2 tablet", defaultFrequency: "1x sehari malam", defaultDuration: "30 hari", route: "oral", category: "vestibular" },

  // Mukolitik
  { drugName: "Ambroxol", genericName: "Ambroxol", drugForm: "tablet", strength: "30 mg", defaultDose: "1 tablet", defaultFrequency: "3x sehari", defaultDuration: "5 hari", route: "oral", category: "mukolitik" },
  { drugName: "N-Asetilsistein", genericName: "N-Acetylcysteine", drugForm: "kapsul", strength: "200 mg", defaultDose: "1 kapsul", defaultFrequency: "3x sehari", defaultDuration: "5 hari", route: "oral", category: "mukolitik" },

  // Pediatrik (sirup) — top 3
  { drugName: "Amoksisilin Sirup", genericName: "Amoxicillin", drugForm: "sirup", strength: "125 mg/5 ml", defaultDose: "1 sendok takar (5 ml)", defaultFrequency: "3x sehari", defaultDuration: "5 hari", route: "oral", category: "antibiotik" },
  { drugName: "Paracetamol Sirup", genericName: "Acetaminophen", drugForm: "sirup", strength: "120 mg/5 ml", defaultDose: "Sesuai BB (10-15 mg/kg)", defaultFrequency: "3-4x sehari", defaultDuration: "PRN — demam", route: "oral", category: "analgesik" },
  { drugName: "Cetirizine Sirup", genericName: "Cetirizine", drugForm: "sirup", strength: "5 mg/5 ml", defaultDose: "1 sendok takar (5 ml)", defaultFrequency: "1x sehari", defaultDuration: "7 hari", route: "oral", category: "antihistamin" },
];

export function searchObat(query: string): ObatEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return OBAT_THT.slice(0, 20);
  return OBAT_THT.filter(
    (e) =>
      e.drugName.toLowerCase().includes(q) ||
      e.genericName?.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q),
  ).slice(0, 30);
}
