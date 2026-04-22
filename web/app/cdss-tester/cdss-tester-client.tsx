"use client";

import { useMemo, useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Info,
  RotateCcw,
  Siren,
  Sparkles,
} from "lucide-react";
import {
  emptyContext,
  type CdssSuggestion,
  type EmergencyTrigger,
  type ModuleContext,
  type ModuleSpec,
  type TapItem,
} from "@/lib/modules/types";

type Props = {
  specs: ModuleSpec[];
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

function pickInitialId(specs: ModuleSpec[]): string {
  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    const fromUrl = url.searchParams.get("module");
    if (fromUrl && specs.some((s) => s.id === fromUrl)) return fromUrl;
  }
  return specs[0]?.id ?? "";
}

export function CdssTesterClient({ specs }: Props) {
  const [moduleId, setModuleId] = useState<string>(() => specs[0]?.id ?? "");
  const [ctxByModule, setCtxByModule] = useState<Record<string, ModuleContext>>({});

  // Sync module selection to URL query (for deep links from ICD browsers).
  useEffect(() => {
    const initial = pickInitialId(specs);
    if (initial) setModuleId(initial);
  }, [specs]);

  const spec = useMemo(() => specs.find((s) => s.id === moduleId) ?? null, [specs, moduleId]);

  const ctx: ModuleContext = useMemo(() => {
    if (!spec) return emptyContext({} as ModuleSpec);
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
    if (!spec) return [];
    const out: CdssSuggestion[] = [];
    for (const rule of spec.cdssRules ?? []) {
      try {
        const s = rule.evaluate(ctx);
        if (s) out.push(s);
      } catch {
        // Silently skip broken rules in the tester sandbox.
      }
    }
    return out;
  }, [spec, ctx]);

  const activeEmergency = useMemo<EmergencyTrigger | null>(() => {
    if (!spec) return null;
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
    if (!spec) return null;
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

  if (!spec) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center">
        <p className="text-sm font-medium text-foreground">Belum ada modul terdaftar</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Daftarkan modul di <code className="rounded bg-muted px-1">web/lib/modules/registry.ts</code>.
        </p>
      </div>
    );
  }

  const anamnesisAbnormal = spec.anamnesis.items.filter((i) => ctx.anamnesis[i.id]).length;
  const examAbnormal = spec.examination.items.filter((i) => ctx.examination[i.id]).length;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-4">
        {/* Module picker */}
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
              {specs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} &mdash; {s.subspecialty}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={resetAll}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Reset
            </button>
          </div>
          {spec.tags && spec.tags.length > 0 ? (
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

        {/* Emergency banner */}
        {activeEmergency ? (
          <EmergencyBanner trigger={activeEmergency} />
        ) : null}

        {/* Anamnesis tap */}
        <TapSection
          title={spec.anamnesis.title}
          helper={spec.anamnesis.helper}
          items={spec.anamnesis.items}
          values={ctx.anamnesis}
          onToggle={toggleAnamnesis}
          summaryCount={anamnesisAbnormal}
          totalCount={spec.anamnesis.items.length}
        />

        {/* Examination tap */}
        <TapSection
          title={spec.examination.title}
          helper={spec.examination.helper}
          items={spec.examination.items}
          values={ctx.examination}
          onToggle={toggleExam}
          summaryCount={examAbnormal}
          totalCount={spec.examination.items.length}
        />

        {/* SOAP preview */}
        {soap ? (
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden />
              Auto-Compose SOAP
            </h2>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <SoapCell label="S — Subjective" body={soap.S} />
              <SoapCell label="O — Objective" body={soap.O} />
              <SoapCell label="A — Assessment" body={soap.A} />
              <SoapCell label="P — Plan" body={soap.P} />
            </div>
          </section>
        ) : null}
      </div>

      {/* Right rail — CDSS output */}
      <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start">
        <section className="rounded-lg border border-border bg-card p-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
            CDSS Output
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {suggestions.length > 0
              ? `${suggestions.length} saran aktif dari ${spec.cdssRules?.length ?? 0} rule.`
              : `Tidak ada saran aktif. ${spec.cdssRules?.length ?? 0} rule ter-evaluasi.`}
          </p>
        </section>

        {suggestions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center text-xs text-muted-foreground">
            <p>Tap anamnesis atau pemeriksaan di kiri untuk melihat CDSS menyala.</p>
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
          {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
        </div>
        <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {summaryCount}/{totalCount} abnormal
        </span>
      </header>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {items.map((it) => {
          const abnormal = !!values[it.id];
          return (
            <li key={it.id}>
              <button
                type="button"
                onClick={() => onToggle(it.id)}
                aria-pressed={abnormal}
                className={`flex min-h-[44px] w-full items-start gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                  abnormal
                    ? "border-warning/40 bg-warning/10 text-warning"
                    : "border-border bg-background text-foreground hover:bg-muted/60"
                }`}
              >
                <span
                  className={`mt-0.5 inline-block h-3 w-3 shrink-0 rounded-full border ${
                    abnormal ? "border-warning bg-warning" : "border-border bg-background"
                  }`}
                  aria-hidden
                />
                <span className="flex-1">{abnormal ? it.abnormalLabel : it.normalLabel}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
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
