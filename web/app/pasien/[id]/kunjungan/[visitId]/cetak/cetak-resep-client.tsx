"use client";

import Link from "next/link";
import { useCallback } from "react";
import { ArrowLeft, Printer, FileWarning } from "lucide-react";
import { NovaCareMark, useBrand } from "@/components/brand-header";

type PatientJson = {
  id: string;
  nama: string;
  noRm: string;
  nik: string | null;
  jk: "L" | "P";
  tglLahir: string;
  umur: string;
  alamat: string | null;
};

type VisitJson = {
  id: string;
  visitNumber: string | null;
  visitDateLong: string;
  chiefComplaint: string | null;
};

type PrescriptionJson = {
  id: string;
  drugName: string;
  genericName: string | null;
  drugForm: string | null;
  strength: string | null;
  dose: string | null;
  frequency: string | null;
  duration: string | null;
  route: string | null;
  instructions: string | null;
  quantity: number | null;
  unit: string | null;
};

type DiagnosisJson = {
  icd10Code: string;
  icd10NameId: string;
  primary: boolean;
};

// Fallback dokter identity kalau brand config belum diisi.
const FALLBACK_DOCTOR_NAME = "dr. Yanuar Iman Santosa, Sp.THT-KL Subsp.A.I.";
const FALLBACK_DOCTOR_SIP = "SIP: ____________________";

export function CetakResepClient({
  patient,
  visit,
  prescriptions,
  diagnoses,
}: {
  patient: PatientJson;
  visit: VisitJson;
  prescriptions: PrescriptionJson[];
  diagnoses: DiagnosisJson[];
}) {
  const { brand, hydrated } = useBrand();
  const clinicName =
    hydrated && brand.clinicName ? brand.clinicName : "Klinik THT-KL";
  const clinicTagline = hydrated ? brand.tagline : "";
  const logoUrl = hydrated ? brand.logoDataUrl : "";
  const doctorName =
    hydrated && brand.doctorName.trim().length > 0
      ? brand.doctorName
      : FALLBACK_DOCTOR_NAME;
  const doctorSip =
    hydrated && brand.doctorSip.trim().length > 0
      ? brand.doctorSip
      : FALLBACK_DOCTOR_SIP;

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const primaryDx = diagnoses.find((d) => d.primary) ?? diagnoses[0];

  return (
    <div className="min-h-dvh bg-muted/30">
      {/* Screen-only toolbar — hidden when printing */}
      <div className="print:hidden sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link
            href={`/pasien/${patient.id}/kunjungan/${visit.id}`}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke kunjungan
          </Link>
          <button
            type="button"
            onClick={handlePrint}
            disabled={prescriptions.length === 0}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            Cetak resep
          </button>
        </div>
      </div>

      {/* Printable sheet — A5 portrait */}
      <main className="mx-auto max-w-3xl px-4 py-6 print:p-0 print:max-w-none">
        <article className="resep-sheet mx-auto rounded-xl border bg-card p-8 shadow-sm print:rounded-none print:border-0 print:shadow-none">
          {/* ---------- Letterhead ---------- */}
          <header className="flex items-start gap-4 border-b border-border pb-4">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                className="h-16 w-16 shrink-0 rounded-xl border border-border/40 object-cover"
              />
            ) : (
              <NovaCareMark className="h-16 w-16" iconSize={36} />
            )}
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight text-foreground">
                {clinicName}
              </h1>
              {clinicTagline ? (
                <p className="mt-0.5 text-xs italic text-muted-foreground">
                  {clinicTagline}
                </p>
              ) : null}
              <p className="mt-2 text-sm font-medium text-foreground">
                {doctorName}
              </p>
              <p className="text-xs text-muted-foreground">{doctorSip}</p>
            </div>
            <div className="shrink-0 text-right text-xs text-muted-foreground">
              <div>Semarang,</div>
              <div className="font-medium text-foreground">
                {visit.visitDateLong}
              </div>
            </div>
          </header>

          {/* ---------- Patient block ---------- */}
          <section className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
            <PatientRow label="Nama" value={patient.nama} />
            <PatientRow
              label="Umur / JK"
              value={`${patient.umur} / ${patient.jk === "L" ? "Laki-laki" : "Perempuan"}`}
            />
            <PatientRow label="No. RM" value={patient.noRm} />
            {patient.alamat ? (
              <PatientRow
                label="Alamat"
                value={patient.alamat}
                className="sm:col-span-3"
              />
            ) : null}
            {primaryDx ? (
              <PatientRow
                label="Diagnosis"
                value={`${primaryDx.icd10NameId} (${primaryDx.icd10Code})`}
                className="sm:col-span-3"
              />
            ) : null}
          </section>

          {/* ---------- R/ list ---------- */}
          <section className="mt-6">
            {prescriptions.length === 0 ? (
              <div className="flex items-start gap-3 rounded-lg border border-dashed border-warning/40 bg-warning/5 p-4 text-sm">
                <FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                <div>
                  <p className="font-medium text-foreground">
                    Belum ada resep pada kunjungan ini
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Tambahkan resep dari halaman kunjungan sebelum mencetak.
                  </p>
                </div>
              </div>
            ) : (
              <ol className="space-y-4">
                {prescriptions.map((rx, idx) => (
                  <li key={rx.id}>
                    <ResepItem rx={rx} index={idx + 1} />
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* ---------- Signature ---------- */}
          <footer className="mt-10 flex items-end justify-end">
            <div className="w-60 text-center">
              <p className="text-xs text-muted-foreground">Hormat kami,</p>
              <div className="mt-14 border-b border-foreground/60" />
              <p className="mt-1 text-sm font-medium">{doctorName}</p>
              <p className="text-xs text-muted-foreground">{doctorSip}</p>
            </div>
          </footer>

          {/* ---------- Resep meta footer ---------- */}
          <div className="mt-6 border-t border-dashed border-border pt-3 text-[10px] text-muted-foreground">
            <p>
              No. Kunjungan: {visit.visitNumber ?? "—"} · Dicetak dari
              NovaCareEMR · Salam AI
            </p>
          </div>
        </article>
      </main>

      {/* ---------- Print CSS ---------- */}
      <style jsx global>{`
        @media print {
          @page {
            size: A5 portrait;
            margin: 12mm 14mm;
          }
          html,
          body {
            background: #fff !important;
          }
          .resep-sheet {
            box-shadow: none !important;
            border: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

function PatientRow({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex gap-2 ${className}`}>
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-muted-foreground">:</span>
      <span className="min-w-0 flex-1 break-words font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

function ResepItem({ rx, index }: { rx: PrescriptionJson; index: number }) {
  // Indonesian Resep format:
  //   R/  [drugName] [strength] [drugForm]              No. [qty] [unit]
  //       S [frequency] [dose] [route] — [instructions]
  const line1Parts = [rx.drugName, rx.strength, rx.drugForm]
    .filter(Boolean)
    .join(" ");
  const sigParts = [
    rx.frequency,
    rx.dose,
    rx.route && rx.route !== "PO" ? rx.route : null,
  ]
    .filter(Boolean)
    .join(" ");
  const durationText = rx.duration ? `· selama ${rx.duration}` : "";
  const instructionsText = rx.instructions ? ` — ${rx.instructions}` : "";
  const qtyLabel =
    rx.quantity != null
      ? `No. ${rx.quantity}${rx.unit ? ` ${rx.unit}` : ""}`
      : null;

  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-start gap-x-3 gap-y-1 font-serif text-[15px] leading-snug">
      <span className="font-semibold text-foreground">R/</span>
      <span className="min-w-0 break-words text-foreground">
        {line1Parts || rx.drugName}
        {rx.genericName && rx.genericName !== rx.drugName ? (
          <span className="ml-2 text-xs italic text-muted-foreground">
            ({rx.genericName})
          </span>
        ) : null}
      </span>
      <span className="whitespace-nowrap text-right text-foreground">
        {qtyLabel}
      </span>

      <span className="text-muted-foreground">{index}.</span>
      <span className="min-w-0 break-words text-foreground">
        <span className="mr-1 font-semibold">S</span>
        {sigParts || "—"}
        {durationText ? (
          <span className="text-muted-foreground"> {durationText}</span>
        ) : null}
        {instructionsText ? (
          <span className="text-muted-foreground">{instructionsText}</span>
        ) : null}
      </span>
      <span className="whitespace-nowrap text-right text-xs text-muted-foreground">
        paraf
      </span>
    </div>
  );
}
