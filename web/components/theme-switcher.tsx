"use client";

import { useEffect, useState } from "react";
import { Palette, Check } from "lucide-react";

export type ThemeId = "teduh" | "hangat" | "selaras";

export const THEMES: Array<{
  id: ThemeId;
  name: string;
  tagline: string;
  swatch: [string, string, string];
}> = [
  {
    id: "teduh",
    name: "Teduh",
    tagline: "Clinical Calm",
    swatch: ["#0E7C7B", "#F4A261", "#FAFAF7"],
  },
  {
    id: "hangat",
    name: "Hangat",
    tagline: "Humanist Indonesian",
    swatch: ["#1E3A5F", "#D4A574", "#FDF9F3"],
  },
  {
    id: "selaras",
    name: "Selaras",
    tagline: "Modern AI-Tech",
    swatch: ["#3D2A5C", "#14B8A6", "#F8F9FB"],
  },
];

const STORAGE_KEY = "salamai.theme";

function applyTheme(id: ThemeId) {
  const root = document.documentElement;
  root.classList.remove("theme-teduh", "theme-hangat", "theme-selaras");
  root.classList.add(`theme-${id}`);
}

export function ThemeSwitcher() {
  const [current, setCurrent] = useState<ThemeId>("teduh");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as ThemeId | null) ?? "teduh";
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
          className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg"
        >
          <div className="border-b px-4 py-3">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Pilih Brand Palette
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              Pilihan disimpan di browser ini.
            </div>
          </div>
          <ul className="py-1">
            {THEMES.map((t) => {
              const active = t.id === current;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => pick(t.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted"
                  >
                    <div className="flex gap-1">
                      {t.swatch.map((c) => (
                        <span
                          key={c}
                          className="h-6 w-6 rounded-md border border-border/40"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {t.name}
                        {active ? (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        ) : null}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t.tagline}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
