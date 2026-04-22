import { BrainCog, Lightbulb } from "lucide-react";
import { MODULE_LISTINGS } from "@/lib/modules/registry";
import { CdssTesterClient } from "./cdss-tester-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "CDSS Tester",
  description:
    "Uji Clinical Decision Support System tanpa data pasien. Pilih modul, tap gejala/temuan, lihat aturan CDSS menyala + kompos SOAP.",
};

export default function CdssTesterPage() {
  const listings = MODULE_LISTINGS.map((m) => ({
    id: m.id,
    title: m.title,
    subspecialty: m.subspecialty,
    tags: m.tags ?? [],
  }));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Clinical Decision Support
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight md:text-3xl">
            CDSS Tester
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Uji <em>rule-based decision support</em> tanpa data pasien. Pilih modul, tap anamnesis
            &amp; pemeriksaan, lalu lihat aturan CDSS menyala, <em>emergency trigger</em> aktif,
            dan SOAP otomatis ter-compose. <strong className="text-foreground">NO LLM</strong> —
            semua deterministic &amp; traceable.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          <BrainCog className="h-4 w-4 text-primary" />
          <span>
            <strong className="font-semibold text-foreground">{listings.length}</strong> modul
            terdaftar
          </span>
        </div>
      </header>

      <CdssTesterClient listings={listings} />

      <footer className="mt-8 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        <div className="flex items-start gap-2">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p>
            Tester ini <strong className="text-foreground">tidak</strong> menyimpan data ke
            database &mdash; murni sandbox untuk belajar &amp; demo. Untuk jalankan engine penuh
            di konteks kunjungan real, buka modul dari halaman pasien.
          </p>
        </div>
      </footer>
    </main>
  );
}
