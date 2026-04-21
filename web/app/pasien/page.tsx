import Link from "next/link";
import { ArrowLeft, ChevronRight, Phone, Search, UserPlus } from "lucide-react";
import { fmtTanggal, listPatients, umurDariTglLahir } from "@/lib/patients";
import { NetworkStatus } from "@/components/network-status";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { DarkToggle } from "@/components/dark-toggle";
import { BrandHeader, BrandFooter } from "@/components/brand-header";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pasien",
};

const today = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
}).format(new Date());

export default async function PasienListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const rows = await listPatients(q);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-6 py-3 md:px-10">
        <BrandHeader today={today} />
        <div className="flex shrink-0 items-center gap-2">
          <DarkToggle />
          <ThemeSwitcher />
          <NetworkStatus />
        </div>
      </header>

      <main className="flex-1 px-6 py-10 md:px-10 md:py-14">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke beranda
          </Link>

          {/* ---------- Hero ---------- */}
          <section className="mt-10 grid grid-cols-1 items-end gap-6 md:grid-cols-12">
            <div className="md:col-span-8">
              <p className="mb-5 inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.22em] text-accent">
                <span aria-hidden className="inline-block h-px w-8 bg-accent/60" />
                <span>Daftar pasien</span>
              </p>

              <h1 className="font-display text-4xl font-medium leading-[1.05] tracking-tight text-foreground md:text-5xl">
                {rows.length}{" "}
                <span className="italic font-normal text-primary">
                  {rows.length === 1 ? "pasien tercatat." : "pasien tercatat."}
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
                {q ? (
                  <>
                    Menampilkan hasil pencarian untuk{" "}
                    <span className="font-medium text-foreground">
                      &ldquo;{q}&rdquo;
                    </span>
                    .
                  </>
                ) : (
                  <>
                    Riwayat singkat tiap pasien di klinik Anda. Sentuh kartu
                    untuk melihat detail rekam medis.
                  </>
                )}
              </p>
            </div>

            <div className="md:col-span-4 md:text-right">
              <Link
                href="/pasien/baru"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80"
              >
                <UserPlus className="h-5 w-5" />
                Pasien baru
              </Link>
            </div>
          </section>

          {/* ---------- Search ---------- */}
          <section className="mt-10 border-t border-border/60 pt-8">
            <form
              action="/pasien"
              method="get"
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="Cari nama, no. RM, NIK, atau telepon…"
                  className="h-12 w-full rounded-xl border border-border bg-card pl-12 pr-4 text-base outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  autoComplete="off"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-12 items-center rounded-xl border border-border bg-card px-5 text-base font-medium transition-colors hover:bg-muted active:bg-muted/70"
              >
                Cari
              </button>
              {q ? (
                <Link
                  href="/pasien"
                  className="inline-flex h-12 items-center rounded-xl px-4 text-base text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:bg-muted/70"
                >
                  Reset
                </Link>
              ) : null}
            </form>
          </section>

          {/* ---------- List ---------- */}
          <section className="mt-8">
            {rows.length === 0 ? (
              <EmptyState hasQuery={!!q} />
            ) : (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {rows.map((p) => (
                  <li key={p.id}>
                    <PasienCard p={p} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>

      <BrandFooter />
    </div>
  );
}

function PasienCard({
  p,
}: {
  p: Awaited<ReturnType<typeof listPatients>>[number];
}) {
  const isL = p.jk === "L";
  return (
    <Link
      href={`/pasien/${p.id}`}
      className="group flex min-h-[120px] items-stretch gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:bg-card hover:shadow-sm active:scale-[0.99] active:bg-muted/30"
    >
      <div
        className="flex w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-border/80 font-display text-lg font-medium text-primary"
        aria-hidden
      >
        {p.jk}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="min-w-0">
          <div className="truncate font-display text-lg font-medium leading-tight tracking-tight text-foreground">
            {p.nama}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            <span className="font-mono tabular-nums">{p.noRm}</span>
            <span aria-hidden className="text-muted-foreground/40">·</span>
            <span>{isL ? "Laki-laki" : "Perempuan"}</span>
            <span aria-hidden className="text-muted-foreground/40">·</span>
            <span>{umurDariTglLahir(p.tglLahir)}</span>
            <span aria-hidden className="text-muted-foreground/40">·</span>
            <span>{fmtTanggal(p.tglLahir)}</span>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          {p.telepon ? (
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              <span className="tabular-nums">{p.telepon}</span>
            </span>
          ) : null}
          {p.nik ? (
            <span className="font-mono tabular-nums">NIK {p.nik}</span>
          ) : (
            <span className="italic text-muted-foreground/70">tanpa NIK</span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center text-muted-foreground/40 transition-colors group-hover:text-primary">
        <ChevronRight className="h-5 w-5" />
      </div>
    </Link>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-20 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-border/80 bg-card text-muted-foreground">
        <Search className="h-6 w-6" strokeWidth={1.5} />
      </div>
      <p className="font-display text-xl font-medium tracking-tight">
        {hasQuery ? "Tidak ada pasien yang cocok." : "Belum ada pasien tercatat."}
      </p>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {hasQuery
          ? "Coba kata kunci lain atau reset pencarian."
          : "Mulai dengan menambahkan pasien pertama untuk membuka rekam medis pertama Anda."}
      </p>
      {!hasQuery ? (
        <Link
          href="/pasien/baru"
          className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80"
        >
          <UserPlus className="h-5 w-5" />
          Tambah pasien
        </Link>
      ) : null}
    </div>
  );
}
