// ICD-9-CM tindakan THT-KL — kurasi resmi dr. Yanuar Iman Santosa Sp.THT-KL.
// Daftar lengkap non-operatif (A) + operatif (B) yang dipakai sehari-hari
// di praktik solo, plus tarif minimal (jasa) sebagai default rekomendasi.
//
// Catatan tarif:
//   - Semua dalam IDR (rupiah). minFee = batas bawah, maxFee = batas atas
//     (hanya diisi kalau aslinya range, mis. "Rp 315.000–330.000").
//   - Tarif ini adalah jasa MINIMAL. Dokter bisa override per kasus.
//   - Belum termasuk biaya alat habis pakai, kamar tindakan, atau anestesi.

export type Icd9Group =
  | "konsultasi"
  | "telinga"
  | "hidung"
  | "sinus"
  | "faring-mulut"
  | "laring-trakea"
  | "vestibular"
  | "alergi"
  | "onkologi"
  | "trauma-jahit"
  | "umum";

export type Icd9Entry = {
  code: string;
  nameId: string;
  nameEn: string;
  group: Icd9Group;
  isOperative: boolean;
  minFee: number;
  maxFee?: number;
  keywords?: string[];
};

// ========== A. NON-OPERATIF ==========
const NON_OP: Icd9Entry[] = [
  { code: "89.0", nameId: "Konsultasi", nameEn: "General consultation", group: "konsultasi", isOperative: false, minFee: 160000, keywords: ["konsul", "konsultasi"] },
  { code: "89.0", nameId: "Konsultasi konsultan", nameEn: "Consultant-level consultation", group: "konsultasi", isOperative: false, minFee: 250000, keywords: ["konsul konsultan", "subspesialis"] },
  { code: "89.0", nameId: "Konsultasi gawat darurat", nameEn: "Emergency consultation", group: "konsultasi", isOperative: false, minFee: 180000, keywords: ["konsul igd", "emergency"] },
  { code: "89.0", nameId: "Konsultasi gawat darurat konsultan", nameEn: "Consultant emergency consultation", group: "konsultasi", isOperative: false, minFee: 270000, keywords: ["konsul igd konsultan"] },

  { code: "97.38", nameId: "Angkat jahitan operasi (<6)", nameEn: "Suture removal (<6 stitches)", group: "umum", isOperative: false, minFee: 150000, keywords: ["angkat jahitan", "lepas hecting", "aff hecting"] },
  { code: "97.38", nameId: "Angkat jahitan operasi (>6)", nameEn: "Suture removal (>6 stitches)", group: "umum", isOperative: false, minFee: 165000, keywords: ["angkat jahitan banyak", "lepas hecting"] },
  { code: "97.01", nameId: "Angkat NGT", nameEn: "Removal of nasogastric tube", group: "umum", isOperative: false, minFee: 120000, keywords: ["lepas ngt", "angkat ngt"] },

  { code: "97.32", nameId: "Angkat tampon hidung anterior unilateral", nameEn: "Removal of anterior nasal packing, unilateral", group: "hidung", isOperative: false, minFee: 240000, keywords: ["lepas tampon hidung depan"] },
  { code: "97.32", nameId: "Angkat tampon hidung anterior bilateral", nameEn: "Removal of anterior nasal packing, bilateral", group: "hidung", isOperative: false, minFee: 285000 },
  { code: "97.32", nameId: "Angkat tampon hidung posterior", nameEn: "Removal of posterior nasal packing", group: "hidung", isOperative: false, minFee: 300000, keywords: ["lepas tampon belakang"] },

  { code: "21.29", nameId: "Apus hidung", nameEn: "Nasal swab", group: "hidung", isOperative: false, minFee: 120000, keywords: ["swab hidung"] },
  { code: "18.19", nameId: "Apus telinga", nameEn: "Ear swab", group: "telinga", isOperative: false, minFee: 120000, keywords: ["swab telinga"] },
  { code: "29.19", nameId: "Apus tenggorokan", nameEn: "Throat swab", group: "faring-mulut", isOperative: false, minFee: 120000, keywords: ["swab tenggorok", "throat culture"] },

  { code: "93.89", nameId: "Canalith Repositioning Therapy (CRT)", nameEn: "Canalith repositioning maneuver", group: "vestibular", isOperative: false, minFee: 270000, keywords: ["crt", "epley", "manuver bppv", "canalith"] },
  { code: "76.93", nameId: "Closed reduction TMJ", nameEn: "Closed reduction of TMJ dislocation", group: "trauma-jahit", isOperative: false, minFee: 315000, keywords: ["reduksi tmj", "rahang lepas reposisi"] },

  { code: "96.55", nameId: "Cuci kanul trakeostomi", nameEn: "Cleaning of tracheostomy cannula", group: "laring-trakea", isOperative: false, minFee: 270000, keywords: ["cuci trakeo"] },
  { code: "96.59", nameId: "Cuci luka", nameEn: "Wound irrigation/cleaning", group: "umum", isOperative: false, minFee: 240000, keywords: ["wound toilet", "ganti balut"] },

  { code: "96.52", nameId: "Ekstraksi serumen unilateral", nameEn: "Cerumen removal, unilateral", group: "telinga", isOperative: false, minFee: 150000, keywords: ["bersih telinga", "ekstraksi serumen", "es"] },
  { code: "96.52", nameId: "Ekstraksi serumen bilateral", nameEn: "Cerumen removal, bilateral", group: "telinga", isOperative: false, minFee: 255000, keywords: ["bersih telinga 2 sisi"] },
  { code: "96.52", nameId: "Ekstraksi serumen + penyulit", nameEn: "Cerumen removal with complication", group: "telinga", isOperative: false, minFee: 315000, maxFee: 330000, keywords: ["serumen sulit"] },

  { code: "98.13", nameId: "Ekstraksi benda asing faring", nameEn: "Removal of foreign body from pharynx", group: "faring-mulut", isOperative: false, minFee: 315000, keywords: ["fb faring", "corpus alienum faring"] },
  { code: "98.12", nameId: "Ekstraksi benda asing hidung", nameEn: "Removal of foreign body from nose", group: "hidung", isOperative: false, minFee: 195000, keywords: ["fb hidung", "corpus alienum hidung"] },
  { code: "98.12", nameId: "Ekstraksi benda asing hidung + penyulit", nameEn: "Removal of FB nose with complication", group: "hidung", isOperative: false, minFee: 315000 },
  { code: "98.01", nameId: "Ekstraksi benda asing mulut", nameEn: "Removal of foreign body from mouth", group: "faring-mulut", isOperative: false, minFee: 195000, keywords: ["fb mulut"] },
  { code: "98.11", nameId: "Ekstraksi benda asing telinga", nameEn: "Removal of foreign body from ear", group: "telinga", isOperative: false, minFee: 165000, keywords: ["fb telinga", "corpus alienum telinga"] },
  { code: "98.11", nameId: "Ekstraksi benda asing telinga + penyulit", nameEn: "Removal of FB ear with complication", group: "telinga", isOperative: false, minFee: 315000 },
  { code: "98.13", nameId: "Ekstraksi benda asing tonsil-faring", nameEn: "Removal of FB from tonsil/pharynx", group: "faring-mulut", isOperative: false, minFee: 315000, keywords: ["fb tonsil", "duri ikan"] },

  { code: "18.19", nameId: "Endoskopi telinga", nameEn: "Otoendoscopy", group: "telinga", isOperative: false, minFee: 270000, keywords: ["endoskopi telinga", "otoskopi video"] },
  { code: "29.19", nameId: "FEES (Fiberoptic Endoscopic Evaluation of Swallowing)", nameEn: "Fiberoptic endoscopic evaluation of swallowing", group: "laring-trakea", isOperative: false, minFee: 690000, keywords: ["fees", "evaluasi menelan"] },

  { code: "97.01", nameId: "Ganti NGT", nameEn: "Nasogastric tube replacement", group: "umum", isOperative: false, minFee: 240000, keywords: ["ganti ngt"] },
  { code: "97.16", nameId: "Ganti verban", nameEn: "Dressing change", group: "umum", isOperative: false, minFee: 120000, keywords: ["ganti balut", "ganti perban"] },

  { code: "99.12", nameId: "Immunotherapy", nameEn: "Allergen immunotherapy", group: "alergi", isOperative: false, minFee: 450000, keywords: ["imunoterapi", "scit", "slit"] },

  { code: "96.53", nameId: "Irigasi hidung", nameEn: "Nasal irrigation", group: "hidung", isOperative: false, minFee: 240000, keywords: ["cuci hidung", "nasal lavage"] },
  { code: "22.00", nameId: "Irigasi sinus unilateral", nameEn: "Sinus irrigation, unilateral", group: "sinus", isOperative: false, minFee: 300000, keywords: ["punksi sinus", "irigasi sinus"] },
  { code: "22.00", nameId: "Irigasi sinus bilateral", nameEn: "Sinus irrigation, bilateral", group: "sinus", isOperative: false, minFee: 420000 },
  { code: "22.02", nameId: "Irigasi sinus melalui ostium", nameEn: "Sinus ostium irrigation", group: "sinus", isOperative: false, minFee: 300000, maxFee: 405000 },

  { code: "29.39", nameId: "Kaustik faring", nameEn: "Pharyngeal cauterization", group: "faring-mulut", isOperative: false, minFee: 300000, keywords: ["kauter faring"] },
  { code: "21.03", nameId: "Kaustik hidung untuk epistaksis", nameEn: "Nasal cauterization for epistaxis", group: "hidung", isOperative: false, minFee: 315000, keywords: ["kauter hidung", "kauter mimisan", "agno3"] },

  { code: "99.25", nameId: "Kemoterapi", nameEn: "Chemotherapy administration", group: "onkologi", isOperative: false, minFee: 645000, keywords: ["kemo", "chemotherapy"] },

  { code: "18.19", nameId: "Mikroskopi telinga", nameEn: "Otomicroscopy", group: "telinga", isOperative: false, minFee: 240000, maxFee: 255000, keywords: ["mikroskopi telinga"] },
  { code: "20.39", nameId: "Mikroskopi telinga tengah", nameEn: "Microscopy of middle ear", group: "telinga", isOperative: false, minFee: 240000, maxFee: 255000 },

  { code: "29.19", nameId: "Muller's maneuver", nameEn: "Muller's maneuver", group: "laring-trakea", isOperative: false, minFee: 270000, keywords: ["muller maneuver", "evaluasi osas"] },

  { code: "22.19", nameId: "Nasoendoskopi", nameEn: "Nasal endoscopy", group: "hidung", isOperative: false, minFee: 315000, keywords: ["endoskopi hidung", "nasoendoskopi"] },
  { code: "22.19", nameId: "Nasofaringoskopi", nameEn: "Nasopharyngoscopy", group: "hidung", isOperative: false, minFee: 315000, keywords: ["endoskopi nasofaring"] },

  { code: "96.07", nameId: "Pasang NGT", nameEn: "Nasogastric tube insertion", group: "umum", isOperative: false, minFee: 150000, keywords: ["pasang ngt"] },
  { code: "96.07", nameId: "Pasang NGT dengan endoskopi", nameEn: "Endoscopic NGT placement", group: "umum", isOperative: false, minFee: 315000 },

  { code: "21.01", nameId: "Pasang tampon hidung anterior", nameEn: "Anterior nasal packing", group: "hidung", isOperative: false, minFee: 270000, maxFee: 375000, keywords: ["tampon anterior", "tampon depan"] },
  { code: "21.02", nameId: "Pasang tampon hidung posterior", nameEn: "Posterior nasal packing", group: "hidung", isOperative: false, minFee: 315000, keywords: ["tampon posterior", "tampon belakang"] },
  { code: "96.11", nameId: "Pasang tampon telinga", nameEn: "Ear packing/wick", group: "telinga", isOperative: false, minFee: 150000, maxFee: 180000, keywords: ["tampon telinga", "wick telinga"] },

  { code: "18.19", nameId: "Patch test telinga", nameEn: "Ear patch test", group: "telinga", isOperative: false, minFee: 300000, maxFee: 435000, keywords: ["patch test"] },
  { code: "31.72", nameId: "Penutupan stoma trakeostomi", nameEn: "Closure of tracheostomy stoma", group: "laring-trakea", isOperative: false, minFee: 270000, keywords: ["tutup stoma"] },
  { code: "31.42", nameId: "Rinolaringoskopi", nameEn: "Rhinolaryngoscopy", group: "laring-trakea", isOperative: false, minFee: 315000, keywords: ["endoskopi laring", "rinolaringoskopi"] },

  { code: "86.19", nameId: "Skin prick test", nameEn: "Skin prick test (allergy)", group: "alergi", isOperative: false, minFee: 315000, keywords: ["skin prick", "spt", "tes alergi"] },
  { code: "99.25", nameId: "Terapi target", nameEn: "Targeted therapy administration", group: "onkologi", isOperative: false, minFee: 540000, keywords: ["targeted therapy"] },

  { code: "95.42", nameId: "Tes berbisik", nameEn: "Whispered voice test", group: "telinga", isOperative: false, minFee: 150000, keywords: ["tes bisik", "berbisik"] },
  { code: "95.46", nameId: "Tes Dix-Hallpike", nameEn: "Dix-Hallpike test", group: "vestibular", isOperative: false, minFee: 240000, keywords: ["dix hallpike", "tes vertigo"] },
  { code: "89.15", nameId: "Tes fungsi N. VII", nameEn: "Facial nerve function test", group: "telinga", isOperative: false, minFee: 240000, keywords: ["tes fasialis n7", "tes nervus 7"] },
  { code: "21.29", nameId: "Tes penghidu", nameEn: "Olfactory test", group: "hidung", isOperative: false, minFee: 255000, keywords: ["tes hidu", "smell test", "tes anosmia"] },
  { code: "95.46", nameId: "Tes keseimbangan", nameEn: "Balance test", group: "vestibular", isOperative: false, minFee: 150000, keywords: ["tes keseimbangan"] },
  { code: "95.42", nameId: "Tes garpu tala", nameEn: "Tuning fork test", group: "telinga", isOperative: false, minFee: 150000, keywords: ["garpu tala", "rinne", "weber", "schwabach"] },
  { code: "95.44", nameId: "Tes fasialis", nameEn: "Facial nerve test", group: "telinga", isOperative: false, minFee: 240000 },
  { code: "95.44", nameId: "Tes vestibular kalori", nameEn: "Caloric vestibular test", group: "vestibular", isOperative: false, minFee: 240000, keywords: ["tes kalori", "kalori air"] },

  { code: "31.41", nameId: "Trakeoskopi fleksibel", nameEn: "Flexible tracheoscopy", group: "laring-trakea", isOperative: false, minFee: 300000, keywords: ["trakeoskopi"] },
  { code: "29.19", nameId: "Transnasal esofagoskopi", nameEn: "Transnasal esophagoscopy (TNE)", group: "laring-trakea", isOperative: false, minFee: 465000, keywords: ["tne", "esofagoskopi transnasal"] },
  { code: "93.89", nameId: "Vestibular rehabilitation", nameEn: "Vestibular rehabilitation therapy", group: "vestibular", isOperative: false, minFee: 270000, keywords: ["rehab vertigo", "vrt"] },
];

// ========== B. OPERATIF ==========
const OP: Icd9Entry[] = [
  { code: "97.37", nameId: "Dekanulasi trakeostomi", nameEn: "Decannulation of tracheostomy", group: "laring-trakea", isOperative: true, minFee: 450000, keywords: ["dekanulasi", "lepas trakeo"] },
  { code: "22.01", nameId: "Antrostomi", nameEn: "Antrostomy", group: "sinus", isOperative: true, minFee: 525000, keywords: ["antrostomi maksila"] },
  { code: "29.12", nameId: "Biopsi faring", nameEn: "Biopsy of pharynx", group: "faring-mulut", isOperative: true, minFee: 525000 },
  { code: "21.22", nameId: "Biopsi hidung", nameEn: "Biopsy of nose", group: "hidung", isOperative: true, minFee: 525000 },
  { code: "31.43", nameId: "Biopsi laring endoskopik", nameEn: "Endoscopic biopsy of larynx", group: "laring-trakea", isOperative: true, minFee: 675000, keywords: ["biopsi laring"] },
  { code: "27.24", nameId: "Biopsi rongga mulut", nameEn: "Biopsy of oral cavity", group: "faring-mulut", isOperative: true, minFee: 525000 },
  { code: "22.11", nameId: "Biopsi sinus", nameEn: "Biopsy of nasal sinus", group: "sinus", isOperative: true, minFee: 525000 },
  { code: "18.12", nameId: "Biopsi telinga luar", nameEn: "Biopsy of external ear", group: "telinga", isOperative: true, minFee: 525000 },
  { code: "20.32", nameId: "Biopsi telinga tengah", nameEn: "Biopsy of middle ear", group: "telinga", isOperative: true, minFee: 525000 },

  { code: "21.32", nameId: "Eksisi lesi hidung", nameEn: "Excision of nasal lesion", group: "hidung", isOperative: true, minFee: 550000 },
  { code: "27.72", nameId: "Eksisi uvula", nameEn: "Excision of uvula (uvulectomy)", group: "faring-mulut", isOperative: true, minFee: 550000, keywords: ["uvulektomi"] },
  { code: "18.29", nameId: "Ekstraksi kolesteatoma", nameEn: "Removal of cholesteatoma", group: "telinga", isOperative: true, minFee: 550000, maxFee: 600000, keywords: ["kolesteatom"] },
  { code: "21.31", nameId: "Polipektomi intranasal", nameEn: "Intranasal polypectomy", group: "hidung", isOperative: true, minFee: 550000, maxFee: 750000, keywords: ["polipektomi", "polip hidung"] },

  { code: "97.23", nameId: "Ganti kanul trakeostomi", nameEn: "Replacement of tracheostomy tube", group: "laring-trakea", isOperative: true, minFee: 625000, keywords: ["ganti kanul"] },
  { code: "97.29", nameId: "Ganti voice prosthesis", nameEn: "Replacement of voice prosthesis", group: "laring-trakea", isOperative: true, minFee: 775000 },

  { code: "27.61", nameId: "Jahit palatum", nameEn: "Suture of palate laceration", group: "faring-mulut", isOperative: true, minFee: 550000, keywords: ["hecting palatum"] },
  { code: "20.94", nameId: "Injeksi intratimpani", nameEn: "Intratympanic injection", group: "telinga", isOperative: true, minFee: 775000, maxFee: 975000, keywords: ["injeksi steroid telinga", "iti"] },

  { code: "28.0", nameId: "Insisi abses peritonsil", nameEn: "Incision of peritonsillar abscess", group: "faring-mulut", isOperative: true, minFee: 550000, keywords: ["pta", "drainase peritonsil"] },
  { code: "18.21", nameId: "Insisi abses preaurikular", nameEn: "Incision of preauricular abscess", group: "telinga", isOperative: true, minFee: 550000 },
  { code: "20.21", nameId: "Insisi abses retroaurikular", nameEn: "Incision of retroauricular abscess", group: "telinga", isOperative: true, minFee: 550000 },
  { code: "27.0", nameId: "Insisi abses wajah", nameEn: "Incision of facial abscess", group: "trauma-jahit", isOperative: true, minFee: 550000 },
  { code: "21.1", nameId: "Insisi septum hidung", nameEn: "Incision of nasal septum", group: "hidung", isOperative: true, minFee: 550000 },
  { code: "18.09", nameId: "Insisi pseudokista aurikula", nameEn: "Incision of auricular pseudocyst", group: "telinga", isOperative: true, minFee: 550000, maxFee: 575000, keywords: ["pseudokista", "kista aurikel"] },
  { code: "27.71", nameId: "Insisi uvula", nameEn: "Incision of uvula", group: "faring-mulut", isOperative: true, minFee: 550000 },

  { code: "27.51", nameId: "Jahit laserasi bibir", nameEn: "Suture of lip laceration", group: "trauma-jahit", isOperative: true, minFee: 550000, keywords: ["hecting bibir"] },
  { code: "27.52", nameId: "Jahit laserasi mulut", nameEn: "Suture of oral laceration", group: "trauma-jahit", isOperative: true, minFee: 550000, keywords: ["hecting mulut"] },
  { code: "21.81", nameId: "Jahit luka hidung", nameEn: "Suture of nose laceration", group: "trauma-jahit", isOperative: true, minFee: 550000, keywords: ["hecting hidung"] },
  { code: "18.4", nameId: "Jahit luka telinga", nameEn: "Suture of ear laceration", group: "trauma-jahit", isOperative: true, minFee: 550000, keywords: ["hecting telinga"] },

  { code: "31.3", nameId: "Krikotirotomi", nameEn: "Cricothyrotomy", group: "laring-trakea", isOperative: true, minFee: 850000, keywords: ["krikotirotomi", "airway emergency"] },

  { code: "18.29", nameId: "Kuretase granulasi telinga", nameEn: "Curettage of ear granulation tissue", group: "telinga", isOperative: true, minFee: 525000, maxFee: 700000, keywords: ["kuretase granulasi"] },
  { code: "19.4", nameId: "Miringoplasti", nameEn: "Myringoplasty", group: "telinga", isOperative: true, minFee: 775000, maxFee: 975000, keywords: ["miringoplasti", "tutup perforasi"] },
  { code: "20.09", nameId: "Miringotomi", nameEn: "Myringotomy", group: "telinga", isOperative: true, minFee: 550000, maxFee: 750000, keywords: ["miringotomi", "insisi membran timpani"] },
  { code: "20.1", nameId: "Pelepasan grommet", nameEn: "Removal of tympanostomy tube", group: "telinga", isOperative: true, minFee: 525000, maxFee: 700000, keywords: ["lepas grommet"] },
  { code: "20.01", nameId: "Pemasangan grommet", nameEn: "Tympanostomy tube insertion", group: "telinga", isOperative: true, minFee: 550000, maxFee: 750000, keywords: ["grommet", "pipa timpanostomi"] },

  { code: "86.01", nameId: "Punksi abses", nameEn: "Aspiration/puncture of abscess", group: "umum", isOperative: true, minFee: 250000, keywords: ["aspirasi abses"] },
  { code: "21.71", nameId: "Reduksi fraktur nasal", nameEn: "Closed reduction of nasal fracture", group: "trauma-jahit", isOperative: true, minFee: 550000, keywords: ["rfn", "reduksi fraktur nasal"] },
  { code: "21.91", nameId: "Revisi sinekia", nameEn: "Revision of nasal synechia", group: "hidung", isOperative: true, minFee: 525000, keywords: ["sinekia", "perlengketan hidung"] },
  { code: "18.01", nameId: "Tindik telinga", nameEn: "Ear piercing", group: "telinga", isOperative: true, minFee: 500000, keywords: ["tindik", "piercing"] },
];

export const ICD9_THT: Icd9Entry[] = [...NON_OP, ...OP];

export function searchIcd9(query: string): Icd9Entry[] {
  const q = query.trim().toLowerCase();
  if (!q) return ICD9_THT.slice(0, 20);
  return ICD9_THT.filter(
    (e) =>
      e.code.toLowerCase().includes(q) ||
      e.nameId.toLowerCase().includes(q) ||
      e.nameEn.toLowerCase().includes(q) ||
      e.keywords?.some((k) => k.toLowerCase().includes(q)),
  ).slice(0, 30);
}

export function formatFee(e: Pick<Icd9Entry, "minFee" | "maxFee">): string {
  const fmt = (n: number) =>
    n.toLocaleString("id-ID", { minimumFractionDigits: 0 });
  if (e.maxFee && e.maxFee !== e.minFee) {
    return `Rp ${fmt(e.minFee)} – Rp ${fmt(e.maxFee)}`;
  }
  return `Rp ${fmt(e.minFee)}`;
}
