import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Search,
  Settings,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { NetworkStatus } from "@/components/network-status";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { BrandHeader, BrandFooter } from "@/components/brand-header";

function jamWIB(): number {
  const s = new Intl.DateTimeFormat("id-ID", {
    hour: "numeric",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(new Date());
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : 12;
}

function sapaanWaktu(h: number): string {
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
  const sapaan = sapaanWaktu(jamWIB());

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between gap-3 border-b border-border/60 px-6 py-4 md:px-10">
        <BrandHeader today={today} />
        <div className="flex shrink-0 items-center gap-2">
          <ThemeSwitcher />
          <NetworkStatus />
        </div>
      </header>

      <main className="flex-1">
        {/* ---------- Hero band — editorial premium ---------- */}
        <section className="border-b border-border/60 bg-background px-6 py-16 md:px-10 md:py-24">
          <div className="mx-auto w-full max-w-5xl">
            <p className="mb-6 inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.22em] text-accent">
              <span
                aria-hidden
                className="inline-block h-px w-8 bg-accent/60"
              />
              <span lang="ar" className="font-sans text-base normal-case leading-none">
                سلام
              </span>
              <span>· salam · greetings before action</span>
            </p>
            <h1 className="font-display text-4xl font-medium leading-[1.05] tracking-tight text-foreground md:text-6xl">
              {sapaan}, Dokter.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Sistem siap membaca jejak hari ini bersamamu. Keputusan klinis
              tetap di tangan Anda — kami hanya menyiapkan yang relevan, dengan
              alasan yang jelas, di waktu yang tepat.
            </p>

            <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Link
                href="/pasien"
                className="group inline-flex h-14 items-center gap-3 rounded-md bg-primary px-7 text-base font-medium text-primary-foreground shadow-sm transition-all hover:shadow-md active:translate-y-px"
              >
                Buka Daftar Pasien
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/pasien/baru"
                className="inline-flex h-14 items-center gap-2 rounded-md border border-border bg-card px-6 text-base font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-secondary/60"
              >
                Daftarkan Pasien Baru
              </Link>
            </div>
          </div>
        </section>

        {/* ---------- Action grid — premium clinical, hairline cards ---------- */}
        <section className="px-6 py-16 md:px-10 md:py-20">
          <div className="mx-auto w-full max-w-5xl">
            <div className="mb-10 flex items-end justify-between gap-6">
              <div>
                <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  Mulai dari sini
                </p>
                <h2 className="font-display text-2xl font-medium tracking-tight md:text-3xl">
                  Aksi cepat
                </h2>
              </div>
              <p className="hidden max-w-sm text-sm leading-relaxed text-muted-foreground md:block">
                Tata letak dirancang untuk tablet — area tap yang luas, tanpa
                hover, satu aksi utama per tindakan.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
              <PremiumAction
                Icon={UserPlus}
                title="Pasien Baru"
                subtitle="Daftarkan pasien & rekam kunjungan pertama"
                href="/pasien/baru"
              />
              <PremiumAction
                Icon={Search}
                title="Cari Pasien"
                subtitle="NIK · nama · no. RM · telepon"
                href="/pasien"
              />
              <PremiumAction
                Icon={CalendarDays}
                title="Daftar Hari Ini"
                subtitle="Antrian & jadwal — segera hadir"
                href="/jadwal"
                muted
              />
              <PremiumAction
                Icon={ClipboardList}
                title="Riwayat Sesi"
                subtitle="Konsultasi terakhir & draft — segera hadir"
                href="/sesi"
                muted
              />
              <PremiumAction
                Icon={Settings}
                title="Pengaturan"
                subtitle="Profil, brand klinik, sinkronisasi"
                href="/pengaturan"
                muted
              />
              <div className="hidden bg-card md:block" aria-hidden />
            </div>
          </div>
        </section>

        {/* ---------- Editorial principle band ---------- */}
        <section className="border-t border-border/60 bg-secondary/40 px-6 py-20 md:px-10 md:py-28">
          <div className="mx-auto w-full max-w-3xl text-center">
            <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.22em] text-accent">
              Prinsip kami
            </p>
            <h2 className="font-display text-3xl font-medium leading-tight tracking-tight md:text-4xl">
              Membaca dulu,
              <br className="hidden sm:inline" /> menyimpulkan kemudian.
            </h2>
            <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Rekam medis tidak pernah meninggalkan ruangan ini. Tidak ada AI
              generatif di jalur klinis. Setiap saran datang dengan alasan dan
              dapat Anda koreksi — sistem mencatat, belajar, dan keesokan harinya
              menjadi lebih bijak.
            </p>

            <div className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
              <Pillar label="SETARA" caption="Keadilan akses" />
              <Pillar label="AMAN" caption="Kedaulatan data" />
              <Pillar label="RENDAH HATI" caption="Human in the loop" />
            </div>
          </div>
        </section>
      </main>

      <BrandFooter />
    </div>
  );
}

function PremiumAction({
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
      className="group relative flex min-h-[180px] flex-col justify-between bg-card p-7 transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:p-8"
    >
      <div className="flex items-start justify-between">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-md border border-border/80 ${
            muted ? "text-muted-foreground" : "text-primary"
          }`}
          aria-hidden
        >
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </span>
        <ArrowRight
          className="h-5 w-5 -translate-x-1 text-muted-foreground/50 opacity-0 transition-all group-hover:translate-x-0 group-hover:text-primary group-hover:opacity-100"
          strokeWidth={1.5}
          aria-hidden
        />
      </div>
      <div className="mt-8">
        <div className="font-display text-xl font-medium leading-snug tracking-tight">
          {title}
        </div>
        <div className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {subtitle}
        </div>
      </div>
      <span
        aria-hidden
        className="absolute inset-x-7 bottom-0 h-px origin-left scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100"
      />
    </Link>
  );
}

function Pillar({ label, caption }: { label: string; caption: string }) {
  return (
    <div className="bg-card px-4 py-6">
      <div className="font-display text-base font-medium tracking-[0.18em] text-primary">
        {label}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{caption}</div>
    </div>
  );
}
