import Link from "next/link";
import { ArrowLeft, ChevronRight, Phone, Search, UserPlus } from "lucide-react";
import { fmtTanggal, listPatients, umurDariTglLahir } from "@/lib/patients";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pasien",
};

export default async function PasienListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const rows = await listPatients(q);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between gap-3 border-b px-4 py-3 md:px-10 md:py-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:bg-muted/70"
            aria-label="Kembali ke beranda"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight md:text-2xl">
              Daftar Pasien
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {rows.length} pasien{q ? ` · cari: "${q}"` : ""}
            </p>
          </div>
        </div>
        <Link
          href="/pasien/baru"
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80 md:text-base"
        >
          <UserPlus className="h-5 w-5" />
          <span className="hidden sm:inline">Pasien Baru</span>
        </Link>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 md:px-10 md:py-8">
        <form
          action="/pasien"
          method="get"
          className="mb-6 flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Cari nama, no. RM, NIK, atau telepon…"
              className="h-12 w-full rounded-xl border bg-background pl-12 pr-4 text-base outline-none focus:ring-2 focus:ring-primary/40"
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-12 items-center rounded-xl border bg-background px-5 text-base font-medium transition-colors hover:bg-muted active:bg-muted/70"
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

        {rows.length === 0 ? (
          <EmptyState hasQuery={!!q} />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {rows.map((p) => (
              <PasienCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </main>
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
      className="group flex min-h-[112px] items-stretch gap-4 rounded-2xl border bg-card p-4 transition-all hover:border-primary/50 hover:bg-accent/40 active:scale-[0.99] active:bg-accent/60"
    >
      <div
        className={`flex w-14 shrink-0 flex-col items-center justify-center rounded-xl text-lg font-bold ${
          isL
            ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
            : "bg-pink-500/15 text-pink-600 dark:text-pink-400"
        }`}
        aria-hidden
      >
        {p.jk}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold leading-tight">
            {p.nama}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            <span className="font-mono">{p.noRm}</span>
            <span aria-hidden>·</span>
            <span>{umurDariTglLahir(p.tglLahir)}</span>
            <span aria-hidden>·</span>
            <span>{fmtTanggal(p.tglLahir)}</span>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          {p.telepon ? (
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              {p.telepon}
            </span>
          ) : null}
          {p.nik ? (
            <span className="font-mono">NIK {p.nik}</span>
          ) : (
            <span className="italic">tanpa NIK</span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center text-muted-foreground transition-colors group-hover:text-primary">
        <ChevronRight className="h-6 w-6" />
      </div>
    </Link>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Search className="h-6 w-6" />
      </div>
      <p className="text-base font-medium">
        {hasQuery ? "Tidak ada pasien yang cocok." : "Belum ada pasien."}
      </p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {hasQuery
          ? "Coba kata kunci lain atau reset pencarian."
          : "Mulai dengan menambahkan pasien pertama."}
      </p>
      {!hasQuery ? (
        <Link
          href="/pasien/baru"
          className="mt-5 inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-5 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80"
        >
          <UserPlus className="h-5 w-5" />
          Tambah Pasien
        </Link>
      ) : null}
    </div>
  );
}
