import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Clock,
  UserPlus,
} from "lucide-react";
import { BrandHeader, BrandFooter } from "@/components/brand-header";
import { NetworkStatus } from "@/components/network-status";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { DarkToggle } from "@/components/dark-toggle";
import { getDefaultIds } from "@/lib/defaults";
import {
  fmtJam,
  listTodayVisits,
  statusLabel,
  type VisitRow,
} from "@/lib/visits";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Daftar Hari Ini",
};

function todayLabel(): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date());
}

type Row = {
  v: VisitRow;
  patientName: string | null;
  patientNoRm: string | null;
};

function bucket(rows: Row[]) {
  const waiting = rows.filter(
    (r) => r.v.status === "waiting" || r.v.status === "called",
  );
  const inProgress = rows.filter((r) => r.v.status === "in_progress");
  const done = rows.filter((r) => r.v.status === "done");
  const noShow = rows.filter((r) => r.v.status === "no_show");
  return { waiting, inProgress, done, noShow };
}

export default async function JadwalPage() {
  const { tenantId } = await getDefaultIds();
  const today = todayLabel();
  const rows = (await listTodayVisits(tenantId)) as Row[];
  const groups = bucket(rows);

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
                <span>Daftar hari ini</span>
              </p>

              <h1 className="font-display text-4xl font-medium leading-[1.05] tracking-tight text-foreground md:text-5xl">
                {rows.length}{" "}
                <span className="italic font-normal text-primary">
                  kunjungan tercatat hari ini.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
                {rows.length === 0
                  ? "Belum ada antrian. Tambah pasien baru atau buka Daftar Pasien untuk membuat kunjungan."
                  : `${groups.waiting.length} menunggu · ${groups.inProgress.length} diperiksa · ${groups.done.length} selesai${groups.noShow.length > 0 ? ` · ${groups.noShow.length} tidak hadir` : ""}.`}
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

          {/* ---------- Sections ---------- */}
          {rows.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="mt-10 space-y-10">
              {groups.waiting.length > 0 ? (
                <BucketSection
                  title="Menunggu / Dipanggil"
                  rows={groups.waiting}
                  highlight
                />
              ) : null}
              {groups.inProgress.length > 0 ? (
                <BucketSection title="Sedang diperiksa" rows={groups.inProgress} />
              ) : null}
              {groups.done.length > 0 ? (
                <BucketSection title="Selesai" rows={groups.done} />
              ) : null}
              {groups.noShow.length > 0 ? (
                <BucketSection title="Tidak hadir" rows={groups.noShow} />
              ) : null}
            </div>
          )}
        </div>
      </main>

      <BrandFooter />
    </div>
  );
}

function BucketSection({
  title,
  rows,
  highlight,
}: {
  title: string;
  rows: Row[];
  highlight?: boolean;
}) {
  return (
    <section>
      <h2 className="mb-4 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
        <span aria-hidden className="inline-block h-px w-8 bg-border" />
        <span>{title}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold tabular-nums text-foreground">
          {rows.length}
        </span>
      </h2>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {rows.map((r) => (
          <li key={r.v.id}>
            <VisitCard row={r} highlight={highlight} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function VisitCard({ row, highlight }: { row: Row; highlight?: boolean }) {
  const { v } = row;
  const status = statusLabel(v.status);
  const toneClass =
    status.tone === "amber"
      ? "border-warning/30 bg-warning/10 text-warning"
      : status.tone === "blue"
        ? "border-info/30 bg-info/10 text-info"
        : status.tone === "indigo"
          ? "border-info/30 bg-info/10 text-info"
          : status.tone === "green"
            ? "border-success/30 bg-success/10 text-success"
            : "border-border bg-muted text-muted-foreground";

  const href = v.patientId
    ? `/pasien/${v.patientId}/kunjungan/${v.id}`
    : `/pasien`;

  return (
    <Link
      href={href}
      className={`group flex min-h-[120px] items-stretch gap-4 rounded-2xl border p-5 transition-all active:scale-[0.99] ${highlight ? "border-primary/30 bg-card hover:border-primary/60 hover:shadow-sm" : "border-border bg-card hover:border-primary/40 hover:shadow-sm"}`}
    >
      <div
        className="flex w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-border/80 font-display text-lg font-medium text-primary"
        aria-hidden
      >
        {v.queueNumber ? (
          <>
            <span className="text-[9px] font-normal uppercase tracking-wider text-muted-foreground">
              Q
            </span>
            <span className="tabular-nums">{v.queueNumber}</span>
          </>
        ) : (
          <CalendarDays className="h-5 w-5" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="min-w-0">
          <div className="truncate font-display text-lg font-medium leading-tight tracking-tight text-foreground">
            {row.patientName ?? "—"}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            <span className="font-mono tabular-nums">
              {row.patientNoRm ?? "-"}
            </span>
            <span aria-hidden className="text-muted-foreground/40">·</span>
            <span className="font-mono tabular-nums">{v.visitNumber}</span>
            {v.visitTime ? (
              <>
                <span aria-hidden className="text-muted-foreground/40">·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span className="tabular-nums">{fmtJam(v.visitTime)}</span>
                </span>
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${toneClass}`}
          >
            {status.label}
          </span>
          {v.chiefComplaint ? (
            <span className="truncate text-xs italic text-muted-foreground">
              {v.chiefComplaint}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center text-muted-foreground/40 transition-colors group-hover:text-primary">
        <ChevronRight className="h-5 w-5" />
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-20 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-border/80 bg-card text-muted-foreground">
        <CalendarDays className="h-6 w-6" strokeWidth={1.5} />
      </div>
      <p className="font-display text-xl font-medium tracking-tight">
        Belum ada antrian hari ini.
      </p>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Daftarkan pasien baru atau buka Daftar Pasien untuk memulai sesi
        konsultasi pertama hari ini.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/pasien/baru"
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80"
        >
          <UserPlus className="h-5 w-5" />
          Pasien baru
        </Link>
        <Link
          href="/pasien"
          className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-medium transition-colors hover:bg-muted"
        >
          Daftar Pasien
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
