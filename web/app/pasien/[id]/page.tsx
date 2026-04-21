import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Mail, MapPin, Phone, User } from "lucide-react";
import { fmtTanggal, getPatientById, umurDariTglLahir } from "@/lib/patients";
import {
  fmtTanggalKunjungan,
  fmtJam,
  listVisitsByPatient,
  statusLabel,
} from "@/lib/visits";
import { NetworkStatus } from "@/components/network-status";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { DarkToggle } from "@/components/dark-toggle";
import { BrandHeader, BrandFooter } from "@/components/brand-header";
import { StartVisitButton } from "./start-visit-button";

export const dynamic = "force-dynamic";

const today = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
}).format(new Date());

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await getPatientById(id);
  return { title: p ? `${p.nama} (${p.noRm})` : "Pasien" };
}

export default async function PasienDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await getPatientById(id);
  if (!p) notFound();

  const isL = p.jk === "L";
  const visits = await listVisitsByPatient(id);

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
            href="/pasien"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke daftar pasien
          </Link>

          {/* ---------- Hero ---------- */}
          <section className="mt-10 flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0 flex-1">
              <p className="mb-5 inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.22em] text-accent">
                <span aria-hidden className="inline-block h-px w-8 bg-accent/60" />
                <span>Rekam pasien</span>
              </p>

              <h1 className="font-display text-4xl font-medium leading-[1.05] tracking-tight text-foreground md:text-5xl">
                {p.nama}
                <span className="italic font-normal text-primary">.</span>
              </h1>

              <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <span className="font-mono tabular-nums text-foreground/70">
                  {p.noRm}
                </span>
                <span aria-hidden className="text-muted-foreground/40">·</span>
                <span>{isL ? "Laki-laki" : "Perempuan"}</span>
                <span aria-hidden className="text-muted-foreground/40">·</span>
                <span>{umurDariTglLahir(p.tglLahir)}</span>
                <span aria-hidden className="text-muted-foreground/40">·</span>
                <span>{fmtTanggal(p.tglLahir)}</span>
              </p>
            </div>
            <StartVisitButton patientId={id} />
          </section>

          {/* ---------- Identitas + Kontak ---------- */}
          <section className="mt-10 grid grid-cols-1 gap-4 border-t border-border/60 pt-8 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-6 md:col-span-2">
              <h2 className="mb-5 font-display text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Identitas
              </h2>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <Item
                  icon={<User className="h-3.5 w-3.5" />}
                  label="Nama"
                  value={p.nama}
                />
                <Item
                  icon={<Calendar className="h-3.5 w-3.5" />}
                  label="Tanggal lahir"
                  value={`${fmtTanggal(p.tglLahir)} (${umurDariTglLahir(p.tglLahir)})`}
                />
                <Item
                  label="Jenis kelamin"
                  value={isL ? "Laki-laki" : "Perempuan"}
                />
                <Item label="No. RM" value={p.noRm} mono />
                <Item label="NIK" value={p.nik ?? "—"} mono />
              </dl>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-5 font-display text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Kontak
              </h2>
              <dl className="space-y-4">
                <Item
                  icon={<Phone className="h-3.5 w-3.5" />}
                  label="Telepon"
                  value={p.telepon ?? "—"}
                />
                <Item
                  icon={<Mail className="h-3.5 w-3.5" />}
                  label="Email"
                  value={p.email ?? "—"}
                />
                <Item
                  icon={<MapPin className="h-3.5 w-3.5" />}
                  label="Alamat"
                  value={p.alamat ?? "—"}
                />
              </dl>
            </div>
          </section>

          {/* ---------- Catatan klinis ---------- */}
          {p.catatan ? (
            <section className="mt-4">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="mb-3 font-display text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Catatan klinis
                </h2>
                <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground/90">
                  {p.catatan}
                </p>
              </div>
            </section>
          ) : null}

          {/* ---------- Riwayat kunjungan ---------- */}
          <section className="mt-4">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-4 flex items-baseline justify-between gap-3 font-display text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                <span>Riwayat kunjungan</span>
                {visits.length > 0 ? (
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground/70">
                    {visits.length} {visits.length === 1 ? "kunjungan" : "kunjungan"}
                  </span>
                ) : null}
              </h2>
              {visits.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                  Belum ada kunjungan. Tap{" "}
                  <span className="font-medium text-foreground">
                    Periksa pasien
                  </span>{" "}
                  di atas untuk memulai pemeriksaan baru.
                </p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {visits.map((v) => {
                    const st = statusLabel(v.status);
                    const tone =
                      st.tone === "amber"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                        : st.tone === "blue"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                          : st.tone === "indigo"
                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                            : st.tone === "green"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : "bg-muted text-muted-foreground";
                    const isSigned = !!v.signedAt;
                    const href = isSigned
                      ? `/pasien/${id}/kunjungan/${v.id}`
                      : `/pasien/${id}/kunjungan/${v.id}/edit`;
                    return (
                      <li key={v.id}>
                        <Link
                          href={href}
                          className="-mx-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-lg px-2 py-3 transition-colors hover:bg-muted/60"
                        >
                          <span className="font-mono text-xs tabular-nums text-foreground/80">
                            {v.visitNumber}
                          </span>
                          <span className="text-sm">
                            {fmtTanggalKunjungan(v.visitDate)}
                          </span>
                          <span className="font-mono text-xs tabular-nums text-muted-foreground">
                            {fmtJam(v.visitTime)}
                          </span>
                          {v.chiefComplaint ? (
                            <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                              · {v.chiefComplaint}
                            </span>
                          ) : (
                            <span className="min-w-0 flex-1" />
                          )}
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${tone}`}
                          >
                            {st.label}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          <p className="mt-8 text-right text-[11px] text-muted-foreground">
            Dibuat{" "}
            {new Intl.DateTimeFormat("id-ID", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(p.createdAt)}
          </p>
        </div>
      </main>

      <BrandFooter />
    </div>
  );
}

function Item({
  icon,
  label,
  value,
  mono,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {icon ? <span>{icon}</span> : null}
        <span>{label}</span>
      </dt>
      <dd
        className={`mt-1.5 text-base text-foreground ${mono ? "font-mono tabular-nums" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
