import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  Search,
  CalendarDays,
  ClipboardList,
  Settings,
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
      <header className="flex items-center justify-between gap-3 border-b px-6 py-4 md:px-10">
        <BrandHeader today={today} />
        <div className="flex shrink-0 items-center gap-2">
          <ThemeSwitcher />
          <NetworkStatus />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 md:px-10">
        <section className="mb-10">
          <p className="mb-1 text-sm font-medium uppercase tracking-wider text-primary/80">
            <span lang="ar" className="text-base leading-none">سلام</span>
            <span className="ml-2">· salam</span>
          </p>
          <h2 className="mb-2 text-2xl font-semibold tracking-tight md:text-3xl">
            {sapaan}, Dokter.
          </h2>
          <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
            Sistem siap membaca jejak hari ini bersamamu. Keputusan klinis tetap
            ada di tanganmu — kami hanya menyiapkan yang relevan.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction
            icon={<UserPlus className="h-7 w-7" />}
            title="Pasien Baru"
            subtitle="Daftarkan pasien & rekam kunjungan pertama"
            href="/pasien/baru"
          />
          <QuickAction
            icon={<Search className="h-7 w-7" />}
            title="Cari Pasien"
            subtitle="Cari berdasarkan NIK / nama / no. telp"
            href="/pasien"
          />
          <QuickAction
            icon={<CalendarDays className="h-7 w-7" />}
            title="Daftar Hari Ini"
            subtitle="Lihat antrian & jadwal hari ini"
            href="/jadwal"
          />
          <QuickAction
            icon={<ClipboardList className="h-7 w-7" />}
            title="Riwayat Sesi"
            subtitle="Sesi konsultasi terakhir & draft"
            href="/sesi"
          />
          <QuickAction
            icon={<Settings className="h-7 w-7" />}
            title="Pengaturan"
            subtitle="Profil dokter, sinkronisasi, SATUSEHAT"
            href="/pengaturan"
          />
        </section>

        <section className="mt-12 rounded-2xl border bg-muted/30 p-6 md:p-8">
          <h3 className="mb-2 text-lg font-semibold">
            Membaca dulu, menyimpulkan kemudian.
          </h3>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Rekam medis tidak meninggalkan ruangan ini. Tidak ada AI generatif di
            jalur klinis. Setiap saran datang dengan alasan dan bisa kamu koreksi
            — sistem mencatat, belajar, dan keesokan harinya menjadi lebih bijak.
          </p>
        </section>
      </main>

      <BrandFooter />
    </div>
  );
}

function QuickAction({
  icon,
  title,
  subtitle,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <Link href={href} className="group">
      <div className="flex h-full min-h-[140px] flex-col gap-3 rounded-2xl border bg-card p-6 transition-all hover:border-primary/50 hover:bg-accent/50 active:scale-[0.98]">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          {icon}
        </div>
        <div>
          <div className="text-lg font-semibold">{title}</div>
          <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>
        </div>
      </div>
    </Link>
  );
}
