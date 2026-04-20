import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  Search,
  CalendarDays,
  Stethoscope,
  ClipboardList,
  Settings,
} from "lucide-react";
import { NetworkStatus } from "@/components/network-status";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function Home() {
  const today = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b px-6 py-4 md:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
                NovaCareEMR
              </h1>
              <span
                className="inline-flex items-center gap-1 rounded-full border bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground"
                title="Powered by Salam AI"
              >
                <span lang="ar" className="text-sm leading-none">سلام</span>
                <span>Salam AI</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{today}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <NetworkStatus />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 md:px-10">
        <section className="mb-10">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight md:text-3xl">
            Halo, Dokter.
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

      <footer className="border-t px-6 py-6 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 text-center">
          <p className="text-sm font-medium">
            <span lang="ar" className="mr-2">سلام</span>
            NovaCareEMR · powered by Salam AI
          </p>
          <p className="text-xs italic text-muted-foreground">
            Teknologi yang Membawa Kesejahteraan Berkeadilan
          </p>
          <p className="text-[11px] text-muted-foreground">
            PWA · Offline-first · SATUSEHAT-ready · Human-in-the-loop · No LLM
          </p>
        </div>
      </footer>
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
