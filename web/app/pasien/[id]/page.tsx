import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Mail, MapPin, Phone, User } from "lucide-react";
import { fmtTanggal, getPatientById, umurDariTglLahir } from "@/lib/patients";
import { NetworkStatus } from "@/components/network-status";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { DarkToggle } from "@/components/dark-toggle";
import { BrandHeader, BrandFooter } from "@/components/brand-header";

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
          <section className="mt-10">
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

          {/* ---------- Riwayat kunjungan (placeholder) ---------- */}
          <section className="mt-4">
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8">
              <p className="font-display text-lg font-medium tracking-tight text-foreground">
                Riwayat kunjungan
              </p>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Modul sesi konsultasi & rekam medis akan ditambahkan di iterasi
                berikutnya — alur 7 langkah, ICD-10, vital signs, resep, dan
                surat rujukan.
              </p>
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
