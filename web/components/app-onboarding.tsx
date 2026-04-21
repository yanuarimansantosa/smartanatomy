"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Mic,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  X,
} from "lucide-react";

const FLAG = "novacare:app-onboarded:v1";

type Slide = {
  eyebrow: string;
  icon: React.ReactNode;
  title: string;
  highlight?: string;
  body: React.ReactNode;
};

const SLIDES: Slide[] = [
  {
    eyebrow: "NovaCareEMR · oleh Salam AI",
    icon: <Stethoscope className="h-7 w-7" />,
    title: "Selamat datang",
    highlight: "Dokter",
    body: (
      <>
        <p>
          RME tablet-first yang dirancang untuk praktik THT-KL. Tujuannya satu:
          memangkas waktu admin di balik komputer agar Anda lebih banyak menatap
          pasien, bukan layar.
        </p>
        <p>
          Tour singkat ini cuma 5 layar — bisa diloncati kapan saja.
        </p>
      </>
    ),
  },
  {
    eyebrow: "Cara kerja",
    icon: <ListChecks className="h-7 w-7" />,
    title: "Tujuh langkah",
    highlight: "satu layar.",
    body: (
      <>
        <p>
          Identitas → tanda vital → anamnesa → pemeriksaan → diagnosa → tindakan
          → resep. Semua dalam satu halaman, scroll vertikal saja. Tidak ada
          tab yang lompat-lompat.
        </p>
        <p className="text-muted-foreground">
          Kunjungan tersimpan otomatis. Tanda tangan elektronik di bawah ketika
          siap.
        </p>
      </>
    ),
  },
  {
    eyebrow: "AI co-pilot",
    icon: <Sparkles className="h-7 w-7" />,
    title: "Saran muncul,",
    highlight: "Anda yang putuskan.",
    body: (
      <>
        <p>
          Saat Anda mengetik anamnesa, sistem menyarankan kode ICD-10 yang
          mungkin cocok — berbasis aturan dan kata kunci THT, dapat ditelusuri
          alasannya.
        </p>
        <p className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-sm text-accent">
          <ShieldCheck className="mr-1.5 inline h-4 w-4" />
          Tidak ada Large Language Model di jalur klinis. Brand HARD RULE.
        </p>
      </>
    ),
  },
  {
    eyebrow: "Privasi by design",
    icon: <ShieldCheck className="h-7 w-7" />,
    title: "Data tetap",
    highlight: "di klinik Anda.",
    body: (
      <>
        <p>
          Tersimpan lokal di tablet (offline-first), sinkron ke server klinik
          sendiri. Tidak ada teks pasien yang keluar ke pihak ketiga.
        </p>
        <ul className="space-y-1.5 text-sm">
          <BulletItem>Audit log <em>append-only</em> — tidak bisa diubah</BulletItem>
          <BulletItem>Tenda tangan elektronik mengunci kunjungan</BulletItem>
          <BulletItem>Mode offline saat sinyal hilang</BulletItem>
        </ul>
      </>
    ),
  },
  {
    eyebrow: "Tips terakhir",
    icon: <Mic className="h-7 w-7" />,
    title: "Diktasi suara",
    highlight: "siap pakai.",
    body: (
      <>
        <p>
          Setiap kolom teks mendukung diktasi bawaan perangkat. Tidak perlu
          install apa-apa.
        </p>
        <ul className="space-y-1.5 text-sm">
          <BulletItem>
            <strong>iPad:</strong> tap mic di keyboard — sudah on-device
          </BulletItem>
          <BulletItem>
            <strong>Tablet Android:</strong> aktifkan{" "}
            <em>Faster voice typing</em> di Gboard (penuntun lengkap tersedia di
            halaman pemeriksaan)
          </BulletItem>
        </ul>
        <p className="text-muted-foreground">
          Siap memulai? Tombol <em>Pasien Baru</em> di pojok kanan kolom aksi
          cepat.
        </p>
      </>
    ),
  },
];

export function AppOnboarding() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = typeof window !== "undefined" && localStorage.getItem(FLAG);
    if (!seen) {
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  function dismiss() {
    if (typeof window !== "undefined") {
      localStorage.setItem(FLAG, new Date().toISOString());
    }
    setOpen(false);
  }

  if (!open) return null;

  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;
  const isFirst = step === 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-onboarding-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 backdrop-blur-sm md:items-center"
      onClick={dismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
      >
        {/* Top bar — Lewati */}
        <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={dismiss}
            className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Lewati
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Slide body */}
        <div className="px-6 py-8 md:px-10 md:py-10">
          <p className="mb-3 inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.22em] text-accent">
            <span aria-hidden className="inline-block h-px w-8 bg-accent/60" />
            <span>{slide.eyebrow}</span>
          </p>

          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-accent/30 bg-accent/5 text-accent">
            {slide.icon}
          </div>

          <h2
            id="app-onboarding-title"
            className="font-display text-2xl font-medium leading-tight tracking-tight md:text-3xl"
          >
            {slide.title}
            {slide.highlight ? (
              <>
                {" "}
                <span className="italic font-normal text-primary">
                  {slide.highlight}
                </span>
              </>
            ) : (
              <span className="italic font-normal text-primary">.</span>
            )}
          </h2>

          <div className="mt-5 space-y-3 text-base leading-relaxed text-foreground/85">
            {slide.body}
          </div>
        </div>

        {/* Footer — dots + nav */}
        <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-muted/20 px-6 py-4 md:px-10">
          <div className="flex items-center gap-1.5" aria-label="Progress slide">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setStep(i)}
                aria-label={`Slide ${i + 1}`}
                aria-current={i === step ? "step" : undefined}
                className={`h-1.5 rounded-full transition-all ${
                  i === step
                    ? "w-6 bg-primary"
                    : i < step
                      ? "w-1.5 bg-primary/40"
                      : "w-1.5 bg-border"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {!isFirst ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="inline-flex h-10 items-center gap-1 rounded-xl border border-border bg-background px-3 text-sm font-medium text-muted-foreground transition-colors hover:border-accent hover:text-accent"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Mundur</span>
              </button>
            ) : null}

            {isLast ? (
              <Link
                href="/pasien"
                onClick={dismiss}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
              >
                <Check className="h-4 w-4" />
                Mulai sekarang
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(SLIDES.length - 1, s + 1))}
                className="inline-flex h-10 items-center gap-1 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
              >
                <span>Berikutnya</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BulletItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
      <span>{children}</span>
    </li>
  );
}
