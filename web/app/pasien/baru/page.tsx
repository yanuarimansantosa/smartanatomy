import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PasienBaruForm } from "./form";
import { NetworkStatus } from "@/components/network-status";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { DarkToggle } from "@/components/dark-toggle";
import { BrandHeader, BrandFooter } from "@/components/brand-header";

export const metadata = {
  title: "Pasien Baru",
};

const today = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
}).format(new Date());

export default function PasienBaruPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-6 py-3 md:px-10">
        <BrandHeader today={today} />
        <div className="flex shrink-0 items-center gap-2">
          <DarkToggle />
          <ThemeSwitcher />
          <NetworkStatus />
        </div>
      </header>

      <main className="flex-1 px-6 py-10 md:px-10 md:py-14">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/pasien"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke daftar pasien
          </Link>

          {/* ---------- Hero ---------- */}
          <section className="mt-10">
            <p className="mb-5 inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.22em] text-accent">
              <span aria-hidden className="inline-block h-px w-8 bg-accent/60" />
              <span>Registrasi pasien</span>
            </p>

            <h1 className="font-display text-4xl font-medium leading-[1.05] tracking-tight text-foreground md:text-5xl">
              Pasien{" "}
              <span className="italic font-normal text-primary">baru.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
              Lengkapi data identitas dan kontak. Nomor rekam medis akan dibuat
              otomatis saat pasien disimpan.
            </p>
          </section>

          {/* ---------- Form ---------- */}
          <section className="mt-10 border-t border-border/60 pt-8">
            <PasienBaruForm />
          </section>
        </div>
      </main>

      <BrandFooter />
    </div>
  );
}
