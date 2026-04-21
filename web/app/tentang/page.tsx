import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  HeartHandshake,
  Scale,
  type LucideIcon,
} from "lucide-react";
import { NetworkStatus } from "@/components/network-status";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { DarkToggle } from "@/components/dark-toggle";
import {
  BrandHeader,
  BrandFooter,
  NovaCareMark,
} from "@/components/brand-header";

export const metadata = {
  title: "Tentang",
  description:
    "Salam AI — Ethical Clinical AI. 3 pilar: SETARA · AMAN · RENDAH HATI. 7 prinsip etik. Tagline: Teknologi yang Membawa Kesejahteraan Berkeadilan.",
};

const today = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
}).format(new Date());

type Pilar = {
  Icon: LucideIcon;
  name: string;
  subtitle: string;
  body: string;
};

const PILAR: Pilar[] = [
  {
    Icon: Scale,
    name: "SETARA",
    subtitle: "Keadilan Akses",
    body: "Dokter di Papua mendapat dukungan keputusan klinis yang sama berkualitasnya dengan dokter di RS swasta terbaik Jakarta. Geographic equity score dipantau dan dipublikasi.",
  },
  {
    Icon: ShieldCheck,
    name: "AMAN",
    subtitle: "Kedaulatan Data",
    body: "Rekam medis tidak pernah meninggalkan container tenant. Tidak dijual, tidak di-aggregate identifiable, tidak di-vendor cloud yang menyimpan PII di luar negeri.",
  },
  {
    Icon: HeartHandshake,
    name: "RENDAH HATI",
    subtitle: "Human in the Loop",
    body: "AI menyarankan; dokter memutuskan. Setiap saran punya tombol override yang mudah. Sistem mencatat perbedaan dan belajar — tidak menghukum, tidak menggantikan.",
  },
];

const PRINSIP: Array<{ n: string; title: string; body: string }> = [
  {
    n: "01",
    title: "Primum Non Nocere",
    body: "Drug interaction checker wajib pre-finalize resep. AI tidak pernah memblokir keputusan; ia hanya memberi peringatan dengan reasoning yang dapat ditelusuri.",
  },
  {
    n: "02",
    title: "Human Sovereignty",
    body: "Setiap saran AI dapat di-override dengan satu ketuk. Sistem mencatat perbedaan, mempelajarinya, dan keesokan harinya menjadi lebih bijak — tidak menghukum dokter.",
  },
  {
    n: "03",
    title: "Data Sovereignty",
    body: "Rekam medis adalah milik pasien dan faskes. Tidak dijual ke pihak ketiga. Tidak di-aggregate dalam bentuk yang masih dapat diidentifikasi.",
  },
  {
    n: "04",
    title: "Transparency",
    body: "Setiap saran disertai confidence score dan reasoning. Tidak ada Large Language Model di jalur klinis — tidak ada halusinasi, hanya aturan yang dapat diaudit.",
  },
  {
    n: "05",
    title: "Equitable Intelligence",
    body: "Geographic equity score (Jawa vs luar Jawa) dimonitor dan dipublikasi setiap kuartal. Target: gap kurang dari 10% dalam 12 bulan.",
  },
  {
    n: "06",
    title: "Accountability",
    body: "Setiap akses ke rekam medis — termasuk query RAG — tercatat dalam immutable audit log yang tidak dapat dihapus oleh aplikasi.",
  },
  {
    n: "07",
    title: "Society 5.0",
    body: "Setiap fitur baru harus menjawab pertanyaan: apakah ini membantu dokter lebih manusiawi, atau menambah beban kognitif yang tidak perlu?",
  },
];

export default function Tentang() {
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
        <div className="mx-auto max-w-5xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke beranda
          </Link>

          {/* ---------- Hero ---------- */}
          <section className="mt-10 grid grid-cols-1 items-start gap-10 md:grid-cols-12">
            <div className="md:col-span-8">
              <p className="mb-5 inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.22em] text-accent">
                <span aria-hidden className="inline-block h-px w-8 bg-accent/60" />
                <span lang="ar" className="font-sans text-base normal-case leading-none">
                  سلام
                </span>
                <span>· tentang Salam AI</span>
              </p>

              <h1 className="font-display text-4xl font-medium leading-[1.05] tracking-tight text-foreground md:text-5xl xl:text-6xl">
                Teknologi yang membawa{" "}
                <span className="italic font-normal text-primary">
                  kesejahteraan berkeadilan.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                <em>Intelligence that greets humanity first.</em>
                <span className="mx-2 text-muted-foreground/50">·</span>
                Salam AI adalah Ethical Clinical AI yang menempatkan
                kemanusiaan, kesetaraan, dan kedaulatan data di depan
                kecanggihan teknis.
              </p>
            </div>

            <div className="md:col-span-4">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-3">
                  <NovaCareMark className="h-10 w-10" iconSize={22} />
                  <div>
                    <div className="font-display text-base font-medium">
                      NovaCare<span className="font-normal text-primary">EMR</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Produk pertama Salam AI
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Clinical Practice Operating System — PWA tablet-first,
                  offline-first, SATUSEHAT-priority. Dirancang untuk praktik
                  THT-KL & Alergi-Imunologi, lalu meluas ke spesialis lain.
                </p>
              </div>
            </div>
          </section>

          {/* ---------- North Star ---------- */}
          <section className="mt-16 border-t border-border/60 pt-10">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              North Star
            </p>
            <p className="mt-4 max-w-3xl font-display text-2xl font-normal leading-snug text-foreground md:text-3xl">
              Setiap dokter di Indonesia, di manapun praktiknya, mendapat
              dukungan keputusan klinis yang setara — tanpa data pasiennya
              meninggalkan faskes, tanpa AI mengambil alih keputusan medis.
            </p>
          </section>

          {/* ---------- 3 Pilar ---------- */}
          <section className="mt-16">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Tiga Pilar
            </p>
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight md:text-4xl">
              Apa yang kami pegang.
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
              {PILAR.map((p) => (
                <article
                  key={p.name}
                  className="flex flex-col gap-4 bg-card p-6 md:p-7"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border/80 text-primary">
                    <p.Icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="font-display text-xl font-medium tracking-tight">
                      {p.name}
                    </div>
                    <div className="mt-0.5 text-xs uppercase tracking-wider text-accent">
                      {p.subtitle}
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {p.body}
                  </p>
                </article>
              ))}
            </div>
          </section>

          {/* ---------- 7 Prinsip ---------- */}
          <section className="mt-16">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Tujuh Prinsip Etik
            </p>
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight md:text-4xl">
              Bagaimana kami memutuskan.
            </h2>
            <ol className="mt-8 grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
              {PRINSIP.map((p) => (
                <li key={p.n} className="flex gap-4">
                  <span className="font-display text-xl font-normal text-accent md:text-2xl">
                    {p.n}
                  </span>
                  <div className="border-l border-border pl-4">
                    <div className="font-display text-base font-medium tracking-tight md:text-lg">
                      {p.title}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {p.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* ---------- Brand voice — relocated principle ---------- */}
          <section className="mt-16 rounded-2xl border border-border bg-card p-8 md:p-10">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Suara brand
            </p>
            <p className="mt-4 font-display text-2xl font-normal leading-snug text-foreground md:text-3xl">
              <span className="italic">Membaca dulu,</span> menyimpulkan
              kemudian.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              &ldquo;Berdasarkan yang saya baca, ini yang mungkin relevan.
              Keputusan ada di tangan Anda.&rdquo; — Sapaan sebelum tindakan;
              gesture pertama selalu mengakui kemanusiaan dokter dan pasien.
            </p>
          </section>

          {/* ---------- Anti-pola ---------- */}
          <section className="mt-16">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Yang tidak akan kami lakukan
            </p>
            <ul className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                "LLM / Generative AI di jalur klinis",
                "Cloud vendor menyimpan rekam medis",
                "Black box tanpa reasoning",
                "Tier premium yang menggadaikan akses intelligence klinis",
                "Default tracking pihak ketiga yang mengirim data keluar",
              ].map((s) => (
                <li
                  key={s}
                  className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground"
                >
                  <span
                    aria-hidden
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive/70"
                  />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>

      <BrandFooter />
    </div>
  );
}
