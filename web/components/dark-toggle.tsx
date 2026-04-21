"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "salamai.darkmode";

export function applyDark(on: boolean) {
  const root = document.documentElement;
  if (on) root.classList.add("dark");
  else root.classList.remove("dark");
}

export function getStoredDark(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "1";
}

export function DarkToggle() {
  const [on, setOn] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const v = getStoredDark();
    setOn(v);
    setHydrated(true);
  }, []);

  function toggle() {
    const next = !on;
    setOn(next);
    applyDark(next);
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border bg-card text-foreground transition-colors hover:bg-muted"
      aria-label={on ? "Mode terang" : "Mode gelap"}
      title={on ? "Mode terang" : "Mode gelap"}
      suppressHydrationWarning
    >
      {hydrated && on ? (
        <Sun className="h-4 w-4" strokeWidth={1.75} />
      ) : (
        <Moon className="h-4 w-4" strokeWidth={1.75} />
      )}
    </button>
  );
}
