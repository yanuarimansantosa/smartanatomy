"use client";

import { useTransition } from "react";
import { Stethoscope } from "lucide-react";
import { createVisit } from "./kunjungan/actions";

export function StartVisitButton({ patientId }: { patientId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(() => {
          createVisit(patientId);
        })
      }
      disabled={isPending}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      <Stethoscope className="h-4 w-4" />
      {isPending ? "Membuka kunjungan…" : "Periksa pasien"}
    </button>
  );
}
