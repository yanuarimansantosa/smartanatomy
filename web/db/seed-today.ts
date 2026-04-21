/**
 * Seed antrian kunjungan untuk HARI INI — bikin pasien (kalau belum ada) +
 * visit status `waiting` supaya dr. Yanuar bisa langsung tap "Periksa" lalu
 * coba SOAP editor & disease modules tanpa harus daftar pasien baru.
 *
 * Idempotent: kalau pasien sudah punya visit dengan tanggal hari ini, skip.
 *
 * Jalanin: `npm run db:seed:today` (dari folder web/)
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
  type NewPatient,
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

// ---------- Pasien dummy (idempotent — skip kalau sudah ada) ----------
// Dirancang supaya menutup spectrum modul disease yang sedang dibangun:
//   - Rinitis alergi  → match anamnesis "bersin pagi"
//   - Sinusitis kronik (CRS) → match modul J32
//   - Tonsilitis kronik → match modul J35.0
//   - OMSK aman → match modul H66.1
//   - OMSK bahaya → match modul H66.2

const seedPatients: NewPatient[] = [
  {
    noRm: "RM-2026-0001",
    nama: "Budi Santoso",
    nik: "3374011505800001",
    tglLahir: "1980-05-15",
    jk: "L",
    telepon: "081234567001",
    email: "budi.santoso@example.com",
    alamat: "Jl. Pandanaran No. 12, Semarang Tengah, Kota Semarang",
    catatan:
      "Riwayat rhinitis alergi kronis — ibu juga asma. Bersin pagi hari > 3 bulan.",
  },
  {
    noRm: "RM-2026-0002",
    nama: "Siti Aminah",
    nik: "3374014708930002",
    tglLahir: "1993-08-07",
    jk: "P",
    telepon: "085798765002",
    email: "siti.a@example.com",
    alamat: "Jl. Gajah Mada No. 45, Semarang Selatan, Kota Semarang",
    catatan: "Suspek rinosinusitis kronik. Tidak ada alergi obat diketahui.",
  },
  {
    noRm: "RM-2026-0003",
    nama: "Andi Pratama",
    tglLahir: "2018-02-20",
    jk: "L",
    telepon: "081122334003",
    alamat: "Jl. Diponegoro No. 8, Ungaran Barat, Kab. Semarang",
    catatan: "Anak 8 th, rhinitis alergi — skin prick: dust mite +3.",
  },
  {
    noRm: "RM-2026-0004",
    nama: "Rina Marlina",
    nik: "3374015003900004",
    tglLahir: "1990-03-10",
    jk: "P",
    telepon: "082233445004",
    alamat: "Jl. Sultan Agung No. 27, Banyumanik, Kota Semarang",
    catatan: "Tonsilitis kronik berulang — > 6x/tahun, ngorok malam.",
  },
  {
    noRm: "RM-2026-0005",
    nama: "Joko Wahyudi",
    nik: "3374011110750005",
    tglLahir: "1975-10-11",
    jk: "L",
    telepon: "087788991005",
    alamat: "Jl. Pemuda No. 99, Semarang Tengah, Kota Semarang",
    catatan: "Otore telinga kanan kronik > 1 tahun, kering tapi sering kambuh.",
  },
  {
    noRm: "RM-2026-0006",
    nama: "Hartono Wijaya",
    nik: "3374010707680006",
    tglLahir: "1968-07-07",
    jk: "L",
    telepon: "081567890006",
    alamat: "Jl. Veteran No. 14, Gajahmungkur, Kota Semarang",
    catatan:
      "Otore busuk telinga kiri, penurunan pendengaran progresif — curiga kolesteatoma.",
  },
];

type QueueItem = {
  noRm: string;
  visitTime: string; // HH:MM:SS
  chiefComplaint: string;
};

const queueToday: QueueItem[] = [
  {
    noRm: "RM-2026-0001",
    visitTime: "08:30:00",
    chiefComplaint: "Bersin pagi hari, hidung gatal, sudah 2 minggu makin parah.",
  },
  {
    noRm: "RM-2026-0002",
    visitTime: "09:00:00",
    chiefComplaint:
      "Pilek lengket, nyeri pipi kanan, post-nasal drip — sudah 3 minggu tidak membaik.",
  },
  {
    noRm: "RM-2026-0004",
    visitTime: "09:30:00",
    chiefComplaint:
      "Nyeri menelan berulang, ngorok keras malam hari, halitosis. Periksa pasca antibiotik.",
  },
  {
    noRm: "RM-2026-0005",
    visitTime: "10:00:00",
    chiefComplaint:
      "Telinga kanan keluar cairan jernih lagi sejak 3 hari, tidak nyeri.",
  },
  {
    noRm: "RM-2026-0006",
    visitTime: "10:30:00",
    chiefComplaint:
      "Telinga kiri keluar cairan berbau, kepala kadang pusing berputar — kontrol pra-bedah.",
  },
  {
    noRm: "RM-2026-0003",
    visitTime: "11:00:00",
    chiefComplaint:
      "Bersin tiap pagi, hidung tersumbat, ngorok malam. Bawa hasil prick test sebelumnya.",
  },
];

async function main() {
  // ---------- 1. Default tenant / location / doctor ----------
  let tenant = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, "default"))
    .limit(1)
    .then((r) => r[0]);
  if (!tenant) {
    tenant = await db
      .insert(tenants)
      .values({
        slug: "default",
        name: "Klinik (default)",
        subscriptionStatus: "active",
      })
      .returning({ id: tenants.id })
      .then((r) => r[0]);
    console.log(`  insert tenant default ${tenant.id}`);
  }

  let location = await db
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
    location = await db
      .insert(locations)
      .values({
        tenantId: tenant.id,
        name: "Klinik Utama",
        slotDurationMinutes: 15,
      })
      .returning({ id: locations.id })
      .then((r) => r[0]);
    console.log(`  insert location ${location.id}`);
  }

  let doctor = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(eq(users.tenantId, tenant.id), eq(users.email, "doctor@local")),
    )
    .limit(1)
    .then((r) => r[0]);
  if (!doctor) {
    doctor = await db
      .insert(users)
      .values({
        tenantId: tenant.id,
        name: "Dokter",
        email: "doctor@local",
        passwordHash: "!disabled",
        role: "doctor",
        specialty: "THT-KL",
      })
      .returning({ id: users.id })
      .then((r) => r[0]);
    console.log(`  insert doctor ${doctor.id}`);
  }

  // ---------- 2. Patients (idempotent) ----------
  const noRmToId = new Map<string, string>();
  for (const p of seedPatients) {
    let row = await db
      .select({ id: patients.id })
      .from(patients)
      .where(eq(patients.noRm, p.noRm))
      .limit(1)
      .then((r) => r[0]);
    if (!row) {
      row = await db
        .insert(patients)
        .values(p)
        .returning({ id: patients.id })
        .then((r) => r[0]);
      console.log(`  insert patient ${p.noRm} — ${p.nama}`);
    }
    noRmToId.set(p.noRm, row.id);
  }

  // ---------- 3. Today's visits (idempotent: skip if patient already has visit today) ----------
  const today = new Date().toISOString().slice(0, 10);
  const year = new Date().getFullYear();
  const prefix = `KNJ-${year}-`;

  // Find current max visitNumber sequence for the tenant
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
  let queueNum = 1;

  for (const item of queueToday) {
    const patientId = noRmToId.get(item.noRm);
    if (!patientId) {
      console.warn(`  ! pasien ${item.noRm} tidak ditemukan — skip`);
      continue;
    }

    const existing = await db
      .select({ id: visits.id })
      .from(visits)
      .where(
        and(eq(visits.patientId, patientId), eq(visits.visitDate, today)),
      )
      .limit(1)
      .then((r) => r[0]);

    if (existing) {
      console.log(
        `  skip ${item.noRm} — sudah ada visit hari ini (${existing.id.slice(0, 8)}…)`,
      );
      skipped++;
      queueNum++;
      continue;
    }

    seq++;
    const visitNumber = `${prefix}${String(seq).padStart(4, "0")}`;

    await db.insert(visits).values({
      tenantId: tenant.id,
      locationId: location.id,
      doctorId: doctor.id,
      patientId,
      visitNumber,
      queueNumber: queueNum,
      visitDate: today,
      visitTime: item.visitTime,
      chiefComplaint: item.chiefComplaint,
      status: "waiting",
      paymentType: "umum",
      visitType: "outpatient",
      currentStep: 1,
    });
    console.log(
      `  insert visit ${visitNumber}  Q${queueNum}  ${item.visitTime}  → ${item.noRm}`,
    );
    inserted++;
    queueNum++;
  }

  console.log(
    `\nDone. patients=${seedPatients.length} (existing+new), visits inserted=${inserted}, skipped=${skipped}`,
  );
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
