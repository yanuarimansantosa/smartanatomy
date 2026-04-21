"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Palette, Check, LayoutGrid } from "lucide-react";

export type ThemeId =
  | "teduh"
  | "hangat"
  | "selaras"
  | "clearcare"
  | "friendlycare"
  | "smartclinic"
  | "prohealth"
  | "criticalcare"
  | "quickaction"
  | "educare"
  | "formcare"
  | "insightcare"
  | "lifecare";

export type ThemeCategory = "original" | "lanungga";
export type ThemeTier = "basic" | "pro";

export type ThemeEntry = {
  id: ThemeId;
  name: string;
  tagline: string;
  inspiration: string;
  swatch: [string, string, string];
  category: ThemeCategory;
  mode: "light" | "dark";
  tier: ThemeTier;
};

/**
 * Licensing tiers:
 * - Basic (free)  → 3 original NovaCareEMR palettes only
 * - Pro   (paid)  → all 13 palettes (3 original + 10 Lanungga Studio DL)
 */
export const TIER_LABEL: Record<ThemeTier, string> = {
  basic: "Basic · Free",
  pro: "Pro · Paid",
};

export const THEMES: ThemeEntry[] = [
  // ---------- Original NovaCareEMR palettes ----------
  {
    id: "teduh",
    name: "Teduh",
    tagline: "Clinical Calm",
    inspiration: "Salam AI · house brand",
    swatch: ["#0E7C7B", "#F4A261", "#FAFAF7"],
    category: "original",
    mode: "light",
    tier: "basic",
  },
  {
    id: "hangat",
    name: "Hangat",
    tagline: "Humanist Indonesian",
    inspiration: "Salam AI · house brand",
    swatch: ["#1E3A5F", "#D4A574", "#FDF9F3"],
    category: "original",
    mode: "light",
    tier: "basic",
  },
  {
    id: "selaras",
    name: "Selaras",
    tagline: "Modern AI-Tech",
    inspiration: "Salam AI · house brand",
    swatch: ["#3D2A5C", "#14B8A6", "#F8F9FB"],
    category: "original",
    mode: "light",
    tier: "basic",
  },
  // ---------- Lanungga Studio Design Languages (Pro tier) ----------
  {
    id: "clearcare",
    name: "ClearCare",
    tagline: "Clean · Premium · Trust",
    inspiration: "Apple + Medical UX",
    swatch: ["#0A84FF", "#5AC8FA", "#F5F5F7"],
    category: "lanungga",
    mode: "light",
    tier: "pro",
  },
  {
    id: "friendlycare",
    name: "FriendlyCare",
    tagline: "Warm · Welcoming · Close",
    inspiration: "Airbnb + Material",
    swatch: ["#FF5A5F", "#FFB400", "#FFFBF7"],
    category: "lanungga",
    mode: "light",
    tier: "pro",
  },
  {
    id: "smartclinic",
    name: "SmartClinic",
    tagline: "Modern · Modular · Productive",
    inspiration: "Google Material",
    swatch: ["#1A73E8", "#34A853", "#F8F9FA"],
    category: "lanungga",
    mode: "light",
    tier: "pro",
  },
  {
    id: "prohealth",
    name: "ProHealth",
    tagline: "Professional · Disciplined",
    inspiration: "Microsoft Fluent",
    swatch: ["#0078D4", "#2B88D8", "#F3F2F1"],
    category: "lanungga",
    mode: "light",
    tier: "pro",
  },
  {
    id: "criticalcare",
    name: "CriticalCare",
    tagline: "Data-first · Dense · Serious",
    inspiration: "IBM Carbon",
    swatch: ["#0F62FE", "#FA4D56", "#0B0B0B"],
    category: "lanungga",
    mode: "dark",
    tier: "pro",
  },
  {
    id: "quickaction",
    name: "QuickAction",
    tagline: "Urgent · Action · Commerce",
    inspiration: "Amazon",
    swatch: ["#FF9900", "#232F3E", "#FAFAFA"],
    category: "lanungga",
    mode: "light",
    tier: "pro",
  },
  {
    id: "educare",
    name: "EduCare",
    tagline: "Vibrant · Learning · Playful",
    inspiration: "Material + Spotify",
    swatch: ["#6C4BB4", "#A7E34B", "#FBF9FF"],
    category: "lanungga",
    mode: "light",
    tier: "pro",
  },
  {
    id: "formcare",
    name: "FormCare",
    tagline: "Efficient · Data-entry",
    inspiration: "Ant Design",
    swatch: ["#1677FF", "#52C41A", "#F5F5F5"],
    category: "lanungga",
    mode: "light",
    tier: "pro",
  },
  {
    id: "insightcare",
    name: "InsightCare",
    tagline: "Analytical · Dashboard",
    inspiration: "Carbon + Fluent",
    swatch: ["#0E7490", "#F59E0B", "#020617"],
    category: "lanungga",
    mode: "dark",
    tier: "pro",
  },
  {
    id: "lifecare",
    name: "LifeCare",
    tagline: "Lifestyle · Engagement",
    inspiration: "Spotify + Airbnb",
    swatch: ["#1DB954", "#FF6B6B", "#121212"],
    category: "lanungga",
    mode: "dark",
    tier: "pro",
  },
];

const STORAGE_KEY = "salamai.theme";

export function applyTheme(id: ThemeId) {
  const root = document.documentElement;
  const keep = root.className
    .split(/\s+/)
    .filter((c) => c && !c.startsWith("theme-"));
  keep.push(`theme-${id}`);
  root.className = keep.join(" ");
}

export function getStoredTheme(): ThemeId {
  if (typeof window === "undefined") return "teduh";
  const saved = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
  return saved ?? "teduh";
}

export function ThemeSwitcher() {
  const [current, setCurrent] = useState<ThemeId>("teduh");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = getStoredTheme();
    setCurrent(saved);
    applyTheme(saved);
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

  function pick(id: ThemeId) {
    setCurrent(id);
    applyTheme(id);
    localStorage.setItem(STORAGE_KEY, id);
    setOpen(false);
  }

  const currentTheme = THEMES.find((t) => t.id === current) ?? THEMES[0];
  const original = THEMES.filter((t) => t.category === "original");
  const lanungga = THEMES.filter((t) => t.category === "lanungga");

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        aria-haspopup="menu"
        aria-expanded={open}
        title={`Theme: ${currentTheme.name}`}
      >
        <Palette className="h-4 w-4" />
        <span className="hidden sm:inline">Theme: {currentTheme.name}</span>
        <span className="flex gap-0.5">
          {currentTheme.swatch.map((c) => (
            <span
              key={c}
              className="h-3 w-3 rounded-full border border-border/40"
              style={{ backgroundColor: c }}
            />
          ))}
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 max-h-[70vh] w-80 overflow-y-auto rounded-xl border bg-popover text-popover-foreground shadow-lg"
        >
          <ThemeGroup
            label="Basic · Free (3)"
            sublabel="Original NovaCareEMR brand palettes"
            items={original}
            current={current}
            onPick={pick}
          />
          <ThemeGroup
            label="Pro · Paid (10)"
            sublabel="Lanungga Studio Design Languages"
            items={lanungga}
            current={current}
            onPick={pick}
          />
          <Link
            href="/theme-preview"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 border-t px-4 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Lihat semua tema side-by-side →
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function ThemeGroup({
  label,
  sublabel,
  items,
  current,
  onPick,
}: {
  label: string;
  sublabel?: string;
  items: ThemeEntry[];
  current: ThemeId;
  onPick: (id: ThemeId) => void;
}) {
  return (
    <div className="border-b last:border-b-0">
      <div className="sticky top-0 z-10 border-b bg-popover px-4 py-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        {sublabel ? (
          <div className="text-[10px] text-muted-foreground/70">{sublabel}</div>
        ) : null}
      </div>
      <ul className="py-1">
        {items.map((t) => {
          const active = t.id === current;
          return (
            <li key={t.id}>
              <button
                type="button"
                role="menuitem"
                onClick={() => onPick(t.id)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted"
              >
                <div className="flex gap-1">
                  {t.swatch.map((c) => (
                    <span
                      key={c}
                      className="h-5 w-5 rounded-md border border-border/40"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="truncate">{t.name}</span>
                    {t.tier === "pro" ? (
                      <span className="rounded bg-primary/10 px-1.5 py-0 text-[9px] font-bold uppercase tracking-wide text-primary">
                        PRO
                      </span>
                    ) : null}
                    {t.mode === "dark" ? (
                      <span className="rounded bg-muted px-1 py-0 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                        dark
                      </span>
                    ) : null}
                    {active ? (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    ) : null}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {t.tagline} · {t.inspiration}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
