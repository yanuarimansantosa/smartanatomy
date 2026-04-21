"use client";

import Link from "next/link";
import { ArrowLeft, Check, Stethoscope, Activity, TrendingUp, AlertCircle } from "lucide-react";
import {
  THEMES,
  applyTheme,
  getStoredTheme,
  type ThemeEntry,
  type ThemeId,
} from "@/components/theme-switcher";
import { useEffect, useState } from "react";

export default function ThemePreviewPage() {
  const [active, setActive] = useState<ThemeId>("teduh");

  useEffect(() => {
    setActive(getStoredTheme());
  }, []);

  function pick(id: ThemeId) {
    applyTheme(id);
    localStorage.setItem("salamai.theme", id);
    setActive(id);
  }

  const basic = THEMES.filter((t) => t.tier === "basic");
  const pro = THEMES.filter((t) => t.tier === "pro");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Beranda
            </Link>
            <span className="text-muted-foreground/40">·</span>
            <h1 className="text-lg font-semibold">Theme Preview</h1>
          </div>
          <div className="text-xs text-muted-foreground">
            Klik salah satu kartu untuk memilih tema
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 md:px-10">
        <section className="mb-12">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Basic · Free
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Original NovaCareEMR Palettes
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                3 palet bawaan untuk semua pengguna. Swap warna tanpa mengubah
                karakter aplikasi.
              </p>
            </div>
            <div className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              {basic.length} theme
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {basic.map((t) => (
              <ThemeCard
                key={t.id}
                theme={t}
                active={t.id === active}
                onPick={() => pick(t.id)}
              />
            ))}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  PRO
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Paid · Subscription
                </span>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Lanungga Studio · Design Languages
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                10 palet ekstra dengan karakter warna yang diekstrak dari
                inspirasi design language dunia — buat klinik premium, ICU
                dashboard, lifestyle brand, hingga form-heavy app.
              </p>
            </div>
            <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              {pro.length} theme
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pro.map((t) => (
              <ThemeCard
                key={t.id}
                theme={t}
                active={t.id === active}
                onPick={() => pick(t.id)}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function ThemeCard({
  theme,
  active,
  onPick,
}: {
  theme: ThemeEntry;
  active: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={`group relative overflow-hidden rounded-2xl border text-left transition-all hover:shadow-lg hover:-translate-y-0.5 ${
        active
          ? "border-primary ring-2 ring-primary/30"
          : "border-border hover:border-primary/50"
      }`}
    >
      {/* Scoped theme preview — CSS vars cascade into this block only */}
      <div
        className={`theme-${theme.id} flex flex-col`}
        style={{
          background: "var(--background)",
          color: "var(--foreground)",
        }}
      >
        {/* Header strip */}
        <div
          className="flex items-center gap-2 border-b px-4 py-3"
          style={{
            borderColor: "var(--border)",
            background: "var(--card)",
            color: "var(--card-foreground)",
          }}
        >
          <div
            className="flex h-8 w-8 items-center justify-center"
            style={{
              borderRadius: "var(--radius)",
              background: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            <Stethoscope className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate text-sm font-semibold">{theme.name}</div>
            <div
              className="truncate text-[11px]"
              style={{ color: "var(--muted-foreground)" }}
            >
              {theme.inspiration}
            </div>
          </div>
          {active ? (
            <div
              className="flex h-5 w-5 items-center justify-center rounded-full"
              style={{
                background: "var(--primary)",
                color: "var(--primary-foreground)",
              }}
            >
              <Check className="h-3 w-3" />
            </div>
          ) : null}
        </div>

        {/* Body preview */}
        <div className="flex flex-col gap-3 p-4">
          <div
            className="text-[11px] font-medium uppercase tracking-wider"
            style={{ color: "var(--muted-foreground)" }}
          >
            {theme.tagline}
          </div>

          {/* Sample card */}
          <div
            className="flex items-center gap-2 p-3"
            style={{
              background: "var(--card)",
              color: "var(--card-foreground)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
            }}
          >
            <Activity
              className="h-4 w-4"
              style={{ color: "var(--primary)" }}
            />
            <div className="flex-1 text-xs font-medium">Pasien aktif</div>
            <div className="text-xs font-semibold">128</div>
          </div>

          {/* Buttons row */}
          <div className="flex gap-2">
            <div
              className="flex-1 px-3 py-1.5 text-center text-xs font-medium"
              style={{
                background: "var(--primary)",
                color: "var(--primary-foreground)",
                borderRadius: "var(--radius)",
              }}
            >
              Simpan
            </div>
            <div
              className="px-3 py-1.5 text-xs font-medium"
              style={{
                background: "var(--secondary)",
                color: "var(--secondary-foreground)",
                borderRadius: "var(--radius)",
              }}
            >
              Batal
            </div>
          </div>

          {/* Accent highlight */}
          <div
            className="flex items-center gap-2 px-3 py-2 text-xs"
            style={{
              background: "var(--accent)",
              color: "var(--accent-foreground)",
              borderRadius: "var(--radius)",
            }}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="font-medium">Accent color</span>
          </div>

          {/* Destructive */}
          <div
            className="flex items-center gap-2 text-[11px] font-medium"
            style={{ color: "var(--destructive)" }}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Status critical</span>
          </div>

          {/* Chart swatch line */}
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className="h-2 flex-1 rounded-full"
                style={{ background: `var(--chart-${n})` }}
              />
            ))}
          </div>
        </div>

        {/* Footer metadata strip */}
        <div
          className="flex items-center justify-between border-t px-4 py-2 text-[10px]"
          style={{
            borderColor: "var(--border)",
            background: "var(--muted)",
            color: "var(--muted-foreground)",
          }}
        >
          <span className="font-mono">radius: var(--radius)</span>
          <span className="rounded px-1.5 py-0.5 font-semibold uppercase tracking-wider" style={{ background: "var(--card)", color: "var(--foreground)" }}>
            {theme.mode}
          </span>
        </div>
      </div>

      {/* Tier badge — stays in outer theme, floats on top */}
      {theme.tier === "pro" ? (
        <div className="absolute right-3 top-3 rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground shadow-md">
          PRO
        </div>
      ) : null}
    </button>
  );
}
