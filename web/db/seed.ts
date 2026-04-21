/**
 * Seed dummy pasien — 3 pasien realistis Indonesia (THT-Alergi context).
 * Idempotent: skip jika no_rm sudah ada.
 *
 * Jalanin: `npm run db:seed` (dari folder web/)
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { patients, type NewPatient } from "./schema";

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

const dummy: NewPatient[] = [
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
      "Riwayat rhinitis alergi kronis — ibu juga asma. Kunjungan pertama: keluhan bersin pagi hari > 3 bulan.",
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
    catatan:
      "Suspek rinosinusitis dengan post-nasal drip. Tidak ada alergi obat diketahui.",
  },
  {
    noRm: "RM-2026-0003",
    nama: "Andi Pratama",
    tglLahir: "2018-02-20",
    jk: "L",
    telepon: "081122334003", // nomor ortu
    alamat: "Jl. Diponegoro No. 8, Ungaran Barat, Kab. Semarang",
    catatan:
      "Anak 8 th, rhinitis alergi — skin prick test: dust mite +3. Rujukan dari dr. keluarga.",
    // nik blm ada (anak blm KTP)
  },
];

async function main() {
  console.log("Seeding patients...");
  let inserted = 0;
  let skipped = 0;

  for (const p of dummy) {
    const existing = await db
      .select({ id: patients.id })
      .from(patients)
      .where(eq(patients.noRm, p.noRm))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  skip ${p.noRm} (${p.nama}) — sudah ada`);
      skipped++;
      continue;
    }

    await db.insert(patients).values(p);
    console.log(`  insert ${p.noRm} — ${p.nama}`);
    inserted++;
  }

  console.log(`\nDone. inserted=${inserted}, skipped=${skipped}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
