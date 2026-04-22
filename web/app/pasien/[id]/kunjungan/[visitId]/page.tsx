import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Pencil,
  Pill,
  Printer,
  Scissors,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { getPatientById, umurDariTglLahir } from "@/lib/patients";
import {
  fmtJam,
  fmtTanggalKunjungan,
  getVisitById,
  type PrescriptionRow,
  type VisitDiagnosisRow,
  type VisitProcedureRow,
  type VisitRow,
} from "@/lib/visits";
import { NetworkStatus } from "@/components/network-status";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { DarkToggle } from "@/components/dark-toggle";
import { BrandHeader, BrandFooter } from "@/components/brand-header";
import { PatientSubnav } from "@/components/patient-subnav";

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
  params: Promise<{ id: string; visitId: string }>;
}) {
  const { id, visitId } = await params;
  const [p, fv] = await Promise.all([
    getPatientById(id),
    getVisitById(visitId),
  ]);
  if (!p || !fv) return { title: "Kunjungan" };
  return { title: `${fv.visit.visitNumber} · ${p.nama}` };
}

export default async function VisitViewerPage({
  params,
}: {
  params: Promise<{ id: string; visitId: string }>;
}) {
  const { id, visitId } = await params;
  const [p, fv] = await Promise.all([
    getPatientById(id),
    getVisitById(visitId),
  ]);
  if (!p || !fv || fv.visit.patientId !== id) notFound();

  const isL = p.jk === "L";
  const v = fv.visit;
  const signed = !!v.signedAt;

  const totalFee = fv.procedures.reduce((sum, t) => sum + (t.feeIdr ?? 0), 0);

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

      <PatientSubnav patientId={id} patientName={p.nama} patientNoRm={p.noRm} />

      <main className="flex-1 px-6 py-8 md:px-10 md:py-10">
        <div className="mx-auto max-w-6xl">
          <Link
            href={`/pasien/${id}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke pasien
          </Link>

          {/* ---------- Hero ---------- */}
          <section className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-5">
            <div className="min-w-0 flex-1">
              <p className="mb-2 inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.22em] text-accent">
                <span aria-hidden className="inline-block h-px w-8 bg-accent/60" />
                <span>{signed ? "Kunjungan tertanda tangan" : "Pemeriksaan (draf)"}</span>
              </p>
              <h1 className="font-display text-3xl font-medium leading-tight tracking-tight md:text-4xl">
                {p.nama}
                <span className="italic font-normal text-primary">.</span>
              </h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                <span className="font-mono tabular-nums text-foreground/70">
                  {p.noRm}
                </span>
                <span aria-hidden>·</span>
                <span>{isL ? "Laki-laki" : "Perempuan"}</span>
                <span aria-hidden>·</span>
                <span>{umurDariTglLahir(p.tglLahir)}</span>
              </p>
            </div>
            <div className="flex flex-col items-end gap-3 text-right text-sm">
              <div>
                <p className="font-mono tabular-nums text-foreground/80">
                  {v.visitNumber}
                </p>
                <p className="text-muted-foreground">
                  {fmtTanggalKunjungan(v.visitDate)} · {fmtJam(v.visitTime)}
                </p>
              </div>
              {!signed ? (
                <Link
                  href={`/pasien/${id}/kunjungan/${visitId}/edit`}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
                >
                  <Pencil className="h-4 w-4" />
                  Lanjut isi
                </Link>
              ) : null}
            </div>
          </section>

          {/* ---------- Signed banner ---------- */}
          {signed && v.signedAt ? (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
              <p className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                <span>
                  Tertanda tangan{" "}
                  <span className="font-medium">
                    {new Intl.DateTimeFormat("id-ID", {
                      dateStyle: "long",
                      timeStyle: "short",
                    }).format(v.signedAt)}
                  </span>
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/pasien/${p.id}/kunjungan/${v.id}/cetak`}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-success/40 bg-background px-3 text-xs font-medium text-success transition-colors hover:bg-success/10"
                  title="Cetak resep"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Cetak resep
                </Link>
                <Link
                  href={`/pasien/${p.id}/kunjungan/${v.id}/surat-sakit`}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-success/40 bg-background px-3 text-xs font-medium text-success transition-colors hover:bg-success/10"
                  title="Surat keterangan sakit"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Surat sakit
                </Link>
                <Link
                  href={`/pasien/${p.id}/kunjungan/${v.id}/surat-rujukan`}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-success/40 bg-background px-3 text-xs font-medium text-success transition-colors hover:bg-success/10"
                  title="Surat rujukan pasien"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Surat rujukan
                </Link>
                <Link
                  href={`/pasien/${p.id}/kunjungan/${v.id}/surat-sehat`}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-success/40 bg-background px-3 text-xs font-medium text-success transition-colors hover:bg-success/10"
                  title="Surat keterangan sehat"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Surat sehat
                </Link>
              </div>
            </div>
          ) : null}

          {/* ---------- Meta + vitals ---------- */}
          <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card title="Kunjungan" className="md:col-span-1">
              <dl className="space-y-3 text-sm">
                <Row label="Pembayaran" value={paymentLabel(v.paymentType)} />
                <Row
                  label="Status"
                  value={statusReadLabel(v.status)}
                />
                {v.queueNumber != null ? (
                  <Row label="Antrian" value={`#${v.queueNumber}`} mono />
                ) : null}
              </dl>
            </Card>

            <Card title="Tanda vital" className="md:col-span-2">
              <VitalsGrid v={v} />
            </Card>
          </section>

          {/* ---------- Keluhan utama ---------- */}
          {v.chiefComplaint ? (
            <section className="mt-4">
              <Card title="Keluhan utama">
                <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground/90">
                  {v.chiefComplaint}
                </p>
              </Card>
            </section>
          ) : null}

          {/* ---------- SOAP ---------- */}
          <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="S — Subyektif" icon={<Stethoscope className="h-3.5 w-3.5" />}>
              <SoapBlock label="Anamnesa singkat" text={fv.soap?.subjective} />
              <SoapBlock label="Riwayat penyakit sekarang" text={fv.soap?.historyPresent} />
              <SoapBlock label="Riwayat penyakit dahulu" text={fv.soap?.pastHistory} />
            </Card>

            <Card title="O — Obyektif" icon={<Activity className="h-3.5 w-3.5" />}>
              <SoapBlock label="Pemeriksaan fisik" text={fv.soap?.objective} />
            </Card>

            <Card title="A — Assessment">
              <SoapBlock label="Penilaian klinis" text={fv.soap?.assessment} />
              {fv.diagnoses.length > 0 ? (
                <DiagnosesList items={fv.diagnoses} />
              ) : (
                <EmptyHint text="Belum ada diagnosa." />
              )}
            </Card>

            <Card title="P — Plan">
              <SoapBlock label="Rencana penatalaksanaan" text={fv.soap?.plan} />
            </Card>
          </section>

          {/* ---------- Tindakan (ICD-9-CM) ---------- */}
          <section className="mt-4">
            <Card title="Tindakan (ICD-9-CM)" icon={<Scissors className="h-3.5 w-3.5" />}>
              {fv.procedures.length === 0 ? (
                <EmptyHint text="Tidak ada tindakan dicatat." />
              ) : (
                <ProceduresList items={fv.procedures} totalFee={totalFee} />
              )}
            </Card>
          </section>

          {/* ---------- Resep ---------- */}
          <section className="mt-4">
            <Card title="Resep" icon={<Pill className="h-3.5 w-3.5" />}>
              {fv.prescriptions.length === 0 ? (
                <EmptyHint text="Tidak ada resep." />
              ) : (
                <PrescriptionsList items={fv.prescriptions} />
              )}
            </Card>
          </section>

          <p className="mt-8 text-right text-[11px] text-muted-foreground">
            Dibuat{" "}
            {new Intl.DateTimeFormat("id-ID", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(v.createdAt)}
            {v.updatedAt && v.updatedAt.getTime() !== v.createdAt.getTime() ? (
              <>
                {" · diperbarui "}
                {new Intl.DateTimeFormat("id-ID", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(v.updatedAt)}
              </>
            ) : null}
          </p>
        </div>
      </main>

      <BrandFooter />
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function Card({
  title,
  icon,
  className = "",
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-6 ${className}`}>
      <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {icon ? <span className="text-accent">{icon}</span> : null}
        <span>{title}</span>
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </dt>
      <dd className={`text-sm text-foreground ${mono ? "font-mono tabular-nums" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function SoapBlock({ label, text }: { label: string; text?: string | null }) {
  if (!text || !text.trim()) {
    return (
      <div>
        <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
        <p className="text-sm italic text-muted-foreground/70">—</p>
      </div>
    );
  }
  return (
    <div>
      <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
        {text}
      </p>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
      {text}
    </p>
  );
}

function VitalsGrid({ v }: { v: VisitRow }) {
  const items: Array<{ label: string; value: string | null; suffix?: string }> = [
    { label: "BB", value: v.weightKg, suffix: "kg" },
    { label: "TB", value: v.heightCm, suffix: "cm" },
    { label: "BMI", value: v.bmi, suffix: "" },
    { label: "TD", value: v.bloodPressure, suffix: "mmHg" },
    { label: "HR", value: v.heartRate != null ? String(v.heartRate) : null, suffix: "/menit" },
    {
      label: "Suhu",
      value: v.temperatureC,
      suffix: "°C",
    },
    { label: "SpO₂", value: v.spo2 != null ? String(v.spo2) : null, suffix: "%" },
  ];
  const present = items.filter((i) => i.value != null && String(i.value).trim() !== "");
  if (present.length === 0) {
    return <EmptyHint text="Tanda vital tidak dicatat." />;
  }
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 md:grid-cols-4">
      {present.map((i) => (
        <div key={i.label}>
          <dt className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {i.label}
          </dt>
          <dd className="mt-0.5 font-mono text-base tabular-nums text-foreground">
            {i.value}
            {i.suffix ? (
              <span className="ml-1 text-xs font-sans font-normal text-muted-foreground">
                {i.suffix}
              </span>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function DiagnosesList({ items }: { items: VisitDiagnosisRow[] }) {
  return (
    <ul className="divide-y divide-border/60 rounded-lg border border-border">
      {items.map((d) => {
        const typeLabel =
          d.diagnosisType === "primary"
            ? "Primer"
            : d.diagnosisType === "secondary"
              ? "Sekunder"
              : "Komorbid";
        const typeTone =
          d.diagnosisType === "primary"
            ? "bg-primary/10 text-primary"
            : d.diagnosisType === "secondary"
              ? "bg-info/15 text-info"
              : "bg-warning/15 text-warning";
        return (
          <li key={d.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-3 py-2.5">
            <span className="font-mono text-xs tabular-nums text-foreground/80">
              {d.icd10Code}
            </span>
            <span className="min-w-0 flex-1 text-sm text-foreground">
              {d.icd10NameId ?? d.icd10NameEn ?? "—"}
            </span>
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${typeTone}`}
            >
              {typeLabel}
            </span>
            {d.isChronic ? (
              <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Kronik
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function ProceduresList({
  items,
  totalFee,
}: {
  items: VisitProcedureRow[];
  totalFee: number;
}) {
  return (
    <div>
      <ul className="divide-y divide-border/60 rounded-lg border border-border">
        {items.map((t) => (
          <li key={t.id} className="px-3 py-2.5">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-mono text-xs tabular-nums text-foreground/80">
                {t.icd9Code}
              </span>
              <span className="min-w-0 flex-1 text-sm text-foreground">
                {t.icd9NameId ?? t.icd9NameEn ?? "—"}
              </span>
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                  t.isOperative
                    ? "bg-destructive/15 text-destructive"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {t.isOperative ? "Operatif" : "Non-op"}
              </span>
              <span className="font-mono text-xs tabular-nums text-foreground/80">
                {fmtIdr(t.feeIdr)}
              </span>
            </div>
            {t.notes ? (
              <p className="mt-1 text-xs text-muted-foreground">{t.notes}</p>
            ) : null}
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-border/60 pt-3">
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Total tindakan
        </span>
        <span className="font-mono text-base tabular-nums text-foreground">
          {fmtIdr(totalFee)}
        </span>
      </div>
    </div>
  );
}

function PrescriptionsList({ items }: { items: PrescriptionRow[] }) {
  return (
    <ol className="space-y-2.5">
      {items.map((r, i) => (
        <li
          key={r.id}
          className="rounded-lg border border-border bg-background/50 px-4 py-3"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-sm font-medium text-foreground">
              <span className="mr-2 font-mono text-xs tabular-nums text-muted-foreground">
                R/{i + 1}
              </span>
              {r.drugName}
              {r.strength ? (
                <span className="ml-1 text-muted-foreground">{r.strength}</span>
              ) : null}
              {r.drugForm ? (
                <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {r.drugForm}
                </span>
              ) : null}
            </p>
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
              {r.prescriptionNumber}
            </span>
          </div>
          {r.genericName ? (
            <p className="mt-0.5 text-xs italic text-muted-foreground">
              {r.genericName}
            </p>
          ) : null}
          <p className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs text-foreground/80">
            {r.dose ? <span><span className="text-muted-foreground">Dosis:</span> {r.dose}</span> : null}
            {r.frequency ? <span><span className="text-muted-foreground">Frek:</span> {r.frequency}</span> : null}
            {r.duration ? <span><span className="text-muted-foreground">Lama:</span> {r.duration}</span> : null}
            {r.route ? <span><span className="text-muted-foreground">Rute:</span> {r.route}</span> : null}
            {r.quantity != null ? (
              <span>
                <span className="text-muted-foreground">Jumlah:</span> {r.quantity}
                {r.unit ? ` ${r.unit}` : ""}
              </span>
            ) : null}
          </p>
          {r.instructions ? (
            <p className="mt-1.5 rounded-md bg-muted/30 px-2 py-1.5 text-xs text-foreground/80">
              {r.instructions}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

// ============================================================
// Helpers
// ============================================================

function fmtIdr(n: number): string {
  return `Rp ${n.toLocaleString("id-ID", { minimumFractionDigits: 0 })}`;
}

function paymentLabel(t: VisitRow["paymentType"]): string {
  switch (t) {
    case "umum":
      return "Umum";
    case "bpjs":
      return "BPJS";
    case "asuransi":
      return "Asuransi";
  }
}

function statusReadLabel(s: VisitRow["status"]): string {
  switch (s) {
    case "waiting":
      return "Menunggu";
    case "called":
      return "Dipanggil";
    case "in_progress":
      return "Sedang diperiksa";
    case "done":
      return "Selesai";
    case "no_show":
      return "Tidak hadir";
  }
}
