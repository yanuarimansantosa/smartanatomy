import Link from "next/link";
import { BookOpenCheck, Filter } from "lucide-react";
import { getAllIcd10 } from "@/lib/modules/catalog";
import { Icd10Browser } from "./icd-10-browser";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ICD-10 · Browser",
  description:
    "Daftar kode diagnosis ICD-10 yang ter-embed di modul klinis NovaCareEMR. Pencarian berdasarkan kode, nama, atau modul sumber.",
};

export default async function Icd10Page() {
  const entries = await getAllIcd10();

  const subspecialties = Array.from(new Set(entries.map((e) => e.subspecialty))).sort();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Kodifikasi Klinis
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Daftar ICD-10
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Semua kode diagnosis yang terintegrasi ke modul penyakit. Klik kode untuk membuka
            modul sumber &mdash; berguna untuk cek kategori, ekspektasi pembiayaan, atau ajar-diri.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          <BookOpenCheck className="h-4 w-4 text-primary" />
          <span>
            <strong className="font-semibold text-foreground">{entries.length}</strong> kode
            &middot;{" "}
            <strong className="font-semibold text-foreground">{subspecialties.length}</strong>{" "}
            subspesialis
          </span>
        </div>
      </header>

      <Icd10Browser entries={entries} subspecialties={subspecialties} />

      <footer className="mt-8 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        <div className="flex items-start gap-2">
          <Filter className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/70" />
          <p>
            Daftar ini ter-generate dari <code className="rounded bg-muted px-1">ModuleSpec.diagnoses[]</code>
            {" "}setiap modul. Saat modul baru didaftarkan, entry ICD-10 otomatis muncul di sini.
            Untuk katalog nasional lengkap, gunakan referensi resmi{" "}
            <Link
              href="https://icd.who.int/browse10/2019/en"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80"
            >
              ICD-10 WHO 2019
            </Link>
            .
          </p>
        </div>
      </footer>
    </main>
  );
}
