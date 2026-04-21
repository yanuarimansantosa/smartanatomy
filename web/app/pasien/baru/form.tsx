"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createPatient, type CreatePatientState } from "../actions";

const initial: CreatePatientState = { ok: false };

export function PasienBaruForm() {
  const [state, formAction] = useActionState(createPatient, initial);

  return (
    <form action={formAction} className="space-y-6">
      {state.message && !state.ok ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {state.message}
        </div>
      ) : null}

      <Section title="Identitas">
        <Field
          label="Nama lengkap"
          name="nama"
          required
          autoFocus
          placeholder="cth. Budi Santoso"
          error={state.fieldErrors?.nama}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Tanggal lahir"
            name="tglLahir"
            type="date"
            required
            error={state.fieldErrors?.tglLahir}
          />
          <FieldRadio
            label="Jenis kelamin"
            name="jk"
            required
            options={[
              { value: "L", label: "Laki-laki" },
              { value: "P", label: "Perempuan" },
            ]}
            error={state.fieldErrors?.jk}
          />
        </div>
        <Field
          label="NIK (opsional)"
          name="nik"
          placeholder="16 digit angka — kosongkan kalau anak/bayi"
          maxLength={16}
          inputMode="numeric"
          pattern="\d{16}"
          error={state.fieldErrors?.nik}
        />
      </Section>

      <Section title="Kontak">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Telepon"
            name="telepon"
            type="tel"
            placeholder="cth. 081234567890"
            error={state.fieldErrors?.telepon}
          />
          <Field
            label="Email"
            name="email"
            type="email"
            placeholder="opsional"
            error={state.fieldErrors?.email}
          />
        </div>
        <FieldArea
          label="Alamat"
          name="alamat"
          rows={2}
          placeholder="Jalan, kelurahan, kota"
          error={state.fieldErrors?.alamat}
        />
      </Section>

      <Section title="Catatan klinis">
        <FieldArea
          label="Catatan awal"
          name="catatan"
          rows={4}
          placeholder="Riwayat singkat, alergi diketahui, alasan rujukan…"
          error={state.fieldErrors?.catatan}
        />
      </Section>

      <div className="sticky bottom-0 -mx-4 flex flex-col gap-3 border-t bg-background/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:flex-row sm:items-center sm:justify-end sm:bg-transparent sm:px-0 sm:backdrop-blur-none">
        <a
          href="/pasien"
          className="inline-flex h-12 items-center justify-center rounded-xl border bg-background px-5 text-base font-medium transition-colors hover:bg-muted active:bg-muted/70"
        >
          Batal
        </a>
        <SubmitButton />
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-50"
    >
      {pending ? "Menyimpan…" : "Simpan Pasien"}
    </button>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

type FieldProps = {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  autoFocus?: boolean;
  maxLength?: number;
  inputMode?: "text" | "numeric" | "tel" | "email" | "url" | "search";
  pattern?: string;
  error?: string[];
};

function Field({
  label,
  name,
  required,
  type = "text",
  placeholder,
  autoFocus,
  maxLength,
  inputMode,
  pattern,
  error,
}: FieldProps) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between text-sm font-medium">
        <span>
          {label}
          {required ? <span className="ml-0.5 text-destructive">*</span> : null}
        </span>
      </div>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        autoFocus={autoFocus}
        maxLength={maxLength}
        inputMode={inputMode}
        pattern={pattern}
        className="h-12 w-full rounded-xl border bg-background px-4 text-base outline-none focus:ring-2 focus:ring-primary/40 aria-invalid:border-destructive"
        aria-invalid={error ? true : undefined}
      />
      {error?.length ? (
        <p className="mt-1.5 text-xs text-destructive">{error[0]}</p>
      ) : null}
    </label>
  );
}

function FieldArea({
  label,
  name,
  rows = 3,
  placeholder,
  error,
}: {
  label: string;
  name: string;
  rows?: number;
  placeholder?: string;
  error?: string[];
}) {
  return (
    <label className="block">
      <div className="mb-1.5 text-sm font-medium">{label}</div>
      <textarea
        name={name}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-y rounded-xl border bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-primary/40 aria-invalid:border-destructive"
        aria-invalid={error ? true : undefined}
      />
      {error?.length ? (
        <p className="mt-1.5 text-xs text-destructive">{error[0]}</p>
      ) : null}
    </label>
  );
}

function FieldRadio({
  label,
  name,
  required,
  options,
  error,
}: {
  label: string;
  name: string;
  required?: boolean;
  options: { value: string; label: string }[];
  error?: string[];
}) {
  return (
    <div>
      <div className="mb-1.5 text-sm font-medium">
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </div>
      <div className="flex gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border bg-background px-4 text-base transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary active:bg-muted/70"
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              required={required}
              className="sr-only"
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
      {error?.length ? (
        <p className="mt-1.5 text-xs text-destructive">{error[0]}</p>
      ) : null}
    </div>
  );
}
