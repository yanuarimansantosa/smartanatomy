import { WifiOff } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-warning/10 text-warning">
        <WifiOff className="h-10 w-10" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight md:text-3xl">
        Anda sedang offline
      </h1>
      <p className="mt-3 max-w-md text-base text-muted-foreground md:text-lg">
        Halaman ini belum tersedia secara offline. Aksi yang sudah pernah dibuka
        tetap bisa diakses, dan semua input akan tersimpan lokal untuk
        disinkronkan saat online kembali.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className={buttonVariants({ size: "lg" })}>
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
