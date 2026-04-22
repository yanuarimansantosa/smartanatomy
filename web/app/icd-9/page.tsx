import Link from "next/link";
import { Activity, Filter } from "lucide-react";
import { getAllIcd9 } from "@/lib/modules/catalog";
import { Icd9Browser } from "./icd-9-browser";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ICD-9-CM · Browser",
  description:
    "Daftar kode tindakan ICD-9-CM yang ter-embed di modul klinis NovaCareEMR. Pencarian berdasarkan kode, nama, atau modul sumber.",
};

export default async function Icd9Page() {
  const entries = await getAllIcd9();

  const categories = Array.from(new Set(entries.map((e) => e.category))).sort();
  const priced = entries.filter((e) => typeof e.feeIdr === "number");
  const totalFee = priced.reduce((sum, e) => sum + (e.feeIdr ?? 0), 0);
  const avgFee = priced.length > 0 ? Math.round(totalFee / priced.length) : 0;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Kodifikasi Klinis
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Daftar ICD-9-CM (Tindakan)
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Semua kode tindakan/prosedur dari modul penyakit. Berguna untuk cek tarif referensi,
            tindakan operatif vs non-operatif, dan modul sumber.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          <Activity className="h-4 w-4 text-primary" />
          <span>
            <strong className="font-semibold text-foreground">{entries.length}</strong> kode &middot;{" "}
            {priced.length > 0 ? (
              <>
                rata-rata tarif{" "}
                <strong className="font-semibold text-foreground">
                  Rp {new Intl.NumberFormat("id-ID").format(avgFee)}
                </strong>
              </>
            ) : (
              "tanpa tarif default"
            )}
          </span>
        </div>
      </header>

      <Icd9Browser entries={entries} categories={categories} />

      <footer className="mt-8 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        <div className="flex items-start gap-2">
          <Filter className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/70" />
          <p>
            Daftar ini ter-generate dari <code className="rounded bg-muted px-1">ModuleSpec.treatments[]</code>
            {" "}yang punya <code className="rounded bg-muted px-1">icd9Code</code>. Untuk katalog nasional
            lengkap ICD-9-CM, gunakan referensi resmi{" "}
            <Link
              href="https://www.cms.gov/medicare/coding-billing/icd-10-codes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80"
            >
              CMS ICD-9-CM Procedures
            </Link>
            .
          </p>
        </div>
      </footer>
    </main>
  );
}
