"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ExternalLink, Search, Star } from "lucide-react";
import type { Icd10Entry } from "@/lib/modules/catalog";

type Props = {
  entries: Icd10Entry[];
  subspecialties: string[];
};

export function Icd10Browser({ entries, subspecialties }: Props) {
  const [q, setQ] = useState("");
  const [subspecialty, setSubspecialty] = useState<string>("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return entries.filter((e) => {
      if (subspecialty && e.subspecialty !== subspecialty) return false;
      if (!needle) return true;
      return (
        e.code.toLowerCase().includes(needle) ||
        e.display.toLowerCase().includes(needle) ||
        e.moduleTitle.toLowerCase().includes(needle) ||
        (e.reasoning ?? "").toLowerCase().includes(needle)
      );
    });
  }, [entries, q, subspecialty]);

  return (
    <div>
      {/* Controls */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Cari kode atau nama diagnosis</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari kode (mis. J35.0) atau nama (mis. tonsilitis)…"
            className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </label>
        <select
          value={subspecialty}
          onChange={(e) => setSubspecialty(e.target.value)}
          className="h-11 rounded-lg border border-border bg-background px-3 text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 sm:w-56"
        >
          <option value="">Semua subspesialis</option>
          {subspecialties.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Result count */}
      <p className="mb-3 text-xs text-muted-foreground">
        Menampilkan <strong className="text-foreground">{filtered.length}</strong> dari{" "}
        {entries.length} kode.
      </p>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState query={q} />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {filtered.map((e) => (
            <li key={`${e.moduleId}:${e.code}`}>
              <Link
                href={`/cdss-tester?module=${e.moduleId}`}
                className="group flex items-start gap-4 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="shrink-0">
                  <span className="inline-flex min-w-[68px] items-center justify-center rounded-md border border-border bg-background px-2 py-1 font-mono text-sm font-semibold tabular-nums text-foreground">
                    {e.code}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-medium text-foreground">{e.display}</span>
                    {e.defaultPrimary ? (
                      <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                        <Star className="h-3 w-3 fill-current" />
                        Primary default
                      </span>
                    ) : null}
                    {e.isChronic ? (
                      <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-warning">
                        Kronik
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    <span>{e.moduleTitle}</span>
                    <span className="mx-1.5 text-muted-foreground/50">&middot;</span>
                    <span>{e.subspecialty}</span>
                  </div>
                  {e.reasoning ? (
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {e.reasoning}
                    </p>
                  ) : null}
                </div>
                <ExternalLink
                  className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center">
      <p className="text-sm font-medium text-foreground">Tidak ada kode yang cocok</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {query
          ? `Tidak ditemukan hasil untuk "${query}". Coba kata kunci lain atau ubah filter subspesialis.`
          : "Tidak ada kode untuk filter yang dipilih."}
      </p>
    </div>
  );
}
