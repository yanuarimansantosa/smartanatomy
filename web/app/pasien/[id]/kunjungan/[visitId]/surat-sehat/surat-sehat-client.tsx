"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ArrowLeft, Printer } from "lucide-react";
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
};

const FALLBACK_DOCTOR_NAME = "dr. Yanuar Iman Santosa, Sp.THT-KL Subsp.A.I.";
const FALLBACK_DOCTOR_SIP = "SIP: ____________________";

const KEPERLUAN_PRESETS = [
  "Persyaratan sekolah",
  "Persyaratan pekerjaan",
  "Persyaratan SIM / STNK",
  "Persyaratan haji / umroh",
  "Persyaratan asuransi",
  "Persyaratan beasiswa",
];

function fmtLong(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(d);
}

export function SuratSehatClient({
  patient,
  visit,
}: {
  patient: PatientJson;
  visit: VisitJson;
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

  const [keperluan, setKeperluan] = useState<string>(KEPERLUAN_PRESETS[0]);
  const [includeTelinga, setIncludeTelinga] = useState<boolean>(true);
  const [includeHidung, setIncludeHidung] = useState<boolean>(true);
  const [includeTenggorok, setIncludeTenggorok] = useState<boolean>(true);

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
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            <Printer className="h-4 w-4" />
            Cetak surat
          </button>
        </div>
      </div>

      {/* Config (hidden on print) */}
      <section className="print:hidden mx-auto max-w-3xl px-4 pt-6">
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Parameter surat
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Pilih keperluan dan ruang lingkup pemeriksaan THT yang dimasukkan.
          </p>

          <div className="mt-4 space-y-4">
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Keperluan
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {KEPERLUAN_PRESETS.map((k) => {
                  const active = k === keperluan;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setKeperluan(k)}
                      className={`inline-flex h-11 items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:bg-muted"
                      }`}
                    >
                      {k}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Ruang lingkup pemeriksaan
              </label>
              <div
                role="group"
                className="mt-2 grid gap-2 sm:grid-cols-3"
              >
                <ScopeToggle
                  label="Telinga"
                  active={includeTelinga}
                  onClick={() => setIncludeTelinga((x) => !x)}
                />
                <ScopeToggle
                  label="Hidung"
                  active={includeHidung}
                  onClick={() => setIncludeHidung((x) => !x)}
                />
                <ScopeToggle
                  label="Tenggorok"
                  active={includeTenggorok}
                  onClick={() => setIncludeTenggorok((x) => !x)}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Hanya bagian yang aktif yang akan dicantumkan dalam surat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Printable letter */}
      <main className="mx-auto max-w-3xl px-4 py-6 print:p-0 print:max-w-none">
        <article className="surat-sheet mx-auto rounded-xl border bg-card p-8 shadow-sm print:rounded-none print:border-0 print:shadow-none">
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
              SURAT KETERANGAN SEHAT
            </h2>
            {visit.visitNumber ? (
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                No. {visit.visitNumber}/SKT
              </p>
            ) : null}
          </div>

          {/* Body */}
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-foreground">
            <p>Yang bertanda tangan di bawah ini menerangkan bahwa:</p>

            <dl className="grid grid-cols-[7rem_auto_1fr] gap-x-2 gap-y-1.5">
              <dt className="text-muted-foreground">Nama</dt>
              <dd className="text-muted-foreground">:</dd>
              <dd className="font-medium">{patient.nama}</dd>

              <dt className="text-muted-foreground">Umur</dt>
              <dd className="text-muted-foreground">:</dd>
              <dd>{patient.umur}</dd>

              <dt className="text-muted-foreground">Jenis kelamin</dt>
              <dd className="text-muted-foreground">:</dd>
              <dd>{patient.jk === "L" ? "Laki-laki" : "Perempuan"}</dd>

              <dt className="text-muted-foreground">No. RM</dt>
              <dd className="text-muted-foreground">:</dd>
              <dd className="font-mono">{patient.noRm}</dd>

              {patient.nik ? (
                <>
                  <dt className="text-muted-foreground">NIK</dt>
                  <dd className="text-muted-foreground">:</dd>
                  <dd className="font-mono">{patient.nik}</dd>
                </>
              ) : null}

              {patient.alamat ? (
                <>
                  <dt className="text-muted-foreground">Alamat</dt>
                  <dd className="text-muted-foreground">:</dd>
                  <dd>{patient.alamat}</dd>
                </>
              ) : null}
            </dl>

            <p>
              Berdasarkan hasil pemeriksaan pada{" "}
              <span className="font-medium">{visit.visitDateLong}</span>, yang
              bersangkutan dinyatakan{" "}
              <span className="font-semibold">SEHAT JASMANI</span> dan tidak
              dijumpai kelainan klinis yang bermakna pada pemeriksaan THT-KL
              yang dilakukan.
            </p>

            {includeTelinga || includeHidung || includeTenggorok ? (
              <div className="text-muted-foreground">
                Ruang lingkup pemeriksaan meliputi:
                <ul className="mt-1 list-inside list-disc space-y-0.5">
                  {includeTelinga ? (
                    <li>
                      <span className="text-foreground">Telinga</span>:
                      otoskopi, membran timpani, kanalis akustikus eksternus.
                    </li>
                  ) : null}
                  {includeHidung ? (
                    <li>
                      <span className="text-foreground">Hidung</span>:
                      rinoskopi anterior, septum, konka, mukosa.
                    </li>
                  ) : null}
                  {includeTenggorok ? (
                    <li>
                      <span className="text-foreground">Tenggorok</span>:
                      orofaring, tonsil, dinding posterior faring.
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : null}

            <p>
              Surat keterangan ini diberikan untuk{" "}
              <span className="font-semibold">{keperluan.toLowerCase()}</span>{" "}
              dan dapat dipergunakan sebagaimana mestinya.
            </p>
          </div>

          {/* Signature */}
          <footer className="mt-10 flex items-start justify-end">
            <div className="w-64 text-center">
              <p className="text-xs text-muted-foreground">
                Semarang, {fmtLong(visit.visitDate.slice(0, 10))}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Dokter yang memeriksa,
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
            margin: 20mm 22mm;
          }
          html,
          body {
            background: #fff !important;
          }
          .surat-sheet {
            box-shadow: none !important;
            border: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

function ScopeToggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-11 items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background hover:bg-muted"
      }`}
    >
      {label}
    </button>
  );
}
