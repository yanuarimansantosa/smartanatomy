"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpenCheck,
  BrainCog,
  CalendarDays,
  Command,
  GaugeCircle,
  Info,
  Loader2,
  Menu as MenuIcon,
  Scissors,
  Search,
  ScrollText,
  Settings,
  Stethoscope,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import type { SearchCatalog } from "@/app/api/search/catalog/route";
import type { PatientHit } from "@/app/api/search/patients/route";

type MenuItem = { label: string; href: string; Icon: LucideIcon; hint?: string };

const MENU: MenuItem[] = [
  { label: "Beranda", href: "/", Icon: GaugeCircle },
  { label: "Pasien", href: "/pasien", Icon: Users },
  { label: "Pasien baru", href: "/pasien/baru", Icon: User },
  { label: "Jadwal", href: "/jadwal", Icon: CalendarDays, hint: "Segera" },
  { label: "Audit log", href: "/audit", Icon: ScrollText, hint: "Segera" },
  { label: "ICD-10", href: "/icd-10", Icon: BookOpenCheck },
  { label: "ICD-9-CM", href: "/icd-9", Icon: Scissors },
  { label: "CDSS Tester", href: "/cdss-tester", Icon: BrainCog },
  { label: "Tentang", href: "/tentang", Icon: Info },
  { label: "Pengaturan", href: "/pengaturan", Icon: Settings, hint: "Segera" },
];

type ResultRow =
  | { kind: "menu"; key: string; label: string; href: string; hint?: string; Icon: LucideIcon }
  | { kind: "patient"; key: string; nama: string; noRm: string; meta: string; href: string }
  | { kind: "modul"; key: string; title: string; subspecialty: string; tags: string[]; href: string }
  | { kind: "icd10"; key: string; code: string; display: string; moduleTitle: string; href: string }
  | {
      kind: "icd9";
      key: string;
      code: string;
      label: string;
      moduleTitle: string;
      feeIdr?: number;
      href: string;
    };

type Group = { id: string; label: string; rows: ResultRow[] };

const KIND_STYLE: Record<ResultRow["kind"], { Icon: LucideIcon; tone: string }> = {
  menu: { Icon: MenuIcon, tone: "text-foreground/80" },
  patient: { Icon: User, tone: "text-info" },
  modul: { Icon: Stethoscope, tone: "text-primary" },
  icd10: { Icon: BookOpenCheck, tone: "text-success" },
  icd9: { Icon: Scissors, tone: "text-warning" },
};

function fmtIdr(n: number) {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n);
}

function matchesAll(haystacks: string[], terms: string[]): boolean {
  const hay = haystacks.join(" ").toLowerCase();
  return terms.every((t) => hay.includes(t));
}

export function UniversalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [catalog, setCatalog] = useState<SearchCatalog | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [patientHits, setPatientHits] = useState<PatientHit[]>([]);
  const [patientLoading, setPatientLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Global keyboard shortcut: Ctrl/Cmd + K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isCmdK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
      if (isCmdK) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Lazy-load catalog on first open.
  useEffect(() => {
    if (!open || catalog || catalogLoading) return;
    setCatalogLoading(true);
    fetch("/api/search/catalog")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: SearchCatalog | null) => {
        if (data) setCatalog(data);
      })
      .catch(() => {
        /* ignore */
      })
      .finally(() => setCatalogLoading(false));
  }, [open, catalog, catalogLoading]);

  // Focus input when opened.
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    } else {
      setQ("");
      setActiveIdx(0);
    }
  }, [open]);

  // Debounced patient fetch.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setPatientHits([]);
      return;
    }
    setPatientLoading(true);
    const ctl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search/patients?q=${encodeURIComponent(term)}`, { signal: ctl.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { items: PatientHit[] } | null) => {
          if (data) setPatientHits(data.items);
        })
        .catch(() => {
          /* aborted */
        })
        .finally(() => setPatientLoading(false));
    }, 220);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [q]);

  const groups = useMemo<Group[]>(() => {
    const term = q.trim().toLowerCase();
    const terms = term ? term.split(/\s+/).filter(Boolean) : [];

    const menuRows: ResultRow[] = MENU.filter((m) =>
      !terms.length ? true : matchesAll([m.label, m.href, m.hint ?? ""], terms),
    )
      .slice(0, 8)
      .map((m) => ({
        kind: "menu",
        key: `menu:${m.href}`,
        label: m.label,
        href: m.href,
        hint: m.hint,
        Icon: m.Icon,
      }));

    const patientRows: ResultRow[] = patientHits.map((p) => ({
      kind: "patient",
      key: `pt:${p.id}`,
      nama: p.nama,
      noRm: p.noRm,
      meta: `${p.jenisKelamin === "L" ? "♂" : "♀"} · ${p.umur}`,
      href: p.href,
    }));

    const modulRows: ResultRow[] = !catalog
      ? []
      : catalog.modules
          .filter((m) =>
            !terms.length
              ? true
              : matchesAll([m.title, m.subspecialty, m.id, ...(m.tags ?? [])], terms),
          )
          .slice(0, 6)
          .map((m) => ({
            kind: "modul",
            key: `mod:${m.id}`,
            title: m.title,
            subspecialty: m.subspecialty,
            tags: m.tags,
            href: m.href,
          }));

    const icd10Rows: ResultRow[] = !catalog
      ? []
      : catalog.icd10
          .filter((d) =>
            !terms.length
              ? false // jangan banjirin tampilan saat empty query
              : matchesAll([d.code, d.display, d.moduleTitle], terms),
          )
          .slice(0, 8)
          .map((d) => ({
            kind: "icd10",
            key: `i10:${d.moduleId}:${d.code}`,
            code: d.code,
            display: d.display,
            moduleTitle: d.moduleTitle,
            href: d.href,
          }));

    const icd9Rows: ResultRow[] = !catalog
      ? []
      : catalog.icd9
          .filter((p) =>
            !terms.length
              ? false
              : matchesAll([p.code, p.nameId, p.treatmentLabel, p.moduleTitle], terms),
          )
          .slice(0, 8)
          .map((p) => ({
            kind: "icd9",
            key: `i9:${p.moduleId}:${p.code}:${p.treatmentLabel}`,
            code: p.code,
            label: p.treatmentLabel,
            moduleTitle: p.moduleTitle,
            feeIdr: p.feeIdr,
            href: p.href,
          }));

    return [
      { id: "menu", label: "Halaman", rows: menuRows },
      { id: "patient", label: "Pasien", rows: patientRows },
      { id: "modul", label: "Modul CDSS", rows: modulRows },
      { id: "icd10", label: "ICD-10 Diagnosis", rows: icd10Rows },
      { id: "icd9", label: "ICD-9-CM Tindakan", rows: icd9Rows },
    ].filter((g) => g.rows.length > 0);
  }, [q, catalog, patientHits]);

  const flatRows = useMemo(() => groups.flatMap((g) => g.rows), [groups]);

  // Reset active index when result set changes.
  useEffect(() => {
    setActiveIdx(0);
  }, [q, catalog, patientHits]);

  // Keep active row visible.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-row-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx, open]);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, Math.max(0, flatRows.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      const row = flatRows[activeIdx];
      if (row) {
        e.preventDefault();
        navigate(row.href);
      }
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buka pencarian universal"
        className="inline-flex h-10 min-w-[40px] items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground md:min-w-[260px]"
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden />
        <span className="hidden flex-1 text-left md:inline">Cari menu, pasien, ICD, modul…</span>
        <span className="ml-auto hidden items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground md:inline-flex">
          <Command className="h-3 w-3" aria-hidden />
          K
        </span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[200] flex items-start justify-center bg-foreground/40 px-3 pt-[8vh] backdrop-blur-sm md:pt-[10vh]"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Pencarian universal"
            className="flex max-h-[60vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input row */}
            <div className="flex items-center gap-2 border-b border-border px-3">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Cari menu, pasien, ICD-10/9, modul CDSS…"
                className="h-12 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/70"
                aria-label="Kata kunci pencarian"
              />
              {patientLoading || catalogLoading ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
              ) : null}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup pencarian"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {/* Results */}
            <div ref={listRef} className="flex-1 overflow-y-auto">
              {flatRows.length === 0 ? (
                <EmptyState query={q} catalogReady={!!catalog} loading={catalogLoading} />
              ) : (
                groups.map((g) => {
                  const startIdx = flatRows.indexOf(g.rows[0]);
                  return (
                    <section key={g.id} className="px-1.5 py-1.5">
                      <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                        {g.label}
                      </div>
                      <ul>
                        {g.rows.map((row, i) => {
                          const idx = startIdx + i;
                          const active = idx === activeIdx;
                          return (
                            <li key={row.key}>
                              <button
                                type="button"
                                data-row-idx={idx}
                                onClick={() => navigate(row.href)}
                                onMouseEnter={() => setActiveIdx(idx)}
                                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                                  active
                                    ? "bg-primary/10 text-foreground"
                                    : "text-foreground/85 hover:bg-muted/60"
                                }`}
                              >
                                <ResultIcon row={row} />
                                <ResultBody row={row} />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono text-[10px]">↑↓</kbd>
                  navigasi
                </span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono text-[10px]">↵</kbd>
                  pilih
                </span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono text-[10px]">Esc</kbd>
                  tutup
                </span>
              </div>
              <span className="hidden md:inline">{flatRows.length} hasil</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ResultIcon({ row }: { row: ResultRow }) {
  if (row.kind === "menu") {
    const Icon = row.Icon;
    return <Icon className="h-4 w-4 shrink-0 text-foreground/70" aria-hidden />;
  }
  const { Icon, tone } = KIND_STYLE[row.kind];
  return <Icon className={`h-4 w-4 shrink-0 ${tone}`} aria-hidden />;
}

function ResultBody({ row }: { row: ResultRow }) {
  if (row.kind === "menu") {
    return (
      <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <span className="truncate">{row.label}</span>
        {row.hint ? (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
            {row.hint}
          </span>
        ) : null}
      </span>
    );
  }
  if (row.kind === "patient") {
    return (
      <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <span className="min-w-0 truncate">
          <span className="font-medium">{row.nama}</span>
          <span className="ml-2 font-mono text-[11px] text-muted-foreground">{row.noRm}</span>
        </span>
        <span className="shrink-0 text-[11px] text-muted-foreground">{row.meta}</span>
      </span>
    );
  }
  if (row.kind === "modul") {
    return (
      <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <span className="min-w-0 truncate">
          <span className="font-medium">{row.title}</span>
          <span className="ml-2 text-[11px] text-muted-foreground">· {row.subspecialty}</span>
        </span>
        {row.tags[0] ? (
          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {row.tags[0]}
          </span>
        ) : null}
      </span>
    );
  }
  if (row.kind === "icd10") {
    return (
      <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <span className="min-w-0 truncate">
          <span className="font-mono text-[12px] font-semibold">{row.code}</span>
          <span className="ml-2 truncate">{row.display}</span>
        </span>
        <span className="shrink-0 text-[11px] text-muted-foreground">{row.moduleTitle}</span>
      </span>
    );
  }
  // icd9
  return (
    <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
      <span className="min-w-0 truncate">
        <span className="font-mono text-[12px] font-semibold">{row.code}</span>
        <span className="ml-2 truncate">{row.label}</span>
      </span>
      <span className="shrink-0 text-[11px] text-muted-foreground">
        {row.feeIdr ? `Rp ${fmtIdr(row.feeIdr)}` : row.moduleTitle}
      </span>
    </span>
  );
}

function EmptyState({
  query,
  catalogReady,
  loading,
}: {
  query: string;
  catalogReady: boolean;
  loading: boolean;
}) {
  if (loading && !catalogReady) {
    return (
      <div className="flex items-center justify-center gap-2 px-3 py-10 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Memuat katalog…
      </div>
    );
  }
  if (!query.trim()) {
    return (
      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
        <p className="mb-3 text-foreground/80">Cari apa saja di sini</p>
        <p className="text-xs">
          Coba ketik:{" "}
          <code className="rounded bg-muted px-1.5 py-0.5">tonsilitis</code>{" "}
          <code className="rounded bg-muted px-1.5 py-0.5">J35</code>{" "}
          <code className="rounded bg-muted px-1.5 py-0.5">96.52</code>{" "}
          <code className="rounded bg-muted px-1.5 py-0.5">BPPV</code>{" "}
          atau nama pasien
        </p>
      </div>
    );
  }
  return (
    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
      <p>Tidak ada hasil untuk &ldquo;{query}&rdquo;.</p>
      <p className="mt-1 text-xs">Coba kata kunci lain atau kode ICD.</p>
    </div>
  );
}
