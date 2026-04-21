/**
 * Seed RIWAYAT KUNJUNGAN (signed visits di masa lampau) supaya tiap pasien
 * dummy punya 1-3 visit lampau dengan SOAP, diagnosa, tindakan, & resep
 * lengkap — biar `/pasien/[id]` punya riwayat dan visit viewer bisa diuji
 * tanpa "empty state" kosong.
 *
 * Idempotent: kalau pasien sudah punya signed visit dengan visitNumber yang
 * sama (cek by tanggal), skip.
 *
 * Jalanin: `npm run db:seed:history` (dari folder web/)
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { and, desc, eq, like } from "drizzle-orm";
import {
  patients,
  tenants,
  locations,
  users,
  visits,
  soapNotes,
  visitDiagnoses,
  visitProcedures,
  prescriptions,
} from "./schema";

if (!process.env.RME_DATABASE_URL) {
  console.error("RME_DATABASE_URL tidak terbaca. Cek web/.env.local");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.RME_DATABASE_URL,
  ssl:
    process.env.RME_DATABASE_SSL === "true"
      ? { rejectUnauthorized: false }
      : undefined,
});
const db = drizzle(pool);

// ---------- Helpers ----------

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

type PastVisit = {
  daysAgo: number;
  visitTime: string;
  chiefComplaint: string;
  weightKg?: number;
  heightCm?: number;
  bloodPressure?: string;
  heartRate?: number;
  temperatureC?: number;
  spo2?: number;
  subjective: string;
  historyPresent?: string;
  pastHistory?: string;
  objective: string;
  assessment: string;
  plan: string;
  diagnoses: Array<{
    icd10Code: string;
    icd10NameId: string;
    icd10NameEn?: string;
    diagnosisType?: "primary" | "secondary" | "comorbid";
    isChronic?: boolean;
  }>;
  procedures: Array<{
    icd9Code: string;
    icd9NameId: string;
    icd9NameEn?: string;
    isOperative?: boolean;
    feeIdr: number;
    notes?: string;
  }>;
  prescriptions: Array<{
    drugName: string;
    genericName?: string;
    drugForm?:
      | "tablet"
      | "kapsul"
      | "sirup"
      | "tetes"
      | "spray"
      | "salep"
      | "injeksi"
      | "lainnya";
    strength?: string;
    dose?: string;
    frequency?: string;
    duration?: string;
    route?: "oral" | "topical" | "inhalasi" | "tetes" | "injeksi" | "lainnya";
    instructions?: string;
    quantity?: number;
    unit?: string;
  }>;
};

// ---------- Riwayat per pasien ----------
// Tiap entry adalah satu visit signed di masa lampau, dengan SOAP +
// diagnosa + tindakan + resep yang konsisten dengan profil pasien.

const HISTORY: Record<string, PastVisit[]> = {
  "RM-2026-0001": [
    {
      daysAgo: 90,
      visitTime: "10:15:00",
      chiefComplaint: "Bersin pagi hari, hidung tersumbat sudah 2 bulan.",
      weightKg: 72.0,
      heightCm: 168.0,
      bloodPressure: "120/78",
      heartRate: 76,
      temperatureC: 36.6,
      spo2: 98,
      subjective:
        "Bersin >5x tiap pagi, hidung tersumbat bergantian, gatal di hidung dan mata. Memburuk saat udara dingin. Ibu pasien punya asma.",
      historyPresent:
        "Onset >2 bulan, makin sering. Tidak ada nyeri pipi/dahi, tidak ada penurunan penghidu.",
      pastHistory: "Tidak ada riwayat operasi sinus. Tidak ada riwayat asma sendiri.",
      objective:
        "Konka inferior bilateral pucat, edema. Sekret serous bilateral. Septum normal. Faring tenang. Tonsil T1-T1.",
      assessment:
        "Rhinitis alergi kronik (J30.4) — klasifikasi ARIA: persistent, moderate-severe.",
      plan:
        "1) Avoidance trigger (debu rumah, dingin pagi). 2) Cetirizine 10mg malam 14 hari. 3) Spray nasal mometasone 2x semprot/hidung pagi. 4) Edukasi cuci hidung NaCl 0.9% pagi-sore. 5) Kontrol 2 minggu.",
      diagnoses: [
        {
          icd10Code: "J30.4",
          icd10NameId: "Rinitis alergi, tidak terinci",
          icd10NameEn: "Allergic rhinitis, unspecified",
          diagnosisType: "primary",
          isChronic: true,
        },
      ],
      procedures: [
        {
          icd9Code: "89.7",
          icd9NameId: "Pemeriksaan fisik umum",
          isOperative: false,
          feeIdr: 150_000,
        },
      ],
      prescriptions: [
        {
          drugName: "Cetirizine",
          genericName: "Cetirizine HCl",
          drugForm: "tablet",
          strength: "10 mg",
          dose: "1 tablet",
          frequency: "1x sehari malam",
          duration: "14 hari",
          route: "oral",
          quantity: 14,
          unit: "tablet",
        },
        {
          drugName: "Mometasone Furoate Nasal Spray",
          drugForm: "spray",
          strength: "50 mcg/semprot",
          dose: "2 semprot tiap hidung",
          frequency: "1x sehari pagi",
          duration: "30 hari",
          route: "inhalasi",
          quantity: 1,
          unit: "botol",
        },
      ],
    },
    {
      daysAgo: 30,
      visitTime: "09:45:00",
      chiefComplaint: "Kontrol rinitis alergi — keluhan berkurang.",
      weightKg: 71.5,
      heightCm: 168.0,
      bloodPressure: "118/76",
      heartRate: 74,
      temperatureC: 36.5,
      spo2: 99,
      subjective:
        "Bersin pagi berkurang dari 5x menjadi 1-2x. Hidung tersumbat malam masih kadang. Patuh pakai mometasone tiap pagi.",
      objective: "Konka membaik, edema minimal. Sekret minimal. Tidak ada polip.",
      assessment: "Rinitis alergi kronik — perbaikan dengan terapi.",
      plan:
        "1) Lanjut mometasone spray 1x/hari pagi (maintenance). 2) Cetirizine PRN saat flare. 3) Kontrol 1 bulan jika perlu.",
      diagnoses: [
        {
          icd10Code: "J30.4",
          icd10NameId: "Rinitis alergi, tidak terinci",
          icd10NameEn: "Allergic rhinitis, unspecified",
          diagnosisType: "primary",
          isChronic: true,
        },
      ],
      procedures: [
        {
          icd9Code: "89.7",
          icd9NameId: "Pemeriksaan fisik umum",
          isOperative: false,
          feeIdr: 150_000,
        },
      ],
      prescriptions: [
        {
          drugName: "Mometasone Furoate Nasal Spray",
          drugForm: "spray",
          strength: "50 mcg/semprot",
          dose: "2 semprot tiap hidung",
          frequency: "1x sehari pagi",
          duration: "30 hari",
          route: "inhalasi",
          quantity: 1,
          unit: "botol",
        },
      ],
    },
  ],

  "RM-2026-0002": [
    {
      daysAgo: 60,
      visitTime: "11:00:00",
      chiefComplaint: "Pilek lengket + nyeri pipi kanan.",
      weightKg: 58.0,
      heightCm: 160.0,
      bloodPressure: "115/74",
      heartRate: 80,
      temperatureC: 37.4,
      spo2: 98,
      subjective:
        "Pilek lengket kuning kehijauan sudah 2 minggu. Nyeri pipi kanan, nyeri saat menunduk. Sakit kepala kadang. Penghidu sedikit menurun.",
      historyPresent: "Onset post-flu batuk-pilek 3 minggu lalu, tidak membaik dengan obat warung.",
      objective:
        "Konka edema bilateral, sekret mukopurulen di meatus medius kanan. Nyeri tekan sinus maksila kanan. Faring tenang.",
      assessment:
        "Sinusitis akut bakterial (J01) — sinus maksilaris kanan.",
      plan:
        "1) Amoxicillin 500mg 3x/hari 7 hari. 2) Pseudoefedrin 60mg 2x/hari 5 hari. 3) Saline nasal irrigation 2x/hari. 4) Kontrol 1 minggu — jika tidak membaik → CT scan sinus.",
      diagnoses: [
        {
          icd10Code: "J01",
          icd10NameId: "Sinusitis akut",
          icd10NameEn: "Acute sinusitis",
          diagnosisType: "primary",
          isChronic: false,
        },
      ],
      procedures: [
        {
          icd9Code: "89.7",
          icd9NameId: "Pemeriksaan fisik umum",
          isOperative: false,
          feeIdr: 150_000,
        },
      ],
      prescriptions: [
        {
          drugName: "Amoxicillin",
          drugForm: "kapsul",
          strength: "500 mg",
          dose: "1 kapsul",
          frequency: "3x sehari",
          duration: "7 hari",
          route: "oral",
          instructions: "Habiskan",
          quantity: 21,
          unit: "kapsul",
        },
        {
          drugName: "Pseudoefedrin",
          drugForm: "tablet",
          strength: "60 mg",
          dose: "1 tablet",
          frequency: "2x sehari",
          duration: "5 hari",
          route: "oral",
          quantity: 10,
          unit: "tablet",
        },
      ],
    },
  ],

  "RM-2026-0003": [
    {
      daysAgo: 120,
      visitTime: "08:30:00",
      chiefComplaint: "Bersin tiap pagi, hidung tersumbat — anak 7 th.",
      weightKg: 22.0,
      heightCm: 122.0,
      bloodPressure: "100/65",
      heartRate: 96,
      temperatureC: 36.7,
      spo2: 99,
      subjective:
        "Bersin tiap pagi >7x, hidung tersumbat malam, ngorok ringan. Skin prick test sebelumnya: dust mite +3. Ibu rajin bersihkan kasur.",
      objective:
        "Konka inferior pucat, edema bilateral. Sekret serous. Faring tenang. Tonsil T2-T2 simetris, tidak hiperemis.",
      assessment: "Rinitis alergi anak (J30.4) — sensitisasi dust mite.",
      plan:
        "1) Loratadine sirup 5mg 1x malam 14 hari. 2) Cuci hidung NaCl 0.9% bayi 2x sehari. 3) Edukasi sarung kasur anti-tungau, jaga kelembapan kamar. 4) Kontrol 2 minggu.",
      diagnoses: [
        {
          icd10Code: "J30.4",
          icd10NameId: "Rinitis alergi, tidak terinci",
          icd10NameEn: "Allergic rhinitis, unspecified",
          diagnosisType: "primary",
          isChronic: true,
        },
      ],
      procedures: [
        {
          icd9Code: "89.7",
          icd9NameId: "Pemeriksaan fisik umum",
          isOperative: false,
          feeIdr: 150_000,
        },
      ],
      prescriptions: [
        {
          drugName: "Loratadine Sirup",
          drugForm: "sirup",
          strength: "5 mg/5ml",
          dose: "5 ml",
          frequency: "1x sehari malam",
          duration: "14 hari",
          route: "oral",
          quantity: 1,
          unit: "botol",
        },
      ],
    },
  ],

  "RM-2026-0004": [
    {
      daysAgo: 180,
      visitTime: "10:30:00",
      chiefComplaint: "Nyeri menelan + demam — episode tonsilitis ke-5 tahun ini.",
      weightKg: 60.0,
      heightCm: 162.0,
      bloodPressure: "118/76",
      heartRate: 92,
      temperatureC: 38.4,
      spo2: 98,
      subjective:
        "Nyeri menelan hebat 3 hari, demam tinggi, halitosis. Episode serupa sudah 5x dalam 12 bulan terakhir, masing-masing diobati antibiotik.",
      objective:
        "Tonsil T3-T3, hiperemis, detritus kripta bilateral. Faring hiperemis. Submandibular nodes teraba 1 cm bilateral, mobile, nyeri tekan.",
      assessment:
        "Tonsilitis kronik eksaserbasi akut (J35.0) — kandidat tonsilektomi (5 episode/tahun).",
      plan:
        "1) Amoxicillin-clavulanate 625mg 3x/hari 10 hari. 2) Paracetamol 500mg PRN nyeri/demam. 3) Kumur antiseptik. 4) Edukasi: setelah akut tenang → konsultasi tonsilektomi (Paradise criteria terpenuhi). 5) Kontrol 1 minggu.",
      diagnoses: [
        {
          icd10Code: "J35.0",
          icd10NameId: "Tonsilitis kronik",
          icd10NameEn: "Chronic tonsillitis",
          diagnosisType: "primary",
          isChronic: true,
        },
      ],
      procedures: [
        {
          icd9Code: "89.7",
          icd9NameId: "Pemeriksaan fisik umum",
          isOperative: false,
          feeIdr: 150_000,
        },
      ],
      prescriptions: [
        {
          drugName: "Amoxicillin-Clavulanate",
          drugForm: "tablet",
          strength: "625 mg",
          dose: "1 tablet",
          frequency: "3x sehari",
          duration: "10 hari",
          route: "oral",
          instructions: "Habiskan",
          quantity: 30,
          unit: "tablet",
        },
        {
          drugName: "Paracetamol",
          drugForm: "tablet",
          strength: "500 mg",
          dose: "1 tablet",
          frequency: "PRN tiap 6 jam",
          duration: "5 hari",
          route: "oral",
          quantity: 20,
          unit: "tablet",
        },
      ],
    },
    {
      daysAgo: 45,
      visitTime: "09:15:00",
      chiefComplaint: "Kontrol tonsilitis — episode ke-6 minggu lalu.",
      weightKg: 60.5,
      heightCm: 162.0,
      bloodPressure: "120/76",
      heartRate: 80,
      temperatureC: 36.8,
      spo2: 99,
      subjective:
        "Sembuh dari episode minggu lalu. Sekarang tanya soal operasi. Ngorok malam terus, sleep partner mengeluh apnea singkat.",
      objective:
        "Tonsil T3-T3 simetris, kripta dalam, halitosis. Faring tenang. Tidak ada exudate aktif.",
      assessment:
        "Tonsilitis kronik (J35.0) + Hipertrofi tonsil (J35.1) + suspek OSA. Indikasi tonsilektomi: 6 episode/tahun + OSA suspek.",
      plan:
        "1) Rujuk untuk evaluasi sleep study (suspek OSA). 2) Persiapan tonsilektomi — informed consent, lab pre-op, EKG bila >40th. 3) Edukasi pasca-operasi: 10 hari diet lembut. 4) Jadwal operasi 2 minggu lagi.",
      diagnoses: [
        {
          icd10Code: "J35.0",
          icd10NameId: "Tonsilitis kronik",
          icd10NameEn: "Chronic tonsillitis",
          diagnosisType: "primary",
          isChronic: true,
        },
        {
          icd10Code: "J35.1",
          icd10NameId: "Hipertrofi tonsil",
          icd10NameEn: "Tonsillar hypertrophy",
          diagnosisType: "secondary",
          isChronic: true,
        },
      ],
      procedures: [
        {
          icd9Code: "89.7",
          icd9NameId: "Pemeriksaan fisik umum",
          isOperative: false,
          feeIdr: 200_000,
        },
      ],
      prescriptions: [],
    },
  ],

  "RM-2026-0005": [
    {
      daysAgo: 200,
      visitTime: "13:00:00",
      chiefComplaint: "Telinga kanan keluar cairan kronik > 1 tahun.",
      weightKg: 70.0,
      heightCm: 170.0,
      bloodPressure: "130/82",
      heartRate: 78,
      temperatureC: 36.7,
      spo2: 98,
      subjective:
        "Otore intermitten kanan > 1 tahun. Tidak nyeri, tidak vertigo. Pendengaran kanan menurun ringan. Tidak ada sakit kepala atau facial paresis.",
      objective:
        "Otoskopi kanan: perforasi sentral besar di pars tensa, sekret mukoid, tidak ada granulasi, tidak ada kolesteatoma. Mukosa cavum timpani tenang. Otoskopi kiri normal.",
      assessment:
        "Otitis media supuratif kronik tipe aman / tubotympanic (H66.1) — telinga kanan, fase aktif.",
      plan:
        "1) Aural toilet + cuci telinga H2O2 3% 1x/hari. 2) Ofloxacin tetes telinga 5 tetes 2x/hari 14 hari. 3) Edukasi: telinga kering total — TIDAK boleh kemasukan air saat mandi. 4) Audiometri. 5) Kontrol 2 minggu — jika kering stabil → diskusi tympanoplasty.",
      diagnoses: [
        {
          icd10Code: "H66.1",
          icd10NameId: "Otitis media supuratif kronik tubotympanic",
          icd10NameEn: "Chronic tubotympanic suppurative otitis media",
          diagnosisType: "primary",
          isChronic: true,
        },
      ],
      procedures: [
        {
          icd9Code: "96.52",
          icd9NameId: "Aural toilet (pembersihan telinga)",
          isOperative: false,
          feeIdr: 100_000,
        },
        {
          icd9Code: "95.41",
          icd9NameId: "Audiometri",
          isOperative: false,
          feeIdr: 250_000,
        },
      ],
      prescriptions: [
        {
          drugName: "Ofloxacin Otic",
          drugForm: "tetes",
          strength: "0.3%",
          dose: "5 tetes",
          frequency: "2x sehari telinga kanan",
          duration: "14 hari",
          route: "tetes",
          quantity: 1,
          unit: "botol",
        },
      ],
    },
  ],

  "RM-2026-0006": [
    {
      daysAgo: 150,
      visitTime: "14:30:00",
      chiefComplaint: "Telinga kiri keluar cairan berbau, pendengaran turun.",
      weightKg: 78.0,
      heightCm: 172.0,
      bloodPressure: "138/86",
      heartRate: 80,
      temperatureC: 37.1,
      spo2: 97,
      subjective:
        "Otore busuk telinga kiri > 6 bulan. Pendengaran kiri makin menurun. Kepala kadang pusing berputar saat menoleh. Tidak ada facial paresis. Tidak ada penurunan kesadaran.",
      objective:
        "Otoskopi kiri: perforasi atik dengan debris putih (kolesteatoma suspect), granulasi tepi perforasi. Tidak ada polip. Otoskopi kanan normal.",
      assessment:
        "Otitis media supuratif kronik tipe BAHAYA / atticoantral (H66.2) — kiri, suspek kolesteatoma. Vertigo intermiten — early labirinthine erosion?",
      plan:
        "1) CT scan tulang temporal kiri (cito). 2) Aural toilet + ofloxacin tetes 2x/hari sambil menunggu. 3) Pengantar konsul otologi untuk mastoidektomi. 4) Edukasi RED FLAG: jika muncul nyeri kepala hebat / facial paresis / penurunan kesadaran → IGD segera.",
      diagnoses: [
        {
          icd10Code: "H66.2",
          icd10NameId: "Otitis media supuratif kronik atticoantral",
          icd10NameEn: "Chronic atticoantral suppurative otitis media",
          diagnosisType: "primary",
          isChronic: true,
        },
      ],
      procedures: [
        {
          icd9Code: "96.52",
          icd9NameId: "Aural toilet (pembersihan telinga)",
          isOperative: false,
          feeIdr: 100_000,
        },
      ],
      prescriptions: [
        {
          drugName: "Ofloxacin Otic",
          drugForm: "tetes",
          strength: "0.3%",
          dose: "5 tetes",
          frequency: "2x sehari telinga kiri",
          duration: "10 hari",
          route: "tetes",
          quantity: 1,
          unit: "botol",
        },
      ],
    },
    {
      daysAgo: 60,
      visitTime: "11:30:00",
      chiefComplaint: "Bawa hasil CT scan + diskusi rencana operasi.",
      weightKg: 78.0,
      heightCm: 172.0,
      bloodPressure: "135/85",
      heartRate: 78,
      temperatureC: 36.8,
      spo2: 98,
      subjective:
        "CT scan: kolesteatoma di mesotimpanum-attic kiri, erosi scutum, tidak ada erosi tegmen / kanal facial. Tidak ada keluhan baru — tidak vertigo, tidak nyeri kepala.",
      objective:
        "Otoskopi kiri: perforasi atik tetap ada, debris berkurang setelah aural toilet rutin.",
      assessment:
        "OMSK atticoantral + kolesteatoma terkonfirmasi CT — indikasi mastoidektomi.",
      plan:
        "1) Persiapan operasi: lab pre-op, EKG, konsul anestesi. 2) Informed consent operasi (canal-wall-up vs canal-wall-down — diskusi dengan pasien). 3) Jadwal operasi 3 minggu lagi. 4) Lanjut aural toilet 2x/minggu sampai operasi.",
      diagnoses: [
        {
          icd10Code: "H66.2",
          icd10NameId: "Otitis media supuratif kronik atticoantral",
          icd10NameEn: "Chronic atticoantral suppurative otitis media",
          diagnosisType: "primary",
          isChronic: true,
        },
      ],
      procedures: [
        {
          icd9Code: "96.52",
          icd9NameId: "Aural toilet (pembersihan telinga)",
          isOperative: false,
          feeIdr: 100_000,
        },
      ],
      prescriptions: [],
    },
  ],
};

async function main() {
  // ---------- Default IDs ----------
  const tenant = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, "default"))
    .limit(1)
    .then((r) => r[0]);
  if (!tenant) {
    console.error("Tenant default belum ada — jalankan db:seed:today dulu.");
    process.exit(1);
  }

  const location = await db
    .select({ id: locations.id })
    .from(locations)
    .where(
      and(
        eq(locations.tenantId, tenant.id),
        eq(locations.name, "Klinik Utama"),
      ),
    )
    .limit(1)
    .then((r) => r[0]);
  if (!location) {
    console.error("Location default belum ada — jalankan db:seed:today dulu.");
    process.exit(1);
  }

  const doctor = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(eq(users.tenantId, tenant.id), eq(users.email, "doctor@local")),
    )
    .limit(1)
    .then((r) => r[0]);
  if (!doctor) {
    console.error("Doctor default belum ada — jalankan db:seed:today dulu.");
    process.exit(1);
  }

  // ---------- Get next visit number for the tenant ----------
  const year = new Date().getFullYear();
  const prefix = `KNJ-${year}-`;
  const last = await db
    .select({ vn: visits.visitNumber })
    .from(visits)
    .where(
      and(eq(visits.tenantId, tenant.id), like(visits.visitNumber, `${prefix}%`)),
    )
    .orderBy(desc(visits.visitNumber))
    .limit(1)
    .then((r) => r[0]?.vn);
  let seq = last ? parseInt(last.slice(prefix.length), 10) || 0 : 0;

  let inserted = 0;
  let skipped = 0;
  let rxSeq = 1;

  for (const [noRm, history] of Object.entries(HISTORY)) {
    const patient = await db
      .select({ id: patients.id })
      .from(patients)
      .where(eq(patients.noRm, noRm))
      .limit(1)
      .then((r) => r[0]);
    if (!patient) {
      console.warn(`  ! pasien ${noRm} tidak ditemukan — skip`);
      continue;
    }

    for (const item of history) {
      const visitDate = daysAgo(item.daysAgo);

      // Idempotency: skip if patient already has a visit on this exact date
      const existing = await db
        .select({ id: visits.id })
        .from(visits)
        .where(
          and(eq(visits.patientId, patient.id), eq(visits.visitDate, visitDate)),
        )
        .limit(1)
        .then((r) => r[0]);
      if (existing) {
        console.log(
          `  skip ${noRm} ${visitDate} — sudah ada (${existing.id.slice(0, 8)}…)`,
        );
        skipped++;
        continue;
      }

      seq++;
      const visitNumber = `${prefix}${String(seq).padStart(4, "0")}`;
      const signedAtDate = new Date(`${visitDate}T${item.visitTime}+07:00`);

      const [ins] = await db
        .insert(visits)
        .values({
          tenantId: tenant.id,
          locationId: location.id,
          doctorId: doctor.id,
          patientId: patient.id,
          visitNumber,
          visitDate,
          visitTime: item.visitTime,
          chiefComplaint: item.chiefComplaint,
          status: "done",
          paymentType: "umum",
          visitType: "outpatient",
          currentStep: 7,
          weightKg: item.weightKg != null ? String(item.weightKg) : null,
          heightCm: item.heightCm != null ? String(item.heightCm) : null,
          bloodPressure: item.bloodPressure ?? null,
          heartRate: item.heartRate ?? null,
          temperatureC:
            item.temperatureC != null ? String(item.temperatureC) : null,
          spo2: item.spo2 ?? null,
          signedAt: signedAtDate,
          signedBy: doctor.id,
        })
        .returning({ id: visits.id });

      await db.insert(soapNotes).values({
        visitId: ins.id,
        subjective: item.subjective,
        historyPresent: item.historyPresent ?? null,
        pastHistory: item.pastHistory ?? null,
        objective: item.objective,
        assessment: item.assessment,
        plan: item.plan,
      });

      if (item.diagnoses.length > 0) {
        await db.insert(visitDiagnoses).values(
          item.diagnoses.map((d, i) => ({
            visitId: ins.id,
            icd10Code: d.icd10Code,
            icd10NameId: d.icd10NameId,
            icd10NameEn: d.icd10NameEn ?? null,
            diagnosisType: d.diagnosisType ?? "primary",
            isChronic: d.isChronic ?? false,
            sortOrder: i,
          })),
        );
      }

      if (item.procedures.length > 0) {
        await db.insert(visitProcedures).values(
          item.procedures.map((p, i) => ({
            visitId: ins.id,
            icd9Code: p.icd9Code,
            icd9NameId: p.icd9NameId,
            icd9NameEn: p.icd9NameEn ?? null,
            isOperative: p.isOperative ?? false,
            feeIdr: p.feeIdr,
            notes: p.notes ?? null,
            sortOrder: i,
          })),
        );
      }

      if (item.prescriptions.length > 0) {
        const yyyy = signedAtDate.getFullYear();
        const dd = String(signedAtDate.getDate()).padStart(2, "0");
        const items = item.prescriptions.map((p, i) => {
          const prescriptionNumber = `R-${yyyy}-${String(rxSeq).padStart(4, "0")}-${dd}`;
          rxSeq++;
          return {
            visitId: ins.id,
            prescriptionNumber,
            drugName: p.drugName,
            genericName: p.genericName ?? null,
            drugForm: p.drugForm ?? null,
            strength: p.strength ?? null,
            dose: p.dose ?? null,
            frequency: p.frequency ?? null,
            duration: p.duration ?? null,
            route: p.route ?? null,
            instructions: p.instructions ?? null,
            quantity: p.quantity ?? null,
            unit: p.unit ?? null,
            sortOrder: i,
          };
        });
        await db.insert(prescriptions).values(items);
      }

      console.log(
        `  insert ${visitNumber}  ${visitDate}  → ${noRm}  (dx:${item.diagnoses.length} tx:${item.procedures.length} rx:${item.prescriptions.length})`,
      );
      inserted++;
    }
  }

  console.log(`\nDone. visits inserted=${inserted}, skipped=${skipped}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
