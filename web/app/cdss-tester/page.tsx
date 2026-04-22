import { BrainCog, Lightbulb } from "lucide-react";
import { loadAllSpecs } from "@/lib/modules/catalog";
import { CdssTesterClient } from "./cdss-tester-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "CDSS Tester",
  description:
    "Uji Clinical Decision Support System tanpa data pasien. Pilih modul, tap gejala/temuan, lihat aturan CDSS menyala + kompos SOAP.",
};

export default async function CdssTesterPage() {
  const specs = await loadAllSpecs();

  const specsLite = specs.map((s) => ({
    id: s.id,
    title: s.title,
    subspecialty: s.subspecialty,
    tags: s.tags,
    emergencyCount: s.emergencyTriggers?.length ?? 0,
    cdssCount: s.cdssRules?.length ?? 0,
    scoringCount: s.scoring?.length ?? 0,
    diagnosisCount: s.diagnoses.length,
    treatmentCount: s.treatments.length,
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
            <strong className="font-semibold text-foreground">{specsLite.length}</strong> modul{" "}
            &middot;{" "}
            <strong className="font-semibold text-foreground">
              {specsLite.reduce((sum, s) => sum + s.cdssCount, 0)}
            </strong>{" "}
            CDSS rule &middot;{" "}
            <strong className="font-semibold text-foreground">
              {specsLite.reduce((sum, s) => sum + s.emergencyCount, 0)}
            </strong>{" "}
            emergency trigger
          </span>
        </div>
      </header>

      <CdssTesterClient specs={specs} />

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

      <section className="mt-6">
        <h2 className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Ringkasan per modul
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {specsLite
            .slice()
            .sort((a, b) => a.title.localeCompare(b.title))
            .map((s) => (
              <li
                key={s.id}
                className="rounded-lg border border-border bg-card p-3 text-xs"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="truncate font-medium text-foreground">{s.title}</span>
                  {s.emergencyCount > 0 ? (
                    <span className="shrink-0 rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-destructive">
                      Emergency
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground">
                  <span>{s.cdssCount} CDSS</span>
                  <span>{s.scoringCount} scoring</span>
                  <span>{s.diagnosisCount} dx</span>
                  <span>{s.treatmentCount} tx</span>
                </div>
              </li>
            ))}
        </ul>
      </section>
    </main>
  );
}

