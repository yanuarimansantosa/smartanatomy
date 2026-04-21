import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Mail, MapPin, Phone, User } from "lucide-react";
import { fmtTanggal, getPatientById, umurDariTglLahir } from "@/lib/patients";

export const dynamic = "force-dynamic";

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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center gap-3 border-b px-4 py-3 md:px-10 md:py-4">
        <Link
          href="/pasien"
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:bg-muted/70"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold tracking-tight md:text-2xl">
            {p.nama}
          </h1>
          <p className="text-xs text-muted-foreground">
            <span className="font-mono">{p.noRm}</span> ·{" "}
            {p.jk === "L" ? "Laki-laki" : "Perempuan"} · {umurDariTglLahir(p.tglLahir)}
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-6 md:px-10">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <section className="rounded-xl border bg-card p-5 md:col-span-2">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Identitas
            </h2>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <Item icon={<User className="h-3.5 w-3.5" />} label="Nama" value={p.nama} />
              <Item
                icon={<Calendar className="h-3.5 w-3.5" />}
                label="Tanggal lahir"
                value={`${fmtTanggal(p.tglLahir)} (${umurDariTglLahir(p.tglLahir)})`}
              />
              <Item label="Jenis kelamin" value={p.jk === "L" ? "Laki-laki" : "Perempuan"} />
              <Item label="No. RM" value={p.noRm} mono />
              <Item label="NIK" value={p.nik ?? "—"} mono />
            </dl>
          </section>

          <section className="rounded-xl border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Kontak
            </h2>
            <dl className="space-y-3">
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
          </section>

          {p.catatan ? (
            <section className="rounded-xl border bg-card p-5 md:col-span-3">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Catatan klinis
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {p.catatan}
              </p>
            </section>
          ) : null}

          <section className="rounded-xl border border-dashed bg-muted/20 p-5 md:col-span-3">
            <h2 className="mb-1 text-sm font-semibold">Riwayat kunjungan</h2>
            <p className="text-xs text-muted-foreground">
              Modul sesi konsultasi & rekam medis akan ditambahkan di iterasi berikutnya
              (ICD-10, vital signs, resep, surat rujukan).
            </p>
          </section>
        </div>

        <p className="mt-6 text-right text-[11px] text-muted-foreground">
          Dibuat {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(p.createdAt)}
        </p>
      </main>
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
      <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon ? <span>{icon}</span> : null}
        <span>{label}</span>
      </dt>
      <dd className={`mt-0.5 text-sm ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
