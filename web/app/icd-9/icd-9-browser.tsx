"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ExternalLink, Scissors, Search } from "lucide-react";
import type { Icd9Entry } from "@/lib/modules/catalog";

type Props = {
  entries: Icd9Entry[];
  categories: string[];
};

const CATEGORY_LABEL: Record<string, { label: string; cls: string }> = {
  medikamentosa: { label: "Medikamentosa", cls: "bg-info/10 text-info" },
  tindakan: { label: "Tindakan", cls: "bg-warning/10 text-warning" },
  edukasi: { label: "Edukasi", cls: "bg-success/10 text-success" },
  rujukan: { label: "Rujukan", cls: "bg-accent/15 text-accent" },
};

function formatIdr(value: number | undefined): string {
  if (typeof value !== "number") return "—";
  return `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;
}

export function Icd9Browser({ entries, categories }: Props) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("");
  const [operativeOnly, setOperativeOnly] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return entries.filter((e) => {
      if (category && e.category !== category) return false;
      if (operativeOnly && !e.isOperative) return false;
      if (!needle) return true;
      return (
        e.code.toLowerCase().includes(needle) ||
        e.nameId.toLowerCase().includes(needle) ||
        e.treatmentLabel.toLowerCase().includes(needle) ||
        e.moduleTitle.toLowerCase().includes(needle)
      );
    });
  }, [entries, q, category, operativeOnly]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <label className="relative flex-1">
          <span className="sr-only">Cari kode atau nama tindakan</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari kode (mis. 28.2) atau nama (mis. tonsilektomi)…"
            className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-11 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 sm:w-48"
        >
          <option value="">Semua kategori</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABEL[c]?.label ?? c}
            </option>
          ))}
        </select>
        <label className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-foreground">
          <input
            type="checkbox"
            checked={operativeOnly}
            onChange={(e) => setOperativeOnly(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-primary/40"
          />
          <Scissors className="h-4 w-4 text-muted-foreground" aria-hidden />
          <span>Operatif saja</span>
        </label>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        Menampilkan <strong className="text-foreground">{filtered.length}</strong> dari{" "}
        {entries.length} kode.
      </p>

      {filtered.length === 0 ? (
        <EmptyState query={q} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2">Kode</th>
                <th className="px-3 py-2">Nama Tindakan</th>
                <th className="px-3 py-2">Kategori</th>
                <th className="hidden px-3 py-2 md:table-cell">Modul</th>
                <th className="px-3 py-2 text-right">Tarif</th>
                <th className="w-10 px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((e) => {
                const cat = CATEGORY_LABEL[e.category] ?? { label: e.category, cls: "bg-muted text-foreground" };
                return (
                  <tr key={`${e.moduleId}:${e.treatmentId}`} className="transition-colors hover:bg-muted/30">
                    <td className="whitespace-nowrap px-3 py-2.5 align-top">
                      <span className="inline-flex items-center rounded-md border border-border bg-background px-1.5 py-0.5 font-mono text-xs font-semibold tabular-nums">
                        {e.code}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 align-top">
                      <div className="font-medium text-foreground">{e.nameId}</div>
                      {e.nameId !== e.treatmentLabel ? (
                        <div className="text-xs text-muted-foreground">{e.treatmentLabel}</div>
                      ) : null}
                      {e.isOperative ? (
                        <span className="mt-1 inline-flex items-center gap-1 rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-destructive">
                          <Scissors className="h-3 w-3" />
                          Operatif
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 align-top">
                      <span
                        className={`inline-flex rounded px-1.5 py-0.5 text-[11px] font-medium ${cat.cls}`}
                      >
                        {cat.label}
                      </span>
                    </td>
                    <td className="hidden px-3 py-2.5 align-top text-xs text-muted-foreground md:table-cell">
                      <div className="text-foreground">{e.moduleTitle}</div>
                      <div>{e.subspecialty}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right align-top font-mono tabular-nums text-foreground">
                      {formatIdr(e.feeIdr)}
                    </td>
                    <td className="px-3 py-2.5 align-top">
                      <Link
                        href={`/cdss-tester?module=${e.moduleId}`}
                        title={`Buka modul ${e.moduleTitle}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                      >
                        <ExternalLink className="h-4 w-4" aria-hidden />
                        <span className="sr-only">Buka modul {e.moduleTitle}</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center">
      <p className="text-sm font-medium text-foreground">Tidak ada tindakan yang cocok</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {query
          ? `Tidak ditemukan hasil untuk "${query}". Coba kata kunci lain atau ubah filter.`
          : "Tidak ada tindakan untuk filter yang dipilih."}
      </p>
    </div>
  );
}
