import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPatientById, umurDariTglLahir } from "@/lib/patients";
import { getVisitById, fmtTanggalKunjungan } from "@/lib/visits";
import { NetworkStatus } from "@/components/network-status";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { DarkToggle } from "@/components/dark-toggle";
import { BrandHeader, BrandFooter } from "@/components/brand-header";
import { DictationOnboarding } from "@/components/dictation-onboarding";
import { SoapEditor } from "./editor";

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

export default async function VisitEditPage({
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
  const signed = !!fv.visit.signedAt;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-6 py-3 md:px-10">
        <BrandHeader today={today} />
        <div className="flex shrink-0 items-center gap-2">
          <DictationOnboarding />
          <DarkToggle />
          <ThemeSwitcher />
          <NetworkStatus />
        </div>
      </header>

      <main className="flex-1 px-6 py-8 md:px-10 md:py-10">
        <div className="mx-auto max-w-6xl">
          <Link
            href={`/pasien/${id}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke pasien
          </Link>

          <section className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-5">
            <div>
              <p className="mb-2 inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.22em] text-accent">
                <span aria-hidden className="inline-block h-px w-8 bg-accent/60" />
                <span>{signed ? "Kunjungan tertanda tangan" : "Pemeriksaan"}</span>
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
            <div className="text-right text-sm">
              <p className="font-mono tabular-nums text-foreground/80">
                {fv.visit.visitNumber}
              </p>
              <p className="text-muted-foreground">
                {fmtTanggalKunjungan(fv.visit.visitDate)}
              </p>
            </div>
          </section>

          <SoapEditor patientId={id} visitId={visitId} initial={fv} signed={signed} />
        </div>
      </main>

      <BrandFooter />
    </div>
  );
}
