import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Search,
  ShieldCheck,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { NetworkStatus } from "@/components/network-status";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { DarkToggle } from "@/components/dark-toggle";
import { BrandHeader, BrandFooter } from "@/components/brand-header";
import { AppOnboarding } from "@/components/app-onboarding";
import { doaHariIni } from "@/lib/doa-templates";

function jamWIB(): number {
  const s = new Intl.DateTimeFormat("id-ID", {
    hour: "numeric",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(new Date());
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : 12;
}

function salamWaktu(h: number): string {
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}

export default function Home() {
  const now = new Date();
  const today = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(now);
  const salam = salamWaktu(jamWIB());
  const doa = doaHariIni(now);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-6 py-3 md:px-10">
        <BrandHeader today={today} />
        <div className="flex shrink-0 items-center gap-2">
          <NoLlmBadge />
          <DarkToggle />
          <ThemeSwitcher />
          <NetworkStatus />
        </div>
      </header>

      <main className="flex flex-1 flex-col px-6 py-6 md:px-10 md:py-8">
        <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
          {/* ---------- Hero column ---------- */}
          <section className="flex flex-col justify-center lg:col-span-7">
            <p className="mb-5 inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.22em] text-accent">
              <span aria-hidden className="inline-block h-px w-8 bg-accent/60" />
              <span lang="ar" className="font-sans text-base normal-case leading-none">
                سلام
              </span>
              <span>· salam · greetings before action</span>
            </p>

            <h1 className="font-display text-4xl font-medium leading-[1.05] tracking-tight text-foreground md:text-5xl xl:text-6xl">
              {salam},{" "}
              <span className="italic font-normal text-primary">Dokter.</span>
            </h1>

            <p className="mt-4 max-w-xl text-[15px] italic leading-relaxed text-accent md:text-base">
              {doa}
            </p>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Siap memulai sesi konsultasi. Kami menyiapkan yang relevan dengan
              alasan yang jelas — keputusan klinis tetap di tangan Anda.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/pasien"
                className="group inline-flex h-12 items-center gap-3 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:shadow-md active:translate-y-px md:h-13 md:px-7 md:text-base"
              >
                Buka Daftar Pasien
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 md:h-5 md:w-5" />
              </Link>
              <OfflinePulseBadge />
            </div>
          </section>

          {/* ---------- Action column — 2x2 hairline grid ---------- */}
          <section className="lg:col-span-5">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Aksi cepat
            </p>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border">
              <CompactAction
                Icon={UserPlus}
                title="Pasien Baru"
                subtitle="Daftarkan & rekam kunjungan"
                href="/pasien/baru"
              />
              <CompactAction
                Icon={Search}
                title="Cari Pasien"
                subtitle="NIK · nama · no. RM"
                href="/pasien"
              />
              <CompactAction
                Icon={CalendarDays}
                title="Daftar Hari Ini"
                subtitle="Antrian & jadwal"
                href="/jadwal"
              />
              <CompactAction
                Icon={ClipboardList}
                title="Riwayat Sesi"
                subtitle="Konsultasi & draft"
                href="/sesi"
              />
            </div>
          </section>
        </div>
      </main>

      <BrandFooter />
      <AppOnboarding />
    </div>
  );
}

function CompactAction({
  Icon,
  title,
  subtitle,
  href,
  muted = false,
}: {
  Icon: LucideIcon;
  title: string;
  subtitle: string;
  href: string;
  muted?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group relative flex min-h-[140px] flex-col justify-between bg-card p-5 transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <div className="flex items-start justify-between">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-md border border-border/80 ${
            muted ? "text-muted-foreground" : "text-primary"
          }`}
          aria-hidden
        >
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </span>
        <ArrowRight
          className="h-4 w-4 -translate-x-1 text-muted-foreground/50 opacity-0 transition-all group-hover:translate-x-0 group-hover:text-primary group-hover:opacity-100"
          strokeWidth={1.5}
          aria-hidden
        />
      </div>
      <div className="mt-4">
        <div className="font-display text-base font-medium leading-snug tracking-tight md:text-lg">
          {title}
        </div>
        <div className="mt-1 text-xs leading-relaxed text-muted-foreground md:text-[13px]">
          {subtitle}
        </div>
      </div>
      <span
        aria-hidden
        className="absolute inset-x-5 bottom-0 h-px origin-left scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100"
      />
    </Link>
  );
}

function OfflinePulseBadge() {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground"
      title="Rekam medis tersimpan lokal. Sinkron otomatis saat online."
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
      </span>
      Offline-first · Tersimpan lokal
    </span>
  );
}

function NoLlmBadge() {
  return (
    <span
      className="hidden items-center gap-1.5 rounded-full border border-accent/40 bg-accent/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent md:inline-flex"
      title="Tidak ada Large Language Model di jalur klinis. Saran berbasis aturan dengan reasoning yang dapat ditelusuri."
    >
      <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
      No LLM
    </span>
  );
}
