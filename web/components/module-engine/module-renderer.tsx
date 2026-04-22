"use client";

/**
 * Generic Clinical Thinking Engine renderer.
 *
 * Renders any ModuleSpec across the standard 10 sections in a single tablet
 * viewport (1024×768). All taps recompute scoring + CDSS + SOAP locally so
 * the doctor sees consequences before tapping "Apply ke kunjungan".
 */

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  Info,
  Pill,
  Save,
  Scissors,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import {
  emptyContext,
  type CdssSuggestion,
  type ModuleContext,
  type ModuleSpec,
  type ScoringInstrument,
  type ScoringResult,
} from "@/lib/modules/types";
import {
  activeEmergency,
  billingTotal,
  buildSnapshot,
  composeSoap,
  evaluateCdss,
  recomputeScoring,
  severityTone,
} from "@/lib/modules/engine";
import { applyModuleSnapshot } from "@/app/pasien/[id]/kunjungan/[visitId]/modul/[moduleId]/apply-actions";

type Props = {
  spec: ModuleSpec;
  visitId: string;
  patientId: string;
  chiefComplaint: string;
};

function fmtIdr(v: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v);
}

export function ModuleRenderer({
  spec,
  visitId,
  patientId,
  chiefComplaint,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [ctx, setCtx] = useState<ModuleContext>(() =>
    emptyContext(spec, chiefComplaint),
  );
  const [openScoring, setOpenScoring] = useState<Record<string, boolean>>({});

  // Live derived values
  const cdss = useMemo<CdssSuggestion[]>(() => evaluateCdss(spec, ctx), [spec, ctx]);
  const emergency = useMemo(() => activeEmergency(spec, ctx), [spec, ctx]);
  const soap = useMemo(() => composeSoap(spec, ctx), [spec, ctx]);
  const total = useMemo(() => billingTotal(spec, ctx), [spec, ctx]);

  function toggleAnamnesis(id: string) {
    setCtx((c) => ({
      ...c,
      anamnesis: { ...c.anamnesis, [id]: !c.anamnesis[id] },
    }));
  }
  function toggleExam(id: string) {
    setCtx((c) => ({
      ...c,
      examination: { ...c.examination, [id]: !c.examination[id] },
    }));
  }
  function toggleTreatment(id: string) {
    setCtx((c) => ({
      ...c,
      treatments: { ...c.treatments, [id]: !c.treatments[id] },
    }));
  }
  function setScoringValue(scoringId: string, inputId: string, value: number) {
    setCtx((c) => {
      const cur = c.scoring[scoringId];
      const values = { ...cur.values, [inputId]: value };
      const next: ModuleContext = {
        ...c,
        scoring: { ...c.scoring, [scoringId]: { values, result: cur.result } },
      };
      return recomputeScoring(spec, next);
    });
  }
  function toggleDxPrimary(icd10Code: string) {
    setCtx((c) => {
      const exists = c.diagnoses.find((d) => d.icd10Code === icd10Code);
      const meta = spec.diagnoses.find((d) => d.icd10Code === icd10Code);
      if (exists) {
        return {
          ...c,
          diagnoses: c.diagnoses
            .filter((d) => d.icd10Code !== icd10Code),
        };
      }
      return {
        ...c,
        diagnoses: [
          ...c.diagnoses.map((d) => ({ ...d, primary: false })),
          {
            icd10Code,
            primary: true,
            isChronic: !!meta?.isChronic,
          },
        ],
      };
    });
  }

  function applyToVisit() {
    setError(null);
    const snapshot = buildSnapshot(spec, ctx);
    startTransition(async () => {
      const res = await applyModuleSnapshot(visitId, patientId, snapshot);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      router.push(`/pasien/${patientId}/kunjungan/${visitId}/edit`);
    });
  }

  const primaryDx = ctx.diagnoses.find((d) => d.primary);

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      {/* Header strip */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 bg-card/50 px-4 py-3 md:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() =>
              router.push(`/pasien/${patientId}/kunjungan/${visitId}/edit`)
            }
            className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {spec.subspecialty} · Modul Klinis
            </p>
            <h1 className="font-display text-xl font-medium leading-tight md:text-2xl break-words">
              {spec.title}
            </h1>
          </div>
        </div>
        <div className="hidden md:flex shrink-0 items-center gap-2">
          {spec.tags?.map((t) => (
            <span
              key={t}
              className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Emergency banner */}
      {emergency ? <EmergencyBanner em={emergency} /> : null}

      {/* CDSS suggestions banner */}
      {cdss.length > 0 ? (
        <div className="border-b border-border/60 bg-muted/40 px-4 py-3 md:px-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-2">
            {cdss.map((s) => (
              <SuggestionBanner key={s.ruleId} s={s} />
            ))}
          </div>
        </div>
      ) : null}

      {/* Body — 2-col tablet, single col on small */}
      <main className="flex-1 overflow-y-auto px-4 py-5 md:px-6">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 lg:grid-cols-2">
          {/* LEFT col: Diagnosis · Anamnesis · Examination */}
          <div className="space-y-4">
            <SectionCard
              icon={ShieldCheck}
              title="Diagnosis (CDSS)"
              hint="Tap untuk memilih primary"
            >
              <div className="space-y-1.5">
                {spec.diagnoses.map((d) => {
                  const sel = ctx.diagnoses.find(
                    (x) => x.icd10Code === d.icd10Code,
                  );
                  const isPrimary = !!sel?.primary;
                  return (
                    <button
                      key={d.icd10Code}
                      onClick={() => toggleDxPrimary(d.icd10Code)}
                      className={`flex w-full items-start gap-3 rounded-md border px-3 py-2.5 text-left transition ${
                        isPrimary
                          ? "border-primary/60 bg-primary/5"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <span
                        className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                          isPrimary
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border"
                        }`}
                      >
                        {isPrimary ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-tight">
                          <span className="font-mono text-xs text-muted-foreground mr-2">
                            {d.icd10Code}
                          </span>
                          {d.display}
                        </p>
                        {d.reasoning ? (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {d.reasoning}
                          </p>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            <TapSectionCard
              icon={ClipboardList}
              section={spec.anamnesis}
              values={ctx.anamnesis}
              onToggle={toggleAnamnesis}
            />

            <TapSectionCard
              icon={Stethoscope}
              section={spec.examination}
              values={ctx.examination}
              onToggle={toggleExam}
            />
          </div>

          {/* RIGHT col: Scoring · Pathway · Treatments · Education · SOAP preview */}
          <div className="space-y-4">
            {(spec.scoring ?? []).length > 0 ? (
              <SectionCard
                icon={Calculator}
                title="Risk scoring"
                hint="Teaching mode — buka untuk lihat input"
              >
                <div className="space-y-2">
                  {spec.scoring!.map((s) => (
                    <ScoringCard
                      key={s.id}
                      instrument={s}
                      result={ctx.scoring[s.id]?.result}
                      values={ctx.scoring[s.id]?.values ?? {}}
                      open={!!openScoring[s.id]}
                      onOpenChange={(o) =>
                        setOpenScoring((p) => ({ ...p, [s.id]: o }))
                      }
                      onChange={(inputId, v) => setScoringValue(s.id, inputId, v)}
                    />
                  ))}
                </div>
              </SectionCard>
            ) : null}

            {(spec.pathway ?? []).length > 0 ? (
              <SectionCard icon={ChevronRight} title="Clinical pathway">
                <ol className="space-y-1.5 text-sm">
                  {spec.pathway!.map((p, i) => (
                    <li key={p.id} className="flex items-start gap-2.5">
                      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-[11px] font-mono">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium leading-tight">{p.title}</p>
                        {p.detail ? (
                          <p className="text-xs text-muted-foreground">
                            {p.detail}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </SectionCard>
            ) : null}

            <SectionCard
              icon={Pill}
              title="Tindakan & terapi"
              hint="Tap untuk pilih · ICD-9 + tarif otomatis"
            >
              <div className="space-y-1.5">
                {spec.treatments.map((t) => {
                  const sel = !!ctx.treatments[t.id];
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggleTreatment(t.id)}
                      className={`flex w-full items-start gap-3 rounded-md border px-3 py-2.5 text-left transition ${
                        sel
                          ? "border-accent bg-accent/5"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <span
                        className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                          sel
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-border"
                        }`}
                      >
                        {sel ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-tight">
                          {t.label}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                          <CategoryChip category={t.category} />
                          {t.icd9Code ? (
                            <span className="font-mono">ICD-9: {t.icd9Code}</span>
                          ) : null}
                          {t.feeIdr ? <span>{fmtIdr(t.feeIdr)}</span> : null}
                          {t.prescription ? (
                            <span>
                              {t.prescription.dose}
                              {t.prescription.frequency
                                ? ` · ${t.prescription.frequency}`
                                : ""}
                              {t.prescription.duration
                                ? ` · ${t.prescription.duration}`
                                : ""}
                            </span>
                          ) : null}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {total > 0 ? (
                <div className="mt-3 flex items-center justify-between rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">
                    Total estimasi tindakan
                  </span>
                  <span className="font-semibold">{fmtIdr(total)}</span>
                </div>
              ) : null}
            </SectionCard>

            <SectionCard icon={BookOpen} title="Edukasi pasien">
              <p className="text-sm font-medium">{spec.education.title}</p>
              <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {spec.education.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard icon={Sparkles} title="Auto SOAP (preview)">
              <SoapBlock label="S" text={soap.S} />
              <SoapBlock label="O" text={soap.O} />
              <SoapBlock label="A" text={soap.A} />
              <SoapBlock label="P" text={soap.P} />
            </SectionCard>
          </div>
        </div>
      </main>

      {/* Sticky bottom bar */}
      <div className="sticky bottom-0 z-10 shrink-0 border-t border-border/60 bg-card/95 px-4 py-3 md:px-6 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {primaryDx ? (
              <>
                Primary:{" "}
                <span className="font-mono text-foreground">
                  {primaryDx.icd10Code}
                </span>
              </>
            ) : (
              "Belum pilih diagnosis primary"
            )}
            {total > 0 ? (
              <span className="ml-3">
                · Tarif {fmtIdr(total)}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {error ? (
              <span className="text-xs text-destructive">{error}</span>
            ) : null}
            <button
              onClick={applyToVisit}
              disabled={pending || !primaryDx}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition hover:shadow-md disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {pending ? "Menyimpan…" : "Apply ke kunjungan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Subcomponents
// ============================================================================

function SectionCard({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border/60 bg-card p-4">
      <header className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </h2>
        {hint ? (
          <p className="text-[11px] text-muted-foreground">{hint}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function TapSectionCard({
  icon,
  section,
  values,
  onToggle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  section: ModuleSpec["anamnesis"];
  values: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  return (
    <SectionCard
      icon={icon}
      title={section.title}
      hint={section.helper ?? "Default normal · tap = abnormal"}
    >
      <ul className="space-y-1">
        {section.items.map((it) => {
          const abnormal = !!values[it.id];
          return (
            <li key={it.id}>
              <button
                onClick={() => onToggle(it.id)}
                className={`flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm transition ${
                  abnormal
                    ? "border-destructive/60 bg-destructive/5"
                    : "border-border hover:bg-muted"
                }`}
              >
                <span className="leading-tight">
                  {abnormal ? it.abnormalLabel : it.normalLabel}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    abnormal
                      ? "bg-destructive/15 text-destructive"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {abnormal ? "Abnormal" : "Normal"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}

function ScoringCard({
  instrument,
  result,
  values,
  open,
  onOpenChange,
  onChange,
}: {
  instrument: ScoringInstrument;
  result?: ScoringResult;
  values: Record<string, number>;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onChange: (inputId: string, value: number) => void;
}) {
  const tone = result ? severityTone(result.severity) : null;
  return (
    <div className="rounded-md border border-border/60">
      <button
        onClick={() => onOpenChange(!open)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
      >
        <div className="min-w-0">
          <p className="text-sm font-medium leading-tight">{instrument.name}</p>
          {result ? (
            <p className="text-xs text-muted-foreground">
              Skor {result.total} · {result.interpretation}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {tone ? (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                tone.tone === "danger"
                  ? "bg-destructive/15 text-destructive"
                  : tone.tone === "warn"
                    ? "bg-warning/15 text-warning"
                    : tone.tone === "info"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
              }`}
            >
              {tone.label}
            </span>
          ) : null}
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>
      {open ? (
        <div className="space-y-2 border-t border-border/60 px-3 py-3">
          {instrument.description ? (
            <p className="text-xs text-muted-foreground">
              {instrument.description}
            </p>
          ) : null}
          {instrument.inputs.map((inp) => {
            const v = values[inp.id] ?? 0;
            if (inp.type === "yesNo") {
              return (
                <div
                  key={inp.id}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-sm">{inp.label}</span>
                  <div className="flex gap-1.5">
                    {[
                      { v: 0, label: "Tidak" },
                      { v: 1, label: "Ya" },
                    ].map((opt) => (
                      <button
                        key={opt.v}
                        onClick={() => onChange(inp.id, opt.v)}
                        className={`h-9 rounded-md border px-3 text-xs font-medium transition ${
                          v === opt.v
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }
            if (inp.type === "select") {
              return (
                <div key={inp.id}>
                  <p className="mb-1 text-sm">{inp.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {inp.options.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => onChange(inp.id, opt.value)}
                        className={`h-9 rounded-md border px-3 text-xs font-medium transition ${
                          v === opt.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }
            // scale
            return (
              <div key={inp.id}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm">{inp.label}</span>
                  <span className="font-mono text-sm">{v}</span>
                </div>
                <input
                  type="range"
                  min={inp.min}
                  max={inp.max}
                  step={inp.step ?? 1}
                  value={v}
                  onChange={(e) =>
                    onChange(inp.id, parseInt(e.target.value, 10))
                  }
                  className="w-full"
                />
              </div>
            );
          })}
          {result?.recommendation ? (
            <p className="rounded-md border border-border/40 bg-muted/30 px-2.5 py-2 text-xs text-muted-foreground">
              {result.recommendation}
            </p>
          ) : null}
          {instrument.reference ? (
            <a
              href={instrument.reference.url ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              {instrument.reference.label}
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function SoapBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="mb-2 last:mb-0">
      <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded bg-muted text-[11px] font-mono font-semibold">
        {label}
      </span>
      <span className="text-sm text-muted-foreground">{text || "—"}</span>
    </div>
  );
}

function CategoryChip({
  category,
}: {
  category: "medikamentosa" | "tindakan" | "edukasi" | "rujukan";
}) {
  const map: Record<typeof category, { label: string; cls: string; Icon: React.ComponentType<{ className?: string }> }> = {
    medikamentosa: {
      label: "Medikamentosa",
      cls: "bg-info/10 text-info",
      Icon: Pill,
    },
    tindakan: {
      label: "Tindakan",
      cls: "bg-warning/10 text-warning",
      Icon: Scissors,
    },
    edukasi: {
      label: "Edukasi",
      cls: "bg-success/10 text-success",
      Icon: BookOpen,
    },
    rujukan: {
      label: "Rujukan",
      cls: "bg-accent/15 text-accent",
      Icon: ExternalLink,
    },
  };
  const m = map[category];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${m.cls}`}
    >
      <m.Icon className="h-3 w-3" />
      {m.label}
    </span>
  );
}

function EmergencyBanner({
  em,
}: {
  em: NonNullable<ReturnType<typeof activeEmergency>>;
}) {
  const Icon = em.level === "red" ? AlertOctagon : AlertTriangle;
  const cls =
    em.level === "red"
      ? "bg-destructive text-destructive-foreground"
      : "bg-warning text-warning-foreground";
  return (
    <div className={`shrink-0 px-4 py-3 md:px-6 ${cls}`}>
      <div className="mx-auto flex max-w-6xl items-start gap-3">
        <Icon className="mt-0.5 h-6 w-6 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-bold uppercase tracking-wider">{em.title}</p>
          <p className="text-sm leading-tight">{em.message}</p>
        </div>
      </div>
    </div>
  );
}

function SuggestionBanner({ s }: { s: CdssSuggestion }) {
  const map: Record<
    CdssSuggestion["level"],
    { Icon: React.ComponentType<{ className?: string }>; cls: string }
  > = {
    info: { Icon: Info, cls: "border-primary/40 bg-primary/5 text-primary" },
    success: {
      Icon: CheckCircle2,
      cls: "border-success/40 bg-success/5 text-success",
    },
    warn: {
      Icon: AlertTriangle,
      cls: "border-warning/40 bg-warning/5 text-warning",
    },
    danger: {
      Icon: AlertOctagon,
      cls: "border-destructive/40 bg-destructive/5 text-destructive",
    },
    emergency: {
      Icon: AlertOctagon,
      cls: "border-destructive bg-destructive/10 text-destructive",
    },
  };
  const m = map[s.level];
  return (
    <div
      className={`flex items-start gap-2 rounded-md border px-3 py-2 ${m.cls}`}
    >
      <m.Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="leading-tight">{s.message}</p>
        {s.reference ? (
          <a
            href={s.reference.url ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 inline-flex items-center gap-1 text-xs underline-offset-2 hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            {s.reference.label}
          </a>
        ) : null}
      </div>
    </div>
  );
}
