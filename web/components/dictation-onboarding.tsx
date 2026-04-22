"use client";

import { useEffect, useState } from "react";
import { Mic, X, Settings, Smartphone, Tablet, Laptop, Check } from "lucide-react";

const FLAG = "novacare:dictation-onboarded:v1";

type Platform = "ipad" | "android-tablet" | "desktop";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  // iPadOS 13+ identifies as Macintosh — distinguish via touch points.
  const isIpad =
    /iPad/.test(ua) ||
    (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  if (isIpad) return "ipad";
  if (/Android/.test(ua)) return "android-tablet";
  return "desktop";
}

export function DictationOnboarding() {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>("desktop");

  useEffect(() => {
    setPlatform(detectPlatform());
    const seen = typeof window !== "undefined" && localStorage.getItem(FLAG);
    if (!seen) {
      // Tunggu 1.2s biar page sempat render dulu — biar muncul setelah dokter
      // sudah lihat editornya, bukan blocking saat loading.
      const t = setTimeout(() => setOpen(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  function dismiss() {
    if (typeof window !== "undefined") {
      localStorage.setItem(FLAG, new Date().toISOString());
    }
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-accent hover:text-accent"
        title="Tips dictation suara di iPad / tablet Android"
      >
        <Mic className="h-3 w-3" />
        Bantuan dictation
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-4 backdrop-blur-sm md:items-center"
          onClick={dismiss}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl"
          >
            <button
              type="button"
              onClick={dismiss}
              className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
              aria-label="Tutup"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="border-b border-border/60 px-6 py-5">
              <p className="mb-1 inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em] text-accent">
                <span aria-hidden className="inline-block h-px w-6 bg-accent/60" />
                Tips
              </p>
              <h2 className="font-display text-xl font-medium leading-tight tracking-tight md:text-2xl">
                Diktasi suara — isi anamnesa tanpa mengetik
                <span className="italic font-normal text-primary">.</span>
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Semua kolom teks di NovaCareEMR mendukung dictation bawaan
                perangkat. Tidak perlu install apa-apa. Berikut cara aktifkan
                per platform.
              </p>
            </div>

            <div className="space-y-5 px-6 py-5">
              <Section
                icon={<Tablet className="h-4 w-4" />}
                title="iPad — sudah otomatis"
                tone="ok"
                active={platform === "ipad"}
              >
                <ol className="list-decimal space-y-1 pl-5 text-sm">
                  <li>Tap salah satu kolom teks (mis. Anamnesa singkat).</li>
                  <li>Keyboard iPad muncul dari bawah.</li>
                  <li>
                    Tap ikon <Mic className="inline h-3.5 w-3.5" /> di
                    pojok kiri-bawah keyboard (sebelah spasi).
                  </li>
                  <li>Mulai bicara — teks otomatis muncul.</li>
                </ol>
                <p className="mt-2 rounded-md bg-success/10 px-3 py-2 text-xs text-success">
                  <Check className="mr-1 inline h-3 w-3" />
                  Privasi: di iPad modern (A12+), dictation diproses
                  on-device. Audio tidak keluar perangkat.
                </p>
              </Section>

              <Section
                icon={<Smartphone className="h-4 w-4" />}
                title="Tablet Android — aktifkan sekali"
                tone="warn"
                active={platform === "android-tablet"}
              >
                <p className="text-sm text-muted-foreground">
                  Default Gboard mengirim audio ke server Google. Untuk data
                  klinis, sebaiknya aktifkan mode offline dulu (sekali setup):
                </p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
                  <li>
                    Buka <strong>Settings</strong> → <strong>System</strong> →{" "}
                    <strong>Languages &amp; input</strong>.
                  </li>
                  <li>
                    <strong>On-screen keyboard</strong> →{" "}
                    <strong>Gboard</strong> → <strong>Voice typing</strong>.
                  </li>
                  <li>
                    Aktifkan <strong>&quot;Faster voice typing&quot;</strong>{" "}
                    (atau <em>Offline speech recognition</em>).
                  </li>
                  <li>
                    Download paket bahasa <strong>Indonesia</strong> (sekitar
                    40 MB).
                  </li>
                  <li>
                    Selesai. Sekarang tap mic di keyboard saat di NovaCareEMR
                    — audio diproses di tablet, tidak ke server.
                  </li>
                </ol>
                <div className="mt-2 grid grid-cols-1 gap-2 rounded-md bg-warning/10 px-3 py-2 text-xs text-warning sm:grid-cols-[auto_1fr]">
                  <Settings className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Untuk Samsung Galaxy Tab: Settings → General management →
                    Samsung Keyboard / Gboard settings → Voice input → pilih
                    Gboard → Faster voice typing.
                  </span>
                </div>
              </Section>

              <Section
                icon={<Laptop className="h-4 w-4" />}
                title="Desktop / laptop"
                tone="muted"
                active={platform === "desktop"}
              >
                <p className="text-sm text-muted-foreground">
                  Browser modern (Chrome, Edge) mendukung Web Speech API tapi
                  butuh akses mic eksplisit. Untuk MVP, lebih cepat pakai
                  dictation OS:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  <li>
                    <strong>macOS</strong>: tekan <kbd>Fn</kbd> dua kali di
                    field teks → mulai bicara. Aktifkan di System Settings →
                    Keyboard → Dictation.
                  </li>
                  <li>
                    <strong>Windows 11</strong>: tekan{" "}
                    <kbd>Win</kbd> + <kbd>H</kbd> di field teks → toolbar
                    voice typing muncul.
                  </li>
                </ul>
              </Section>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-muted/20 px-6 py-4">
              <p className="text-xs text-muted-foreground">
                Tips ini muncul sekali. Tombol{" "}
                <span className="inline-flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-[10px]">
                  <Mic className="h-2.5 w-2.5" />
                  Bantuan dictation
                </span>{" "}
                tetap tersedia di header editor.
              </p>
              <button
                type="button"
                onClick={dismiss}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Section({
  icon,
  title,
  tone,
  active,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  tone: "ok" | "warn" | "muted";
  active?: boolean;
  children: React.ReactNode;
}) {
  const ring = active
    ? tone === "ok"
      ? "ring-2 ring-emerald-500/40"
      : tone === "warn"
        ? "ring-2 ring-amber-500/40"
        : "ring-2 ring-primary/30"
    : "";
  return (
    <div className={`rounded-xl border border-border bg-background p-4 ${ring}`}>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-medium">
        {icon}
        {title}
        {active ? (
          <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
            Perangkat Anda
          </span>
        ) : null}
      </h3>
      {children}
    </div>
  );
}
