"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Check,
  CheckCircle2,
  Plus,
  Save,
  Scissors,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { searchIcd10, type Icd10Entry } from "@/lib/seeds/icd10-tht";
import { searchIcd9, formatFee, type Icd9Entry } from "@/lib/seeds/icd9-tindakan";
import { searchObat, type ObatEntry } from "@/lib/seeds/obat-tht";
import { suggestIcd10 } from "@/lib/autocoding";
import {
  saveVisit,
  signVisit,
  type SaveVisitPayload,
  type SaveVisitResult,
} from "../../actions";
import type {
  FullVisit,
  PrescriptionRow,
  VisitDiagnosisRow,
  VisitProcedureRow,
} from "@/lib/visits";

// ---------- Types ----------

type DxItem = {
  icd10Code: string;
  icd10NameId?: string | null;
  icd10NameEn?: string | null;
  diagnosisType: "primary" | "secondary" | "comorbid";
  isChronic: boolean;
};

type TxItem = {
  icd9Code: string;
  icd9NameId?: string | null;
  icd9NameEn?: string | null;
  isOperative: boolean;
  feeIdr: number;
  notes?: string | null;
};

type RxItem = {
  drugName: string;
  genericName?: string | null;
  drugForm?: ObatEntry["drugForm"] | null;
  strength?: string | null;
  dose?: string | null;
  frequency?: string | null;
  duration?: string | null;
  route?: ObatEntry["route"] | null;
  instructions?: string | null;
  quantity?: number | null;
  unit?: string | null;
};

// ---------- Helpers ----------

function fromDx(d: VisitDiagnosisRow): DxItem {
  return {
    icd10Code: d.icd10Code,
    icd10NameId: d.icd10NameId,
    icd10NameEn: d.icd10NameEn,
    diagnosisType: d.diagnosisType,
    isChronic: d.isChronic,
  };
}

function fromTx(t: VisitProcedureRow): TxItem {
  return {
    icd9Code: t.icd9Code,
    icd9NameId: t.icd9NameId,
    icd9NameEn: t.icd9NameEn,
    isOperative: t.isOperative,
    feeIdr: t.feeIdr,
    notes: t.notes,
  };
}

function fromRx(r: PrescriptionRow): RxItem {
  return {
    drugName: r.drugName,
    genericName: r.genericName,
    drugForm: r.drugForm,
    strength: r.strength,
    dose: r.dose,
    frequency: r.frequency,
    duration: r.duration,
    route: r.route,
    instructions: r.instructions,
    quantity: r.quantity,
    unit: r.unit,
  };
}

function num(s: string): number | null {
  if (!s.trim()) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function bmi(weightKg: string, heightCm: string): string | null {
  const w = num(weightKg);
  const h = num(heightCm);
  if (!w || !h) return null;
  const m = h / 100;
  if (m <= 0) return null;
  return (w / (m * m)).toFixed(1);
}

// ---------- Editor ----------

export function SoapEditor({
  patientId,
  visitId,
  initial,
  signed,
}: {
  patientId: string;
  visitId: string;
  initial: FullVisit;
  signed: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [chiefComplaint, setChiefComplaint] = useState(
    initial.visit.chiefComplaint ?? "",
  );
  const [paymentType, setPaymentType] = useState<"umum" | "bpjs" | "asuransi">(
    initial.visit.paymentType,
  );

  const [weightKg, setWeightKg] = useState(initial.visit.weightKg ?? "");
  const [heightCm, setHeightCm] = useState(initial.visit.heightCm ?? "");
  const [bloodPressure, setBloodPressure] = useState(
    initial.visit.bloodPressure ?? "",
  );
  const [heartRate, setHeartRate] = useState(
    initial.visit.heartRate?.toString() ?? "",
  );
  const [temperatureC, setTemperatureC] = useState(
    initial.visit.temperatureC ?? "",
  );
  const [spo2, setSpo2] = useState(initial.visit.spo2?.toString() ?? "");

  const computedBmi = useMemo(
    () => bmi(weightKg, heightCm),
    [weightKg, heightCm],
  );

  const [subjective, setSubjective] = useState(initial.soap?.subjective ?? "");
  const [historyPresent, setHistoryPresent] = useState(
    initial.soap?.historyPresent ?? "",
  );
  const [pastHistory, setPastHistory] = useState(
    initial.soap?.pastHistory ?? "",
  );
  const [objective, setObjective] = useState(initial.soap?.objective ?? "");
  const [assessment, setAssessment] = useState(initial.soap?.assessment ?? "");
  const [plan, setPlan] = useState(initial.soap?.plan ?? "");

  const [diagnoses, setDiagnoses] = useState<DxItem[]>(
    initial.diagnoses.map(fromDx),
  );
  const [procedures, setProcedures] = useState<TxItem[]>(
    initial.procedures.map(fromTx),
  );
  const [rx, setRx] = useState<RxItem[]>(initial.prescriptions.map(fromRx));

  // Auto-coding sumber teks: gabungkan keluhan + S + O + assessment.
  // Saran muncul kalau total panjang ≥10 char (hindari noise saat masih ngetik).
  const codingSource = `${chiefComplaint} ${subjective} ${historyPresent} ${objective} ${assessment}`;
  const codingSuggestions = useMemo(() => {
    if (codingSource.trim().length < 10) return [];
    const existing = new Set(diagnoses.map((d) => d.icd10Code));
    return suggestIcd10(codingSource, 8).filter(
      (s) => !existing.has(s.entry.code),
    );
  }, [codingSource, diagnoses]);

  function buildPayload(): SaveVisitPayload {
    return {
      chiefComplaint: chiefComplaint || null,
      weightKg: num(weightKg),
      heightCm: num(heightCm),
      bloodPressure: bloodPressure || null,
      heartRate: heartRate ? parseInt(heartRate, 10) : null,
      temperatureC: num(temperatureC),
      spo2: spo2 ? parseInt(spo2, 10) : null,
      paymentType,
      subjective: subjective || null,
      historyPresent: historyPresent || null,
      pastHistory: pastHistory || null,
      objective: objective || null,
      assessment: assessment || null,
      plan: plan || null,
      diagnoses,
      procedures,
      prescriptions: rx,
    };
  }

  function addDiagnosis(e: { code: string; nameId: string; nameEn: string }) {
    setDiagnoses((prev) => {
      if (prev.find((p) => p.icd10Code === e.code)) return prev;
      return [
        ...prev,
        {
          icd10Code: e.code,
          icd10NameId: e.nameId,
          icd10NameEn: e.nameEn,
          diagnosisType: prev.length === 0 ? "primary" : "secondary",
          isChronic: false,
        },
      ];
    });
  }

  function onSave() {
    setError(null);
    startTransition(async () => {
      const res: SaveVisitResult = await saveVisit(visitId, buildPayload());
      if (res.ok) {
        setSavedAt(new Date());
        router.refresh();
      } else {
        setError(res.message);
      }
    });
  }

  function onSign() {
    setError(null);
    startTransition(async () => {
      const res = await signVisit(visitId, patientId, buildPayload());
      // signVisit redirects on success; only handle error here
      if (!res.ok) setError(res.message);
    });
  }

  const disabled = signed || isPending;

  return (
    <div className="mt-8 space-y-6 pb-32">
      {/* ---------- Keluhan utama + pembayaran ---------- */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
          <Field label="Keluhan utama" hint="Singkat — kalimat pasien sendiri">
            <input
              type="text"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              disabled={disabled}
              placeholder="cth. Telinga kanan terasa penuh sejak 3 hari"
              className={inputCls}
            />
          </Field>
          <Field label="Pembayaran">
            <select
              value={paymentType}
              onChange={(e) =>
                setPaymentType(e.target.value as typeof paymentType)
              }
              disabled={disabled}
              className={inputCls}
            >
              <option value="umum">Umum</option>
              <option value="bpjs">BPJS</option>
              <option value="asuransi">Asuransi</option>
            </select>
          </Field>
        </div>
      </section>

      {/* ---------- Vital signs ---------- */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <SectionHeader icon={<Activity className="h-3.5 w-3.5" />}>
          Vital signs
        </SectionHeader>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <SmallField label="BB (kg)">
            <input
              inputMode="decimal"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              disabled={disabled}
              className={smallInputCls}
              placeholder="—"
            />
          </SmallField>
          <SmallField label="TB (cm)">
            <input
              inputMode="decimal"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              disabled={disabled}
              className={smallInputCls}
              placeholder="—"
            />
          </SmallField>
          <SmallField label="BMI">
            <div className="flex h-11 items-center rounded-lg border border-dashed border-border bg-muted/30 px-3 font-mono text-sm tabular-nums text-muted-foreground">
              {computedBmi ?? "—"}
            </div>
          </SmallField>
          <SmallField label="TD (mmHg)">
            <input
              value={bloodPressure}
              onChange={(e) => setBloodPressure(e.target.value)}
              disabled={disabled}
              className={smallInputCls}
              placeholder="120/80"
            />
          </SmallField>
          <SmallField label="Nadi (×/m)">
            <input
              inputMode="numeric"
              value={heartRate}
              onChange={(e) => setHeartRate(e.target.value)}
              disabled={disabled}
              className={smallInputCls}
              placeholder="—"
            />
          </SmallField>
          <SmallField label="Suhu (°C)">
            <input
              inputMode="decimal"
              value={temperatureC}
              onChange={(e) => setTemperatureC(e.target.value)}
              disabled={disabled}
              className={smallInputCls}
              placeholder="—"
            />
          </SmallField>
          <SmallField label="SpO₂ (%)">
            <input
              inputMode="numeric"
              value={spo2}
              onChange={(e) => setSpo2(e.target.value)}
              disabled={disabled}
              className={smallInputCls}
              placeholder="—"
            />
          </SmallField>
        </div>
      </section>

      {/* ---------- S / O ---------- */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <SectionHeader>S — Subjective</SectionHeader>
          <div className="mt-4 space-y-3">
            <TextareaField
              label="Anamnesa singkat"
              value={subjective}
              onChange={setSubjective}
              disabled={disabled}
              rows={3}
              placeholder="Onset, lokasi, durasi, kualitas, faktor pencetus…"
            />
            <TextareaField
              label="Riwayat penyakit sekarang"
              value={historyPresent}
              onChange={setHistoryPresent}
              disabled={disabled}
              rows={3}
              placeholder="Perjalanan keluhan, pengobatan sebelumnya…"
            />
            <TextareaField
              label="Riwayat dahulu / keluarga / sosial"
              value={pastHistory}
              onChange={setPastHistory}
              disabled={disabled}
              rows={2}
              placeholder="DM, hipertensi, alergi, paparan, kebiasaan…"
            />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <SectionHeader>O — Objective (status THT)</SectionHeader>
          <TextareaField
            label="Pemeriksaan fisik"
            value={objective}
            onChange={setObjective}
            disabled={disabled}
            rows={11}
            placeholder={
              "Telinga: AD … / AS …\nHidung: kavum nasi … / septum …\nTenggorok: tonsil T0/T0 tenang, faring …\nLeher: KGB tidak teraba\n"
            }
          />
        </section>
      </div>

      {/* ---------- A — Assessment + ICD-10 ---------- */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <SectionHeader>A — Assessment</SectionHeader>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
          <div>
            {codingSuggestions.length > 0 && !disabled ? (
              <div className="mb-3 rounded-lg border border-accent/30 bg-accent/5 p-3">
                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-accent">
                  <Sparkles className="h-3 w-3" />
                  Saran ICD-10 dari teks
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {codingSuggestions.map((s) => (
                    <button
                      key={s.entry.code}
                      type="button"
                      onClick={() => addDiagnosis(s.entry)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs transition-colors hover:border-accent hover:bg-accent/10"
                      title={`${s.entry.nameEn} · skor ${s.score}`}
                    >
                      <Plus className="h-3 w-3 text-accent" />
                      <span className="font-mono text-[10px] font-semibold text-accent">
                        {s.entry.code}
                      </span>
                      <span className="text-foreground/80">
                        {s.entry.nameId}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground/80">
                  Saran berdasar pencocokan kata di keluhan/anamnesa/PF/assessment.
                  Dokter tetap memutuskan akhir.
                </p>
              </div>
            ) : null}

            <Icd10PickerInline onAdd={addDiagnosis} disabled={disabled} />
            <DiagnosesList
              items={diagnoses}
              onChange={setDiagnoses}
              disabled={disabled}
            />
          </div>
          <TextareaField
            label="Catatan assessment"
            value={assessment}
            onChange={setAssessment}
            disabled={disabled}
            rows={6}
            placeholder="Diagnosa banding, alasan klinis, rencana investigasi…"
          />
        </div>
      </section>

      {/* ---------- T — Tindakan (ICD-9-CM) ---------- */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <SectionHeader icon={<Scissors className="h-3.5 w-3.5" />}>
          T — Tindakan (ICD-9-CM)
        </SectionHeader>
        <div className="mt-4 space-y-3">
          <Icd9PickerInline
            onAdd={(e) =>
              setProcedures((prev) => [
                ...prev,
                {
                  icd9Code: e.code,
                  icd9NameId: e.nameId,
                  icd9NameEn: e.nameEn,
                  isOperative: e.isOperative,
                  feeIdr: e.minFee,
                  notes: null,
                },
              ])
            }
            disabled={disabled}
          />
          <ProceduresList
            items={procedures}
            onChange={setProcedures}
            disabled={disabled}
          />
        </div>
      </section>

      {/* ---------- P — Plan + Resep ---------- */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <SectionHeader>P — Plan & resep</SectionHeader>
        <div className="mt-4 space-y-4">
          <TextareaField
            label="Rencana terapi & edukasi"
            value={plan}
            onChange={setPlan}
            disabled={disabled}
            rows={4}
            placeholder="Tindakan, edukasi pasien, kontrol kapan, rujukan…"
          />

          <div>
            <h3 className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Resep
            </h3>
            <ObatPickerInline
              onAdd={(o) =>
                setRx((prev) => [
                  ...prev,
                  {
                    drugName: o.drugName,
                    genericName: o.genericName,
                    drugForm: o.drugForm,
                    strength: o.strength,
                    dose: o.defaultDose,
                    frequency: o.defaultFrequency,
                    duration: o.defaultDuration,
                    route: o.route,
                    instructions: null,
                    quantity: null,
                    unit: null,
                  },
                ])
              }
              onAddBlank={() =>
                setRx((prev) => [
                  ...prev,
                  {
                    drugName: "",
                    drugForm: null,
                    strength: null,
                    dose: null,
                    frequency: null,
                    duration: null,
                    route: null,
                    instructions: null,
                    quantity: null,
                    unit: null,
                  },
                ])
              }
              disabled={disabled}
            />
            <RxList items={rx} onChange={setRx} disabled={disabled} />
          </div>
        </div>
      </section>

      {/* ---------- Sticky action bar ---------- */}
      {signed ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-6 py-3 backdrop-blur md:px-10">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Kunjungan sudah ditandatangani — read-only.
            </p>
            <a
              href={`/pasien/${patientId}/kunjungan/${visitId}`}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
            >
              Lihat kunjungan
            </a>
          </div>
        </div>
      ) : (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-6 py-3 backdrop-blur md:px-10">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 text-xs text-muted-foreground">
              {error ? (
                <span className="text-destructive">{error}</span>
              ) : savedAt ? (
                <span>
                  Tersimpan {savedAt.toLocaleTimeString("id-ID")} · belum
                  ditandatangani
                </span>
              ) : (
                <span>Draft — belum ditandatangani</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onSave}
                disabled={isPending}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isPending ? "Menyimpan…" : "Simpan draft"}
              </button>
              <button
                type="button"
                onClick={onSign}
                disabled={isPending}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Tanda tangan & selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Sub-components ----------

const inputCls =
  "h-11 w-full rounded-lg border border-border bg-background px-3 text-base outline-none transition-colors focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:bg-muted/40";

const smallInputCls =
  "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm font-mono tabular-nums outline-none transition-colors focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:bg-muted/40";

function SectionHeader({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <h2 className="flex items-center gap-1.5 font-display text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
      {icon}
      {children}
    </h2>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        <span>{label}</span>
        {hint ? (
          <span className="font-normal normal-case tracking-normal text-muted-foreground/70">
            {hint}
          </span>
        ) : null}
      </div>
      {children}
    </label>
  );
}

function SmallField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      {children}
    </label>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  disabled,
  rows,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={rows ?? 3}
        placeholder={placeholder}
        className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-base leading-relaxed outline-none transition-colors focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:bg-muted/40"
      />
    </Field>
  );
}

// ---------- ICD-10 picker ----------

function Icd10PickerInline({
  onAdd,
  disabled,
}: {
  onAdd: (e: Icd10Entry) => void;
  disabled?: boolean;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const results = useMemo(() => searchIcd10(q), [q]);

  return (
    <div className="relative">
      <Field label="Tambah diagnosa (ICD-10)">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            disabled={disabled}
            placeholder="Cari kode atau nama (mis. otitis, J35, vertigo)…"
            className={`${inputCls} pl-9`}
          />
        </div>
      </Field>
      {open && results.length > 0 ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
          {results.map((r) => (
            <button
              key={r.code}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onAdd(r);
                setQ("");
              }}
              className="flex w-full items-baseline gap-3 border-b border-border/40 px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-muted"
            >
              <span className="font-mono text-xs font-semibold text-primary">
                {r.code}
              </span>
              <span className="flex-1 text-sm">{r.nameId}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {r.group}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DiagnosesList({
  items,
  onChange,
  disabled,
}: {
  items: DxItem[];
  onChange: (next: DxItem[]) => void;
  disabled?: boolean;
}) {
  if (items.length === 0) {
    return (
      <p className="mt-3 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-3 text-xs text-muted-foreground">
        Belum ada diagnosa. Tambahkan minimal 1 sebelum tanda tangan.
      </p>
    );
  }
  return (
    <ul className="mt-3 space-y-2">
      {items.map((d, i) => (
        <li
          key={`${d.icd10Code}-${i}`}
          className="flex items-start gap-2 rounded-lg border border-border bg-background px-3 py-2"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-xs font-semibold text-primary">
                {d.icd10Code}
              </span>
              <span className="text-sm">{d.icd10NameId}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
              <select
                value={d.diagnosisType}
                onChange={(e) =>
                  onChange(
                    items.map((it, idx) =>
                      idx === i
                        ? {
                            ...it,
                            diagnosisType: e.target
                              .value as DxItem["diagnosisType"],
                          }
                        : it,
                    ),
                  )
                }
                disabled={disabled}
                className="h-7 rounded-md border border-border bg-background px-1.5 text-[11px]"
              >
                <option value="primary">Primer</option>
                <option value="secondary">Sekunder</option>
                <option value="comorbid">Komorbid</option>
              </select>
              <label className="inline-flex items-center gap-1.5 text-muted-foreground">
                <input
                  type="checkbox"
                  checked={d.isChronic}
                  onChange={(e) =>
                    onChange(
                      items.map((it, idx) =>
                        idx === i
                          ? { ...it, isChronic: e.target.checked }
                          : it,
                      ),
                    )
                  }
                  disabled={disabled}
                  className="h-3.5 w-3.5 accent-primary"
                />
                Kronik
              </label>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            disabled={disabled}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label="Hapus diagnosa"
          >
            <X className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}

// ---------- ICD-9 procedure picker ----------

function Icd9PickerInline({
  onAdd,
  disabled,
}: {
  onAdd: (e: Icd9Entry) => void;
  disabled?: boolean;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const results = useMemo(() => searchIcd9(q), [q]);

  return (
    <div className="relative">
      <Field label="Tambah tindakan (ICD-9-CM)">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            disabled={disabled}
            placeholder="Cari tindakan (mis. serumen, tampon, miringotomi, fess)…"
            className={`${inputCls} pl-9`}
          />
        </div>
      </Field>
      {open && results.length > 0 ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-80 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
          {results.map((r, i) => (
            <button
              key={`${r.code}-${r.nameId}-${i}`}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onAdd(r);
                setQ("");
              }}
              className="flex w-full items-baseline gap-3 border-b border-border/40 px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-muted"
            >
              <span className="font-mono text-xs font-semibold text-primary">
                {r.code}
              </span>
              <span className="flex-1 text-sm">{r.nameId}</span>
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                  r.isOperative
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {r.isOperative ? "Op" : "Non-op"}
              </span>
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                {formatFee(r)}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ProceduresList({
  items,
  onChange,
  disabled,
}: {
  items: TxItem[];
  onChange: (next: TxItem[]) => void;
  disabled?: boolean;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-3 text-xs text-muted-foreground">
        Belum ada tindakan. Tambahkan kalau ada prosedur (mis. ekstraksi serumen,
        irigasi sinus, polipektomi).
      </p>
    );
  }
  function update(i: number, patch: Partial<TxItem>) {
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  const total = items.reduce((s, it) => s + (it.feeIdr || 0), 0);
  return (
    <>
      <ul className="space-y-2">
        {items.map((t, i) => (
          <li
            key={`${t.icd9Code}-${i}`}
            className="rounded-lg border border-border bg-background p-3"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-mono text-xs font-semibold text-primary">
                  {t.icd9Code}
                </span>
                <span className="text-sm">{t.icd9NameId}</span>
                {t.isOperative ? (
                  <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                    Operatif
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                disabled={disabled}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Hapus
              </button>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[140px_1fr]">
              <SmallField label="Tarif (IDR)">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    Rp
                  </span>
                  <input
                    inputMode="numeric"
                    value={t.feeIdr.toString()}
                    onChange={(e) =>
                      update(i, {
                        feeIdr: parseInt(e.target.value || "0", 10) || 0,
                      })
                    }
                    disabled={disabled}
                    className={`${smallInputCls} pl-8`}
                  />
                </div>
              </SmallField>
              <SmallField label="Catatan tindakan">
                <input
                  value={t.notes ?? ""}
                  onChange={(e) => update(i, { notes: e.target.value })}
                  disabled={disabled}
                  className={smallInputCls}
                  placeholder="cth. AD, AS · sisi · komplikasi · keterangan klaim"
                />
              </SmallField>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-baseline justify-end gap-2 text-xs text-muted-foreground">
        <span>Total tarif tindakan:</span>
        <span className="font-mono tabular-nums text-foreground">
          Rp {total.toLocaleString("id-ID")}
        </span>
      </div>
    </>
  );
}

// ---------- Obat picker ----------

function ObatPickerInline({
  onAdd,
  onAddBlank,
  disabled,
}: {
  onAdd: (o: ObatEntry) => void;
  onAddBlank: () => void;
  disabled?: boolean;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const results = useMemo(() => searchObat(q), [q]);

  return (
    <div className="relative">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1">
          <Field label="Tambah obat">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                disabled={disabled}
                placeholder="Cari obat (mis. amoks, betahistine, mometason)…"
                className={`${inputCls} pl-9`}
              />
            </div>
          </Field>
        </div>
        <button
          type="button"
          onClick={onAddBlank}
          disabled={disabled}
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          Manual
        </button>
      </div>
      {open && results.length > 0 ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
          {results.map((o) => (
            <button
              key={`${o.drugName}-${o.strength}`}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onAdd(o);
                setQ("");
              }}
              className="flex w-full items-baseline gap-3 border-b border-border/40 px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-muted"
            >
              <span className="text-sm font-medium">{o.drugName}</span>
              <span className="text-xs text-muted-foreground">
                {o.strength}
              </span>
              <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">
                {o.category}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RxList({
  items,
  onChange,
  disabled,
}: {
  items: RxItem[];
  onChange: (next: RxItem[]) => void;
  disabled?: boolean;
}) {
  if (items.length === 0) {
    return (
      <p className="mt-3 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-3 text-xs text-muted-foreground">
        Belum ada obat. Pilih dari daftar atau tambah manual.
      </p>
    );
  }
  function update(i: number, patch: Partial<RxItem>) {
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  return (
    <ul className="mt-3 space-y-2">
      {items.map((r, i) => (
        <li
          key={i}
          className="rounded-lg border border-border bg-background p-3"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              R/ {i + 1}
            </span>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              disabled={disabled}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Hapus
            </button>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-6">
            <div className="lg:col-span-3">
              <SmallField label="Nama obat">
                <input
                  value={r.drugName}
                  onChange={(e) => update(i, { drugName: e.target.value })}
                  disabled={disabled}
                  className={smallInputCls}
                  placeholder="cth. Amoksisilin"
                />
              </SmallField>
            </div>
            <SmallField label="Sediaan">
              <input
                value={r.strength ?? ""}
                onChange={(e) => update(i, { strength: e.target.value })}
                disabled={disabled}
                className={smallInputCls}
                placeholder="500 mg"
              />
            </SmallField>
            <SmallField label="Bentuk">
              <select
                value={r.drugForm ?? ""}
                onChange={(e) =>
                  update(i, {
                    drugForm: (e.target.value || null) as RxItem["drugForm"],
                  })
                }
                disabled={disabled}
                className={smallInputCls}
              >
                <option value="">—</option>
                <option value="tablet">Tablet</option>
                <option value="kapsul">Kapsul</option>
                <option value="sirup">Sirup</option>
                <option value="tetes">Tetes</option>
                <option value="spray">Spray</option>
                <option value="salep">Salep</option>
                <option value="injeksi">Injeksi</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </SmallField>
            <SmallField label="Rute">
              <select
                value={r.route ?? ""}
                onChange={(e) =>
                  update(i, {
                    route: (e.target.value || null) as RxItem["route"],
                  })
                }
                disabled={disabled}
                className={smallInputCls}
              >
                <option value="">—</option>
                <option value="oral">Oral</option>
                <option value="topical">Topikal</option>
                <option value="inhalasi">Inhalasi</option>
                <option value="tetes">Tetes</option>
                <option value="injeksi">Injeksi</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </SmallField>
            <SmallField label="Dosis sekali">
              <input
                value={r.dose ?? ""}
                onChange={(e) => update(i, { dose: e.target.value })}
                disabled={disabled}
                className={smallInputCls}
                placeholder="1 tablet"
              />
            </SmallField>
            <SmallField label="Frekuensi">
              <input
                value={r.frequency ?? ""}
                onChange={(e) => update(i, { frequency: e.target.value })}
                disabled={disabled}
                className={smallInputCls}
                placeholder="3x sehari"
              />
            </SmallField>
            <SmallField label="Durasi">
              <input
                value={r.duration ?? ""}
                onChange={(e) => update(i, { duration: e.target.value })}
                disabled={disabled}
                className={smallInputCls}
                placeholder="5 hari"
              />
            </SmallField>
            <SmallField label="Jumlah">
              <input
                inputMode="numeric"
                value={r.quantity?.toString() ?? ""}
                onChange={(e) =>
                  update(i, {
                    quantity: e.target.value ? parseInt(e.target.value, 10) : null,
                  })
                }
                disabled={disabled}
                className={smallInputCls}
                placeholder="—"
              />
            </SmallField>
            <SmallField label="Satuan">
              <input
                value={r.unit ?? ""}
                onChange={(e) => update(i, { unit: e.target.value })}
                disabled={disabled}
                className={smallInputCls}
                placeholder="tablet"
              />
            </SmallField>
            <div className="sm:col-span-2 lg:col-span-3">
              <SmallField label="Aturan / catatan">
                <input
                  value={r.instructions ?? ""}
                  onChange={(e) => update(i, { instructions: e.target.value })}
                  disabled={disabled}
                  className={smallInputCls}
                  placeholder="setelah makan · habiskan"
                />
              </SmallField>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
