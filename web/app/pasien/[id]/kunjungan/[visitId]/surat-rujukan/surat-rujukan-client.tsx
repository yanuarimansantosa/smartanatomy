"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { ArrowLeft, Printer, Pencil } from "lucide-react";
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
  visitDate: string;
  visitDateLong: string;
  chiefComplaint: string | null;
};

type SoapJson = {
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
} | null;

type DiagnosisJson = {
  icd10Code: string;
  icd10NameId: string;
  primary: boolean;
};

type PrescriptionJson = {
  drugName: string;
  strength: string | null;
  dose: string | null;
  frequency: string | null;
  duration: string | null;
};

const FALLBACK_DOCTOR_NAME = "dr. Yanuar Iman Santosa, Sp.THT-KL Subsp.A.I.";
const FALLBACK_DOCTOR_SIP = "SIP: ____________________";

// Umum rujukan THT-KL di Semarang — dipakai sebagai quick-pick.
const COMMON_DESTINATIONS = [
  "RSUP Dr. Kariadi Semarang",
  "RS Telogorejo Semarang",
  "RS Elisabeth Semarang",
  "RS Hermina Banyumanik",
  "RSUD K.R.M.T. Wongsonegoro",
  "Dokter Spesialis Bedah THT-KL",
  "Audiologis / Terapi Wicara",
  "Onkologi Radiasi",
];

const COMMON_REASONS = [
  "Diagnostik lanjut",
  "Terapi definitif (operatif)",
  "Konsultasi sub-spesialis",
  "Pemeriksaan penunjang tidak tersedia",
  "Permintaan pasien / keluarga",
];

export function SuratRujukanClient({
  patient,
  visit,
  soap,
  diagnoses,
  prescriptions,
}: {
  patient: PatientJson;
  visit: VisitJson;
  soap: SoapJson;
  diagnoses: DiagnosisJson[];
  prescriptions: PrescriptionJson[];
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

  const [destination, setDestination] = useState<string>(
    COMMON_DESTINATIONS[0],
  );
  const [destinationCustom, setDestinationCustom] = useState<string>("");
  const [reason, setReason] = useState<string>(COMMON_REASONS[0]);

  const destinationFinal =
    destination === "__custom__" ? destinationCustom.trim() : destination;

  const primaryDx = diagnoses.find((d) => d.primary) ?? diagnoses[0];
  const otherDx = diagnoses.filter((d) => d !== primaryDx);

  const terapiSummary = useMemo(() => {
    if (prescriptions.length === 0) return null;
    return prescriptions
      .map((rx) => {
        const head = [rx.drugName, rx.strength].filter(Boolean).join(" ");
        const sig = [rx.frequency, rx.dose].filter(Boolean).join(" ");
        const dur = rx.duration ? ` × ${rx.duration}` : "";
        return `${head} — ${sig || "—"}${dur}`;
      })
      .join("; ");
  }, [prescriptions]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="min-h-dvh bg-muted/30">
      {/* Screen-only toolbar */}
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
            disabled={!destinationFinal}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            Cetak rujukan
          </button>
        </div>
      </div>

      {/* Config (hidden on print) */}
      <section className="print:hidden mx-auto max-w-3xl px-4 pt-6">
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Parameter rujukan
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Tap tujuan &amp; alasan. Anamnesa, pemeriksaan, diagnosis, terapi
            otomatis terisi dari catatan kunjungan.
          </p>

          <div className="mt-4 space-y-5">
            {/* Tujuan */}
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Tujuan rujukan
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {COMMON_DESTINATIONS.map((dest) => {
                  const active = destination === dest;
                  return (
                    <button
                      key={dest}
                      type="button"
                      onClick={() => setDestination(dest)}
                      className={`inline-flex h-10 items-center rounded-lg border px-3 text-xs font-medium transition-colors ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:bg-muted"
                      }`}
                    >
                      {dest}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setDestination("__custom__")}
                  className={`inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors ${
                    destination === "__custom__"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-dashed border-border bg-background hover:bg-muted"
                  }`}
                >
                  <Pencil className="h-3 w-3" />
                  Lainnya
                </button>
              </div>
              {destination === "__custom__" ? (
                <input
                  type="text"
                  value={destinationCustom}
                  onChange={(e) => setDestinationCustom(e.target.value)}
                  placeholder="Nama RS / klinik / dokter tujuan"
                  className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  maxLength={120}
                />
              ) : null}
            </div>

            {/* Alasan */}
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Alasan rujukan
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {COMMON_REASONS.map((r) => {
                  const active = reason === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReason(r)}
                      className={`inline-flex h-10 items-center rounded-lg border px-3 text-xs font-medium transition-colors ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:bg-muted"
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Printable letter */}
      <main className="mx-auto max-w-3xl px-4 py-6 print:p-0 print:max-w-none">
        <article className="rujukan-sheet mx-auto rounded-xl border bg-card p-8 shadow-sm print:rounded-none print:border-0 print:shadow-none">
          {/* Letterhead */}
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
          </header>

          {/* Title */}
          <div className="mt-6 text-center">
            <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
              SURAT RUJUKAN PASIEN
            </h2>
            {visit.visitNumber ? (
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                No. {visit.visitNumber}/RUJ
              </p>
            ) : null}
          </div>

          {/* Body */}
          <div className="mt-6 space-y-5 text-sm leading-relaxed text-foreground">
            <p>
              Kepada Yth.
              <br />
              <span className="font-semibold">
                {destinationFinal || "__________________"}
              </span>
              <br />
              di tempat
            </p>

            <p>Dengan hormat,</p>
            <p>
              Mohon bantuan pemeriksaan dan penatalaksanaan lebih lanjut pada
              pasien berikut:
            </p>

            <dl className="grid grid-cols-[7rem_auto_1fr] gap-x-2 gap-y-1.5">
              <DLRow label="Nama" value={patient.nama} bold />
              <DLRow label="Umur" value={patient.umur} />
              <DLRow
                label="Jenis kelamin"
                value={patient.jk === "L" ? "Laki-laki" : "Perempuan"}
              />
              <DLRow label="No. RM" value={patient.noRm} mono />
              {patient.alamat ? (
                <DLRow label="Alamat" value={patient.alamat} />
              ) : null}
            </dl>

            {visit.chiefComplaint ? (
              <BodyBlock label="Keluhan utama" text={visit.chiefComplaint} />
            ) : null}

            {soap?.subjective ? (
              <BodyBlock label="Anamnesa" text={soap.subjective} />
            ) : null}

            {soap?.objective ? (
              <BodyBlock label="Pemeriksaan fisik" text={soap.objective} />
            ) : null}

            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Diagnosis kerja
              </p>
              <div className="mt-1">
                {primaryDx ? (
                  <p>
                    <span className="font-medium">
                      {primaryDx.icd10NameId}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      ({primaryDx.icd10Code})
                    </span>
                  </p>
                ) : (
                  <p className="text-muted-foreground">—</p>
                )}
                {otherDx.length > 0 ? (
                  <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
                    {otherDx.map((d) => (
                      <li key={d.icd10Code}>
                        {d.icd10NameId} ({d.icd10Code})
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>

            {terapiSummary ? (
              <BodyBlock label="Terapi yang telah diberikan" text={terapiSummary} />
            ) : null}

            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Alasan rujukan
              </p>
              <p className="mt-1">{reason}</p>
            </div>

            <p>
              Demikian rujukan ini kami sampaikan. Atas perhatian dan kerja sama
              Dokter / Sejawat, kami ucapkan terima kasih.
            </p>
          </div>

          {/* Signature */}
          <footer className="mt-10 flex items-start justify-end">
            <div className="w-64 text-center">
              <p className="text-xs text-muted-foreground">
                Semarang, {visit.visitDateLong}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Hormat kami,
              </p>
              <div className="mt-14 border-b border-foreground/60" />
              <p className="mt-1 text-sm font-medium">{doctorName}</p>
              <p className="text-xs text-muted-foreground">{doctorSip}</p>
            </div>
          </footer>

          <div className="mt-6 border-t border-dashed border-border pt-3 text-[10px] text-muted-foreground">
            <p>
              Dicetak dari NovaCareEMR · Salam AI · Kunjungan{" "}
              {visit.visitNumber ?? "—"}
            </p>
          </div>
        </article>
      </main>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 18mm 20mm;
          }
          html,
          body {
            background: #fff !important;
          }
          .rujukan-sheet {
            box-shadow: none !important;
            border: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

function DLRow({
  label,
  value,
  bold = false,
  mono = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
  mono?: boolean;
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-muted-foreground">:</dd>
      <dd className={`${bold ? "font-semibold" : ""} ${mono ? "font-mono" : ""}`}>
        {value}
      </dd>
    </>
  );
}

function BodyBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap">{text}</p>
    </div>
  );
}
