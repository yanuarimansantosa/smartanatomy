import Link from "next/link";
import { ArrowLeft, Hammer } from "lucide-react";

export const metadata = {
  title: "Segera hadir",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-10 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
        <Hammer className="h-9 w-9" />
      </div>

      <h1 className="mt-6 text-3xl font-bold tracking-tight md:text-4xl">
        Segera hadir
      </h1>
      <p className="mt-3 max-w-md text-base text-muted-foreground md:text-lg">
        Halaman ini sedang dibangun. Modul ini akan tersedia di iterasi berikutnya
        — kami fokus dulu ke modul pasien & sesi konsultasi.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80"
        >
          <ArrowLeft className="h-5 w-5" />
          Kembali ke beranda
        </Link>
        <Link
          href="/pasien"
          className="inline-flex h-12 items-center justify-center rounded-xl border bg-background px-6 text-base font-medium transition-colors hover:bg-muted active:bg-muted/70"
        >
          Buka daftar pasien
        </Link>
      </div>

      <p className="mt-10 text-xs text-muted-foreground">
        NovaCareEMR · Salam AI
      </p>
    </div>
  );
}
