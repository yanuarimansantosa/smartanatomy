"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  Pencil,
  X,
  Crown,
  Upload,
  Trash2,
  Palette,
  EyeOff,
  Info,
} from "lucide-react";

// ---------- Brand mark (ECG-in-bubble lockup) ----------
// Deep-teal rounded-square bubble + single QRS complex on a flat baseline.
// Replaces generic Stethoscope to assert a clinical-but-distinctive identity.
export function NovaCareMark({
  className = "h-12 w-12",
  iconSize = 28,
}: {
  className?: string;
  iconSize?: number;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground ${className}`}
      aria-hidden
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 28 28"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 14h5.5l1.5-4 2.5 9 2-5 1.5 3h9" />
      </svg>
    </div>
  );
}

// ---------- Types & constants ----------

export type BrandConfig = {
  clinicName: string;
  tagline: string;
  logoDataUrl: string;
  hideAttribution: boolean;
  doctorName: string;
  doctorSip: string;
  customColors: {
    enabled: boolean;
    primary: string;
    secondary: string;
    accent: string;
  };
};

export type BrandTier = "basic" | "pro" | "gold";

const BRAND_KEY = "salamai.brand";
const BRAND_EVENT = "salamai:brand-change";
const MAX_NAME = 60;
const MAX_TAGLINE = 100;
const MAX_DOCTOR_NAME = 80;
const MAX_DOCTOR_SIP = 60;
const MAX_LOGO_BYTES = 500_000;

const DEFAULT: BrandConfig = {
  clinicName: "",
  tagline: "",
  logoDataUrl: "",
  hideAttribution: false,
  doctorName: "",
  doctorSip: "",
  customColors: {
    enabled: false,
    primary: "#0E7C7B",
    secondary: "#F4A261",
    accent: "#14B8A6",
  },
};

// ---------- Storage ----------

function readBrand(): BrandConfig {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(BRAND_KEY);
    if (!raw) return DEFAULT;
    const p = JSON.parse(raw) as Partial<BrandConfig> & {
      customColors?: Partial<BrandConfig["customColors"]>;
    };
    return {
      clinicName: (p.clinicName ?? "").slice(0, MAX_NAME),
      tagline: (p.tagline ?? "").slice(0, MAX_TAGLINE),
      logoDataUrl: p.logoDataUrl ?? "",
      hideAttribution: !!p.hideAttribution,
      doctorName: (p.doctorName ?? "").slice(0, MAX_DOCTOR_NAME),
      doctorSip: (p.doctorSip ?? "").slice(0, MAX_DOCTOR_SIP),
      customColors: {
        enabled: !!p.customColors?.enabled,
        primary: p.customColors?.primary || DEFAULT.customColors.primary,
        secondary: p.customColors?.secondary || DEFAULT.customColors.secondary,
        accent: p.customColors?.accent || DEFAULT.customColors.accent,
      },
    };
  } catch {
    return DEFAULT;
  }
}

function writeBrand(b: BrandConfig) {
  localStorage.setItem(BRAND_KEY, JSON.stringify(b));
  window.dispatchEvent(new CustomEvent(BRAND_EVENT));
}

// ---------- Color helpers ----------

function needsLightText(hex: string): boolean {
  try {
    const h = hex.replace("#", "");
    if (h.length !== 6) return false;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return l < 0.55;
  } catch {
    return false;
  }
}

function applyCustomColors(cc: BrandConfig["customColors"]) {
  const root = document.documentElement;
  const slots: Array<[string, string]> = [
    ["--primary", cc.primary],
    ["--secondary", cc.secondary],
    ["--accent", cc.accent],
  ];
  if (!cc.enabled) {
    for (const [name] of slots) {
      root.style.removeProperty(name);
      root.style.removeProperty(`${name}-foreground`);
    }
    return;
  }
  for (const [name, hex] of slots) {
    root.style.setProperty(name, hex);
    root.style.setProperty(
      `${name}-foreground`,
      needsLightText(hex) ? "#ffffff" : "#111111",
    );
  }
}

// ---------- Tier derivation ----------

function tierOf(b: BrandConfig): BrandTier {
  if (
    b.customColors.enabled ||
    b.logoDataUrl ||
    b.tagline.length > 0 ||
    b.hideAttribution
  ) {
    return "gold";
  }
  if (b.clinicName.length > 0) return "pro";
  return "basic";
}

// ---------- Hook ----------

export function useBrand() {
  const [brand, setBrand] = useState<BrandConfig>(DEFAULT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const fresh = readBrand();
    setBrand(fresh);
    setHydrated(true);
    applyCustomColors(fresh.customColors);

    const onStorage = (e: StorageEvent) => {
      if (e.key === BRAND_KEY) {
        const next = readBrand();
        setBrand(next);
        applyCustomColors(next.customColors);
      }
    };
    const onLocal = () => {
      const next = readBrand();
      setBrand(next);
      applyCustomColors(next.customColors);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(BRAND_EVENT, onLocal);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(BRAND_EVENT, onLocal);
    };
  }, []);

  function update(next: BrandConfig) {
    writeBrand(next);
  }

  return { brand, hydrated, update };
}

// ---------- Header component ----------

export function BrandHeader({ today }: { today: string }) {
  const { brand, hydrated, update } = useBrand();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

  const showCustomName = hydrated && brand.clinicName.length > 0;
  const tier = tierOf(brand);
  const initial = showCustomName
    ? brand.clinicName.trim().charAt(0).toUpperCase()
    : "";
  const showAttribution = !brand.hideAttribution;

  return (
    <div
      className="relative flex min-w-0 items-center gap-3"
      onClick={(e) => e.stopPropagation()}
    >
      {brand.logoDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={brand.logoDataUrl}
          alt="Logo klinik"
          className="h-12 w-12 shrink-0 rounded-2xl border border-border/40 object-cover"
        />
      ) : showCustomName ? (
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground"
          aria-hidden
        >
          {initial}
        </div>
      ) : (
        <NovaCareMark />
      )}

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="group -mx-1 flex w-full max-w-full items-start gap-2 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-muted"
          title="Klik untuk ubah brand"
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <h1 className="min-w-0 flex-1 break-words font-display text-xl font-medium leading-tight tracking-tight md:text-2xl">
            {showCustomName ? (
              brand.clinicName
            ) : (
              <>
                NovaCare<span className="font-normal text-primary">EMR</span>
              </>
            )}
          </h1>
          <Pencil
            className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden
          />
        </button>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
          <span>{today}</span>
          {brand.tagline ? (
            <>
              <Dot />
              <span className="text-xs italic">{brand.tagline}</span>
            </>
          ) : null}
          {showAttribution ? (
            <>
              <Dot />
              <span className="inline-flex items-center gap-1 text-xs">
                {showCustomName ? (
                  <>
                    powered by{" "}
                    <span className="font-semibold text-foreground/70">
                      NovaCareEMR
                    </span>
                    <Dot />
                  </>
                ) : null}
                <span lang="ar" className="text-sm leading-none">
                  سلام
                </span>
                <span>Salam AI</span>
              </span>
            </>
          ) : null}
        </div>
      </div>

      {open ? (
        <BrandEditPanel
          initial={brand}
          tier={tier}
          onSave={(next) => {
            update(next);
            setOpen(false);
          }}
          onReset={() => {
            update(DEFAULT);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}

function Dot() {
  return (
    <span aria-hidden className="mx-1 text-muted-foreground/40">
      ·
    </span>
  );
}

// ---------- Footer component ----------

export function BrandFooter() {
  const { brand, hydrated } = useBrand();

  if (!hydrated) {
    return <BrandFooterDefault />;
  }

  if (brand.hideAttribution) {
    return (
      <footer className="border-t px-6 py-6 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 text-center">
          {brand.clinicName ? (
            <p className="text-sm font-medium">{brand.clinicName}</p>
          ) : null}
          {brand.tagline ? (
            <p className="text-xs italic text-muted-foreground">
              {brand.tagline}
            </p>
          ) : null}
        </div>
      </footer>
    );
  }

  const mainLine = brand.clinicName
    ? `${brand.clinicName} · powered by NovaCareEMR · Salam AI`
    : "NovaCareEMR · powered by Salam AI";

  const taglineLine =
    brand.tagline || "Teknologi yang Membawa Kesejahteraan Berkeadilan";

  return (
    <footer className="border-t px-6 py-6 md:px-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 text-center">
        <p className="text-sm font-medium">
          <span lang="ar" className="mr-2">
            سلام
          </span>
          {mainLine}
        </p>
        <p className="text-xs italic text-muted-foreground">{taglineLine}</p>
        <p className="text-[11px] italic text-muted-foreground/80">
          Intelligence that greets humanity first
        </p>
        <p className="text-[11px] text-muted-foreground">
          PWA · Offline-first · SATUSEHAT-ready · Human-in-the-loop · No LLM
        </p>
        <FooterNav />
      </div>
    </footer>
  );
}

function FooterNav() {
  return (
    <nav className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
      <Link href="/tentang" className="transition-colors hover:text-foreground">
        Tentang
      </Link>
    </nav>
  );
}

function BrandFooterDefault() {
  return (
    <footer className="border-t px-6 py-6 md:px-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 text-center">
        <p className="text-sm font-medium">
          <span lang="ar" className="mr-2">
            سلام
          </span>
          NovaCareEMR · powered by Salam AI
        </p>
        <p className="text-xs italic text-muted-foreground">
          Teknologi yang Membawa Kesejahteraan Berkeadilan
        </p>
        <p className="text-[11px] italic text-muted-foreground/80">
          Intelligence that greets humanity first
        </p>
        <p className="text-[11px] text-muted-foreground">
          PWA · Offline-first · SATUSEHAT-ready · Human-in-the-loop · No LLM
        </p>
        <FooterNav />
      </div>
    </footer>
  );
}

// ---------- Edit panel ----------

function BrandEditPanel({
  initial,
  tier,
  onSave,
  onReset,
  onClose,
}: {
  initial: BrandConfig;
  tier: BrandTier;
  onSave: (b: BrandConfig) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<BrandConfig>(initial);
  const fileRef = useRef<HTMLInputElement>(null);
  const [logoError, setLogoError] = useState("");

  function onLogoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError(
        `Max ${Math.round(MAX_LOGO_BYTES / 1024)} KB — file Anda ${Math.round(file.size / 1024)} KB`,
      );
      return;
    }
    setLogoError("");
    const reader = new FileReader();
    reader.onload = () => {
      setDraft((d) => ({ ...d, logoDataUrl: String(reader.result) }));
    };
    reader.readAsDataURL(file);
  }

  const draftTier = tierOf(draft);

  return (
    <div
      role="dialog"
      aria-label="Brand settings"
      className="absolute left-0 top-full z-50 mt-2 flex max-h-[80vh] w-[min(26rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-xl"
    >
      <div className="flex items-center justify-between border-b bg-popover px-4 py-3">
        <div>
          <div className="text-sm font-semibold">Brand Settings</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>Tier aktif:</span>
            <TierBadge tier={tier} />
            {tier !== draftTier ? (
              <>
                <span className="text-muted-foreground/60">→</span>
                <TierBadge tier={draftTier} />
              </>
            ) : null}
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Tutup"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <Section title="Info klinik" tier="pro">
          <Field label="Nama klinik">
            <input
              type="text"
              value={draft.clinicName}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  clinicName: e.target.value.slice(0, MAX_NAME),
                }))
              }
              placeholder="cth. Klinik THT-KL Yanuar"
              className="w-full rounded-md border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </Field>
        </Section>

        <Section title="Dokter penanggung jawab" tier="pro">
          <Field label="Nama & gelar">
            <input
              type="text"
              value={draft.doctorName}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  doctorName: e.target.value.slice(0, MAX_DOCTOR_NAME),
                }))
              }
              placeholder="cth. dr. Yanuar Iman Santosa, Sp.THT-KL Subsp.A.I."
              className="w-full rounded-md border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </Field>
          <Field label="Nomor SIP">
            <input
              type="text"
              value={draft.doctorSip}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  doctorSip: e.target.value.slice(0, MAX_DOCTOR_SIP),
                }))
              }
              placeholder="cth. SIP: 503/1234/DINKES/2026"
              className="w-full rounded-md border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
            <div className="mt-1 text-[10px] text-muted-foreground">
              Tampil di resep cetak &amp; kop surat. Kosong = fallback default.
            </div>
          </Field>
        </Section>

        <Section title="Logo & tagline" tier="gold">
          <Field label="Logo klinik">
            <div className="flex items-center gap-2">
              {draft.logoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={draft.logoDataUrl}
                  alt="preview"
                  className="h-10 w-10 rounded-lg border border-border/40 object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                  <Upload className="h-4 w-4" />
                </div>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-md border px-2.5 py-1 text-xs transition-colors hover:bg-muted"
              >
                {draft.logoDataUrl ? "Ganti" : "Upload"}
              </button>
              {draft.logoDataUrl ? (
                <button
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({ ...d, logoDataUrl: "" }))
                  }
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-destructive transition-colors hover:bg-destructive/10"
                  title="Hapus logo"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              ) : null}
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={onLogoUpload}
                className="hidden"
              />
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">
              {logoError ? (
                <span className="text-destructive">{logoError}</span>
              ) : (
                <>PNG/SVG/JPG/WebP · max 500 KB · disimpan di browser</>
              )}
            </div>
          </Field>

          <Field label="Tagline">
            <input
              type="text"
              value={draft.tagline}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  tagline: e.target.value.slice(0, MAX_TAGLINE),
                }))
              }
              placeholder="cth. Perawatan dengan hati"
              className="w-full rounded-md border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </Field>

          <Toggle
            checked={draft.hideAttribution}
            onChange={(v) =>
              setDraft((d) => ({ ...d, hideAttribution: v }))
            }
            icon={<EyeOff className="h-3.5 w-3.5" />}
            label="Sembunyikan 'powered by NovaCareEMR · Salam AI'"
            hint="White-label: branding vendor hilang dari header & footer."
          />
        </Section>

        <Section title="Custom palette" tier="gold">
          <Toggle
            checked={draft.customColors.enabled}
            onChange={(v) =>
              setDraft((d) => ({
                ...d,
                customColors: { ...d.customColors, enabled: v },
              }))
            }
            icon={<Palette className="h-3.5 w-3.5" />}
            label="Aktifkan palet custom"
            hint="Override warna primer/sekunder/aksen di atas theme aktif."
          />

          {draft.customColors.enabled ? (
            <div className="space-y-2 rounded-md bg-muted/40 p-3">
              <ColorPicker
                label="Primer"
                value={draft.customColors.primary}
                onChange={(v) =>
                  setDraft((d) => ({
                    ...d,
                    customColors: { ...d.customColors, primary: v },
                  }))
                }
              />
              <ColorPicker
                label="Sekunder"
                value={draft.customColors.secondary}
                onChange={(v) =>
                  setDraft((d) => ({
                    ...d,
                    customColors: { ...d.customColors, secondary: v },
                  }))
                }
              />
              <ColorPicker
                label="Aksen"
                value={draft.customColors.accent}
                onChange={(v) =>
                  setDraft((d) => ({
                    ...d,
                    customColors: { ...d.customColors, accent: v },
                  }))
                }
              />
              <div className="flex items-start gap-1 text-[10px] text-muted-foreground">
                <Info className="mt-0.5 h-3 w-3 shrink-0" />
                <span>
                  Foreground text dihitung otomatis dari luminance (putih atau
                  hitam).
                </span>
              </div>
            </div>
          ) : null}
        </Section>
      </div>

      <div className="flex items-center justify-between gap-2 border-t bg-popover px-4 py-3">
        <button
          onClick={onReset}
          className="text-xs text-muted-foreground underline-offset-2 hover:text-destructive hover:underline"
        >
          Reset semua
        </button>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="rounded-md border px-3 py-1.5 text-xs transition-colors hover:bg-muted"
          >
            Batal
          </button>
          <button
            onClick={() => onSave(draft)}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Small UI atoms ----------

function Section({
  title,
  tier,
  children,
}: {
  title: string;
  tier: Exclude<BrandTier, "basic">;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </div>
        <TierBadge tier={tier} />
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-[11px] font-medium text-muted-foreground">
        {label}
      </div>
      {children}
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
  icon,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-xs">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-border text-primary accent-primary"
      />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 font-medium">
          {icon ? (
            <span className="text-muted-foreground">{icon}</span>
          ) : null}
          <span>{label}</span>
        </div>
        {hint ? (
          <div className="mt-0.5 text-[10px] text-muted-foreground">
            {hint}
          </div>
        ) : null}
      </div>
    </label>
  );
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);

  function commitText() {
    if (/^#[0-9a-f]{6}$/i.test(text)) onChange(text);
    else setText(value);
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
        aria-label={`${label} color picker`}
      />
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commitText}
        onKeyDown={(e) => {
          if (e.key === "Enter") commitText();
        }}
        maxLength={7}
        className="w-24 rounded-md border bg-background px-2 py-1 font-mono text-xs"
      />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function TierBadge({ tier }: { tier: BrandTier }) {
  if (tier === "basic")
    return (
      <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
        Basic
      </span>
    );
  if (tier === "pro")
    return (
      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
        Pro
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded bg-warning/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-warning">
      <Crown className="h-2.5 w-2.5" />
      Gold
    </span>
  );
}
