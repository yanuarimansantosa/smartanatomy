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

export default function Home() {
  const today = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

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
          <h2 className="mb-2 text-2xl font-semibold tracking-tight md:text-3xl">
            Hai, Dokter.
          </h2>
          <p className="text-base text-muted-foreground md:text-lg">
            Pilih aksi cepat untuk memulai sesi konsultasi.
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
          <h3 className="mb-2 text-lg font-semibold">Phase 0 — Foundation aktif</h3>
          <p className="text-sm text-muted-foreground">
            Aplikasi siap dijalankan offline. Status sinkronisasi terlihat di pojok
            kanan atas. Phase berikutnya: Core RME (CRUD pasien, sesi konsultasi,
            ICD-10 autocomplete) — lihat <code className="rounded bg-background px-1.5 py-0.5 text-xs">docs/02-stack-proposal.md</code>.
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
