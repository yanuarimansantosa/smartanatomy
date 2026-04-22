"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Info,
  Loader2,
  RotateCcw,
  Siren,
  Sparkles,
} from "lucide-react";
import { getModuleSpec } from "@/lib/modules/registry";
import {
  emptyContext,
  type CdssSuggestion,
  type EmergencyTrigger,
  type ModuleContext,
  type ModuleSpec,
  type TapItem,
} from "@/lib/modules/types";

type Listing = {
  id: string;
  title: string;
  subspecialty: string;
  tags: string[];
};

type Props = {
  listings: Listing[];
};

const LEVEL_STYLE: Record<
  CdssSuggestion["level"],
  { cls: string; Icon: typeof Info; label: string }
> = {
  info: { cls: "border-info/40 bg-info/10 text-info", Icon: Info, label: "Info" },
  warn: {
    cls: "border-warning/40 bg-warning/10 text-warning",
    Icon: CircleAlert,
    label: "Waspada",
  },
  danger: {
    cls: "border-destructive/40 bg-destructive/10 text-destructive",
    Icon: AlertTriangle,
    label: "Bahaya",
  },
  success: {
    cls: "border-success/40 bg-success/10 text-success",
    Icon: CheckCircle2,
    label: "Positif",
  },
  emergency: {
    cls: "border-destructive bg-destructive text-destructive-foreground",
    Icon: Siren,
    label: "DARURAT",
  },
};

function pickInitialId(listings: Listing[]): string {
  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    const fromUrl = url.searchParams.get("module");
    if (fromUrl && listings.some((l) => l.id === fromUrl)) return fromUrl;
  }
  return listings[0]?.id ?? "";
}

export function CdssTesterClient({ listings }: Props) {
  const [moduleId, setModuleId] = useState<string>("");
  const [spec, setSpec] = useState<ModuleSpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [ctxByModule, setCtxByModule] = useState<Record<string, ModuleContext>>({});

  // Pick initial module (query ?module=xxx if valid).
  useEffect(() => {
    setModuleId(pickInitialId(listings));
  }, [listings]);

  // Load spec whenever module changes.
  useEffect(() => {
    let cancelled = false;
    if (!moduleId) {
      setSpec(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    getModuleSpec(moduleId)
      .then((s) => {
        if (cancelled) return;
        setSpec(s);
      })
      .catch(() => {
        if (!cancelled) setSpec(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [moduleId]);

  const ctx: ModuleContext | null = useMemo(() => {
    if (!spec) return null;
    return ctxByModule[spec.id] ?? emptyContext(spec);
  }, [spec, ctxByModule]);

  function updateCtx(updater: (c: ModuleContext) => ModuleContext) {
    if (!spec) return;
    setCtxByModule((prev) => {
      const current = prev[spec.id] ?? emptyContext(spec);
      return { ...prev, [spec.id]: updater(current) };
    });
  }

  function toggleAnamnesis(id: string) {
    updateCtx((c) => ({ ...c, anamnesis: { ...c.anamnesis, [id]: !c.anamnesis[id] } }));
  }
  function toggleExam(id: string) {
    updateCtx((c) => ({ ...c, examination: { ...c.examination, [id]: !c.examination[id] } }));
  }
  function resetAll() {
    if (!spec) return;
    setCtxByModule((prev) => ({ ...prev, [spec.id]: emptyContext(spec) }));
  }

  const suggestions = useMemo<CdssSuggestion[]>(() => {
    if (!spec || !ctx) return [];
    const out: CdssSuggestion[] = [];
    for (const rule of spec.cdssRules ?? []) {
      try {
        const s = rule.evaluate(ctx);
        if (s) out.push(s);
      } catch {
        /* skip broken rules */
      }
    }
    return out;
  }, [spec, ctx]);

  const activeEmergency = useMemo<EmergencyTrigger | null>(() => {
    if (!spec || !ctx) return null;
    for (const trig of spec.emergencyTriggers ?? []) {
      try {
        if (trig.trigger(ctx)) return trig;
      } catch {
        /* skip */
      }
    }
    return null;
  }, [spec, ctx]);

  const soap = useMemo(() => {
    if (!spec || !ctx) return null;
    try {
      return {
        S: spec.soapMapping.subjective(ctx),
        O: spec.soapMapping.objective(ctx),
        A: spec.soapMapping.assessment(ctx),
        P: spec.soapMapping.plan(ctx),
      };
    } catch {
      return null;
    }
  }, [spec, ctx]);

  if (listings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center">
        <p className="text-sm font-medium text-foreground">Belum ada modul terdaftar</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Daftarkan modul di <code className="rounded bg-muted px-1">web/lib/modules/registry.ts</code>.
        </p>
      </div>
    );
  }

  // Module picker is always shown, even while loading.
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-4">
        <section className="rounded-lg border border-border bg-card p-3">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="cdss-module" className="text-xs font-medium text-muted-foreground">
              Modul:
            </label>
            <select
              id="cdss-module"
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              className="h-10 flex-1 min-w-[14rem] rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              {listings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title} &mdash; {l.subspecialty}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={resetAll}
              disabled={!spec}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Reset
            </button>
          </div>
          {spec?.tags && spec.tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {spec.tags.map((t) => (
                <span
                  key={t}
                  className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        {loading ? (
          <LoadingCard />
        ) : !spec || !ctx ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
            Gagal memuat modul. Coba pilih modul lain.
          </div>
        ) : (
          <>
            {activeEmergency ? <EmergencyBanner trigger={activeEmergency} /> : null}

            <TapSection
              title={spec.anamnesis.title}
              helper={spec.anamnesis.helper}
              items={spec.anamnesis.items}
              values={ctx.anamnesis}
              onToggle={toggleAnamnesis}
              summaryCount={spec.anamnesis.items.filter((i) => ctx.anamnesis[i.id]).length}
              totalCount={spec.anamnesis.items.length}
            />

            <TapSection
              title={spec.examination.title}
              helper={spec.examination.helper}
              items={spec.examination.items}
              values={ctx.examination}
              onToggle={toggleExam}
              summaryCount={spec.examination.items.filter((i) => ctx.examination[i.id]).length}
              totalCount={spec.examination.items.length}
            />
          </>
        )}
      </div>

      <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto">
        {soap ? (
          <section className="rounded-lg border border-primary/30 bg-card p-3 shadow-sm ring-1 ring-primary/10">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden />
              Auto-Compose SOAP
              <span className="ml-auto text-[10px] font-normal uppercase tracking-wider text-muted-foreground">
                Live
              </span>
            </h2>
            <div className="grid gap-2 text-sm">
              <SoapCell label="S — Subjective" body={soap.S} />
              <SoapCell label="O — Objective" body={soap.O} />
              <SoapCell label="A — Assessment" body={soap.A} />
              <SoapCell label="P — Plan" body={soap.P} />
            </div>
          </section>
        ) : null}

        <section className="rounded-lg border border-border bg-card p-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
            CDSS Output
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {!spec
              ? "Pilih modul untuk mulai testing."
              : suggestions.length > 0
                ? `${suggestions.length} saran aktif dari ${spec.cdssRules?.length ?? 0} rule.`
                : `Tidak ada saran aktif. ${spec.cdssRules?.length ?? 0} rule ter-evaluasi.`}
          </p>
        </section>

        {spec && suggestions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center text-xs text-muted-foreground">
            <p>Tap &ldquo;Ya&rdquo; pada temuan di kiri untuk melihat CDSS menyala.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {suggestions.map((s) => (
              <CdssCard key={s.ruleId} suggestion={s} />
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 p-8 text-sm text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
      Memuat modul…
    </div>
  );
}

function TapSection({
  title,
  helper,
  items,
  values,
  onToggle,
  summaryCount,
  totalCount,
}: {
  title: string;
  helper?: string;
  items: TapItem[];
  values: Record<string, boolean>;
  onToggle: (id: string) => void;
  summaryCount: number;
  totalCount: number;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <header className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">
            {helper ?? "Default semua jawaban Tidak. Tap Ya hanya pada temuan positif."}
          </p>
        </div>
        <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {summaryCount}/{totalCount} positif
        </span>
      </header>
      <ul className="divide-y divide-border/60">
        {items.map((it) => {
          const isYa = !!values[it.id];
          return (
            <li
              key={it.id}
              className="flex items-center gap-3 py-2 first:pt-0 last:pb-0"
            >
              <span className="min-w-0 flex-1 text-sm leading-snug text-foreground">
                {it.abnormalLabel}
                {isYa ? null : (
                  <span className="ml-2 hidden text-[11px] text-muted-foreground sm:inline">
                    (default: Tidak)
                  </span>
                )}
              </span>
              <YesNoToggle isYes={isYa} onChange={() => onToggle(it.id)} itemId={it.id} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function YesNoToggle({
  isYes,
  onChange,
  itemId,
}: {
  isYes: boolean;
  onChange: () => void;
  itemId: string;
}) {
  // Two real buttons so dokter pakai 1-tap, bukan toggle yang bingung.
  // [Ya] highlight warning, [Tidak] highlight neutral. Default Tidak.
  return (
    <div
      role="radiogroup"
      aria-label={`Jawaban untuk ${itemId}`}
      className="inline-flex shrink-0 overflow-hidden rounded-md border border-border bg-background"
    >
      <button
        type="button"
        role="radio"
        aria-checked={isYes}
        onClick={() => {
          if (!isYes) onChange();
        }}
        className={`inline-flex h-9 min-w-[52px] items-center justify-center px-3 text-xs font-semibold transition-colors ${
          isYes
            ? "bg-warning text-warning-foreground"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        }`}
      >
        Ya
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={!isYes}
        onClick={() => {
          if (isYes) onChange();
        }}
        className={`inline-flex h-9 min-w-[60px] items-center justify-center border-l border-border px-3 text-xs font-semibold transition-colors ${
          !isYes
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        }`}
      >
        Tidak
      </button>
    </div>
  );
}

function EmergencyBanner({ trigger }: { trigger: EmergencyTrigger }) {
  const isRed = trigger.level === "red";
  return (
    <section
      role="alert"
      className={`rounded-lg border p-4 ${
        isRed
          ? "border-destructive bg-destructive text-destructive-foreground"
          : "border-warning bg-warning text-warning-foreground"
      }`}
    >
      <div className="flex items-start gap-3">
        <Siren className="mt-0.5 h-6 w-6 shrink-0 animate-pulse" aria-hidden />
        <div className="flex-1">
          <h3 className="text-base font-semibold">{trigger.title}</h3>
          <p className="mt-1 text-sm opacity-95">{trigger.message}</p>
        </div>
      </div>
    </section>
  );
}

function CdssCard({ suggestion }: { suggestion: CdssSuggestion }) {
  const style = LEVEL_STYLE[suggestion.level] ?? LEVEL_STYLE.info;
  const { Icon } = style;
  return (
    <li className={`rounded-lg border p-3 text-sm ${style.cls}`}>
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              {style.label}
            </span>
            <span className="font-mono text-[10px] opacity-70">{suggestion.ruleId}</span>
          </div>
          <p className="mt-1 leading-snug">{suggestion.message}</p>
          {suggestion.suggestPrimaryIcd10 ? (
            <p className="mt-1 text-[11px] opacity-80">
              → Saran primer:{" "}
              <span className="font-mono font-semibold">{suggestion.suggestPrimaryIcd10}</span>
            </p>
          ) : null}
          {suggestion.suggestTreatmentIds && suggestion.suggestTreatmentIds.length > 0 ? (
            <p className="mt-1 text-[11px] opacity-80">
              → Tx pre-check: {suggestion.suggestTreatmentIds.join(", ")}
            </p>
          ) : null}
          {suggestion.reference ? (
            <p className="mt-1 text-[11px] opacity-75">
              Ref: {suggestion.reference.label}
            </p>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function SoapCell({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-background p-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {body || <span className="italic text-muted-foreground">(kosong)</span>}
      </p>
    </div>
  );
}
