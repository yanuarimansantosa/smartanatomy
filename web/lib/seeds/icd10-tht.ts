// ICD-10 THT-KL — kurasi resmi dr. Yanuar (clean, official codes).
// Kelompok mengikuti regio anatomis: telinga, hidung & sinus, laring-faring,
// tumor, dan trauma. Dipakai oleh picker diagnosa & engine auto-coding.

export type Icd10Group =
  | "telinga"
  | "hidung"
  | "laring-faring"
  | "tumor"
  | "trauma"
  | "lain";

export type Icd10Entry = {
  code: string;
  nameId: string;
  nameEn: string;
  group: Icd10Group;
  // Kata kunci tambahan untuk auto-coding (sinonim klinis, singkatan, ejaan
  // alternatif). Tidak ditampilkan di UI; hanya dipakai matcher.
  keywords?: string[];
};

export const ICD10_THT: Icd10Entry[] = [
  // ========== TELINGA ==========
  { code: "H61.2", nameId: "Serumen prop / impaksi serumen", nameEn: "Impacted cerumen", group: "telinga", keywords: ["serumen", "kotoran telinga", "earwax"] },
  { code: "T16", nameId: "Benda asing di telinga", nameEn: "Foreign body in ear", group: "telinga", keywords: ["corpus alienum", "benda asing telinga", "fb ear"] },
  { code: "H60.0", nameId: "Abses telinga luar", nameEn: "Abscess of external ear", group: "telinga", keywords: ["abses aurikula"] },
  { code: "H60.1", nameId: "Selulitis telinga luar", nameEn: "Cellulitis of external ear", group: "telinga", keywords: ["selulitis aurikula"] },
  { code: "H60.3", nameId: "Otitis eksterna difusa", nameEn: "Other infective otitis externa (diffuse)", group: "telinga", keywords: ["oe difusa", "swimmer ear", "otitis eksterna"] },
  { code: "B37.2", nameId: "Otomikosis (Candida)", nameEn: "Candidiasis of skin and nail (otomycosis)", group: "telinga", keywords: ["jamur telinga", "kandida telinga"] },
  { code: "B44.8", nameId: "Otomikosis (Aspergillus)", nameEn: "Other forms of aspergillosis (otomycosis)", group: "telinga", keywords: ["jamur telinga", "aspergillus telinga"] },
  { code: "H66.0", nameId: "Otitis media akut supuratif (OMA)", nameEn: "Acute suppurative otitis media", group: "telinga", keywords: ["oma", "otitis media akut"] },
  { code: "H65.0", nameId: "Otitis media efusi akut (OME akut)", nameEn: "Acute serous otitis media", group: "telinga", keywords: ["ome akut", "ome", "otitis media efusi", "glue ear"] },
  { code: "H65.2", nameId: "Otitis media efusi kronik (OME kronik)", nameEn: "Chronic serous otitis media", group: "telinga", keywords: ["ome kronik", "otitis media efusi kronik"] },
  { code: "H66.1", nameId: "OMSK benigna aktif (tubotimpani)", nameEn: "Chronic tubotympanic suppurative otitis media", group: "telinga", keywords: ["omsk benigna", "omsk tubotimpani", "csom benign"] },
  { code: "H66.2", nameId: "OMSK maligna (atikoantral)", nameEn: "Chronic atticoantral suppurative otitis media", group: "telinga", keywords: ["omsk maligna", "omsk atikoantral", "csom dangerous"] },
  { code: "H71", nameId: "Kolesteatoma telinga tengah", nameEn: "Cholesteatoma of middle ear", group: "telinga", keywords: ["kolesteatom"] },
  { code: "H90.3", nameId: "Tuli sensorineural bilateral", nameEn: "Sensorineural hearing loss, bilateral", group: "telinga", keywords: ["snhl", "tuli sn", "tuli sensorineural"] },
  { code: "H90.6", nameId: "Tuli campuran konduktif & sensorineural", nameEn: "Mixed conductive and sensorineural hearing loss", group: "telinga", keywords: ["mixed hearing loss", "tuli campuran"] },
  { code: "H81.1", nameId: "BPPV (vertigo posisional benigna)", nameEn: "Benign paroxysmal vertigo", group: "telinga", keywords: ["bppv", "vertigo posisional", "vertigo perifer"] },
  { code: "H81.0", nameId: "Penyakit Meniere", nameEn: "Ménière disease", group: "telinga", keywords: ["meniere", "hidrops endolimfe"] },
  { code: "H93.1", nameId: "Tinnitus", nameEn: "Tinnitus", group: "telinga", keywords: ["telinga berdenging", "tinitus"] },

  // ========== HIDUNG & SINUS ==========
  { code: "J01", nameId: "Sinusitis akut", nameEn: "Acute sinusitis", group: "hidung", keywords: ["sinusitis akut"] },
  { code: "J01.0", nameId: "Sinusitis maksilaris akut", nameEn: "Acute maxillary sinusitis", group: "hidung", keywords: ["sinusitis maksila akut"] },
  { code: "J32", nameId: "Sinusitis kronik", nameEn: "Chronic sinusitis", group: "hidung", keywords: ["sinusitis kronik", "crs"] },
  { code: "J32.0", nameId: "Sinusitis maksilaris kronik", nameEn: "Chronic maxillary sinusitis", group: "hidung", keywords: ["sinusitis maksila kronik"] },
  { code: "J30.0", nameId: "Rinitis vasomotor", nameEn: "Vasomotor rhinitis", group: "hidung", keywords: ["rinitis non-alergi", "vasomotor"] },
  { code: "J30.4", nameId: "Rinitis alergi", nameEn: "Allergic rhinitis, unspecified", group: "hidung", keywords: ["rinitis alergi", "allergic rhinitis", "ar"] },
  { code: "J33.0", nameId: "Polip kavum nasi", nameEn: "Polyp of nasal cavity", group: "hidung", keywords: ["polip hidung", "polip nasi"] },
  { code: "J34.2", nameId: "Deviasi septum nasi", nameEn: "Deviated nasal septum", group: "hidung", keywords: ["septum deviasi", "dns", "deviasi septum"] },
  { code: "J34.3", nameId: "Hipertrofi konka", nameEn: "Hypertrophy of nasal turbinates", group: "hidung", keywords: ["hipertrofi konka", "konka edema"] },
  { code: "J34.8", nameId: "Perforasi septum hidung", nameEn: "Other specified disorders of nose (septal perforation)", group: "hidung", keywords: ["perforasi septum"] },
  { code: "R04.0", nameId: "Epistaksis (mimisan)", nameEn: "Epistaxis", group: "hidung", keywords: ["mimisan", "perdarahan hidung"] },
  { code: "J34.0", nameId: "Abses / furunkel hidung", nameEn: "Abscess, furuncle and carbuncle of nose", group: "hidung", keywords: ["abses hidung", "furunkel hidung"] },
  { code: "G47.33", nameId: "OSAS (Obstructive Sleep Apnea Syndrome)", nameEn: "Obstructive sleep apnea (adult, pediatric)", group: "hidung", keywords: ["osas", "sleep apnea", "ngorok", "snoring"] },

  // ========== LARING-FARING ==========
  { code: "J03.0", nameId: "Tonsilitis streptokokus akut", nameEn: "Streptococcal tonsillitis", group: "laring-faring", keywords: ["tonsilitis akut", "tonsilitis strep"] },
  { code: "J03.9", nameId: "Tonsilitis akut, tidak ditentukan", nameEn: "Acute tonsillitis, unspecified", group: "laring-faring", keywords: ["tonsilitis akut"] },
  { code: "J35.0", nameId: "Tonsilitis kronik", nameEn: "Chronic tonsillitis", group: "laring-faring", keywords: ["tonsilitis kronis"] },
  { code: "J35.1", nameId: "Hipertrofi tonsil", nameEn: "Hypertrophy of tonsils", group: "laring-faring", keywords: ["tonsil membesar", "tonsil hipertrofi"] },
  { code: "J35.2", nameId: "Hipertrofi adenoid", nameEn: "Hypertrophy of adenoids", group: "laring-faring", keywords: ["adenoid hipertrofi", "adenoid membesar"] },
  { code: "J02.0", nameId: "Faringitis streptokokus", nameEn: "Streptococcal pharyngitis", group: "laring-faring", keywords: ["faringitis strep"] },
  { code: "J02.9", nameId: "Faringitis akut, tidak ditentukan", nameEn: "Acute pharyngitis, unspecified", group: "laring-faring", keywords: ["faringitis akut", "sakit tenggorokan"] },
  { code: "J31.2", nameId: "Faringitis kronik", nameEn: "Chronic pharyngitis", group: "laring-faring", keywords: ["faringitis kronis"] },
  { code: "J04.0", nameId: "Laringitis akut", nameEn: "Acute laryngitis", group: "laring-faring", keywords: ["laringitis", "suara serak"] },
  { code: "J05.0", nameId: "Laringitis obstruktif akut (croup)", nameEn: "Acute obstructive laryngitis (croup)", group: "laring-faring", keywords: ["croup", "stridor anak"] },
  { code: "J37.0", nameId: "Laringitis kronik", nameEn: "Chronic laryngitis", group: "laring-faring", keywords: ["laringitis kronis"] },
  { code: "K21.0", nameId: "LPR (Laryngopharyngeal Reflux)", nameEn: "Gastro-oesophageal reflux disease with oesophagitis (LPR)", group: "laring-faring", keywords: ["lpr", "refluks laringofaring", "gerd"] },
  { code: "R13", nameId: "Disfagia", nameEn: "Dysphagia", group: "laring-faring", keywords: ["sulit menelan", "disfagia"] },
  { code: "J96.0", nameId: "Gagal napas akut", nameEn: "Acute respiratory failure", group: "laring-faring", keywords: ["gagal napas", "respiratory failure"] },

  // ========== TUMOR THT ==========
  { code: "C11.9", nameId: "Karsinoma nasofaring", nameEn: "Malignant neoplasm of nasopharynx, unspecified", group: "tumor", keywords: ["knf", "ca nasofaring", "npc"] },
  { code: "C32.9", nameId: "Karsinoma laring", nameEn: "Malignant neoplasm of larynx, unspecified", group: "tumor", keywords: ["ca laring", "kanker laring"] },
  { code: "C30.0", nameId: "Karsinoma rongga hidung", nameEn: "Malignant neoplasm of nasal cavity", group: "tumor", keywords: ["ca cavum nasi", "kanker hidung"] },
  { code: "C31.0", nameId: "Karsinoma sinus maksila", nameEn: "Malignant neoplasm of maxillary sinus", group: "tumor", keywords: ["ca sinus maksila"] },
  { code: "C09.9", nameId: "Karsinoma tonsil", nameEn: "Malignant neoplasm of tonsil, unspecified", group: "tumor", keywords: ["ca tonsil", "kanker tonsil"] },
  { code: "C10.9", nameId: "Karsinoma orofaring", nameEn: "Malignant neoplasm of oropharynx, unspecified", group: "tumor", keywords: ["ca orofaring"] },
  { code: "C12", nameId: "Karsinoma sinus piriformis", nameEn: "Malignant neoplasm of pyriform sinus", group: "tumor", keywords: ["ca hipofaring", "ca sinus piriformis"] },
  { code: "C73", nameId: "Karsinoma tiroid", nameEn: "Malignant neoplasm of thyroid gland", group: "tumor", keywords: ["ca tiroid", "kanker tiroid"] },
  { code: "C07", nameId: "Karsinoma kelenjar parotis", nameEn: "Malignant neoplasm of parotid gland", group: "tumor", keywords: ["ca parotis", "tumor parotis"] },

  // ========== TRAUMA THT ==========
  { code: "S02.2", nameId: "Fraktur tulang hidung", nameEn: "Fracture of nasal bones", group: "trauma", keywords: ["fraktur nasal", "patah hidung"] },
  { code: "S02.6", nameId: "Fraktur mandibula", nameEn: "Fracture of mandible", group: "trauma", keywords: ["fraktur rahang", "patah rahang"] },
  { code: "S02.3", nameId: "Fraktur dasar orbita", nameEn: "Fracture of orbital floor", group: "trauma", keywords: ["fraktur orbita", "blowout fracture"] },
  { code: "S03.0", nameId: "Dislokasi rahang (TMJ)", nameEn: "Dislocation of jaw", group: "trauma", keywords: ["dislokasi tmj", "rahang lepas"] },
];

export function searchIcd10(query: string): Icd10Entry[] {
  const q = query.trim().toLowerCase();
  if (!q) return ICD10_THT.slice(0, 20);
  return ICD10_THT.filter(
    (e) =>
      e.code.toLowerCase().includes(q) ||
      e.nameId.toLowerCase().includes(q) ||
      e.nameEn.toLowerCase().includes(q) ||
      e.keywords?.some((k) => k.toLowerCase().includes(q)),
  ).slice(0, 30);
}
