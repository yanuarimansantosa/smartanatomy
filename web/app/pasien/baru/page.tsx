import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PasienBaruForm } from "./form";

export const metadata = {
  title: "Pasien Baru",
};

export default function PasienBaruPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center gap-3 border-b px-4 py-3 md:px-10 md:py-4">
        <Link
          href="/pasien"
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:bg-muted/70"
          aria-label="Kembali ke daftar pasien"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
            Pasien Baru
          </h1>
          <p className="text-xs text-muted-foreground">
            No. RM otomatis akan dibuat saat pasien disimpan.
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-6 md:px-10">
        <PasienBaruForm />
      </main>
    </div>
  );
}
