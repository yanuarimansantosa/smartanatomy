"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import {
  ClipboardList,
  FileText,
  Printer,
  Stethoscope,
  User,
  type LucideIcon,
} from "lucide-react";
import { createVisit } from "@/app/pasien/[id]/kunjungan/actions";

type SubnavItem = {
  label: string;
  href?: string;
  Icon: LucideIcon;
  active?: boolean;
  disabled?: boolean;
  hint?: string;
};

export function PatientSubnav({
  patientId,
  patientName,
  patientNoRm,
}: {
  patientId: string;
  patientName: string;
  patientNoRm: string;
}) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const onProfile = pathname === `/pasien/${patientId}`;
  const onVisit = pathname.startsWith(`/pasien/${patientId}/kunjungan/`);

  const items: SubnavItem[] = [
    {
      label: "Profil",
      href: `/pasien/${patientId}`,
      Icon: User,
      active: onProfile,
    },
    {
      label: "Kunjungan",
      href: undefined,
      Icon: ClipboardList,
      active: onVisit,
      disabled: !onVisit,
      hint: onVisit ? undefined : "Pilih dari riwayat",
    },
    {
      label: "Surat",
      Icon: FileText,
      disabled: true,
      hint: "Segera",
    },
    {
      label: "Cetak kartu",
      Icon: Printer,
      disabled: true,
      hint: "Segera",
    },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-muted/20 px-6 py-2.5 md:px-10">
      {/* Patient context — left */}
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <User className="h-3.5 w-3.5" />
        </span>
        <Link
          href={`/pasien/${patientId}`}
          className="min-w-0 truncate font-medium text-foreground transition-colors hover:text-primary"
          title={patientName}
        >
          {patientName}
        </Link>
        <span aria-hidden className="text-muted-foreground/40">·</span>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {patientNoRm}
        </span>
      </div>

      {/* Subnav — right */}
      <nav
        aria-label="Navigasi pasien"
        className="flex flex-wrap items-center gap-1"
      >
        {items.map((it) => (
          <SubnavLink key={it.label} item={it} />
        ))}
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(() => {
              createVisit(patientId);
            })
          }
          className="ml-1 inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
          title="Mulai kunjungan baru"
        >
          <Stethoscope className="h-3.5 w-3.5" />
          {isPending ? "Membuka…" : "Periksa baru"}
        </button>
      </nav>
    </div>
  );
}

function SubnavLink({ item }: { item: SubnavItem }) {
  const { Icon, label, href, active, disabled, hint } = item;
  const base =
    "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors";
  const stateClass = disabled
    ? "cursor-not-allowed text-muted-foreground/50"
    : active
      ? "bg-primary/10 text-primary"
      : "text-muted-foreground hover:bg-muted hover:text-foreground";

  const content = (
    <>
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      <span>{label}</span>
      {hint ? (
        <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </>
  );

  if (disabled || !href) {
    return (
      <span className={`${base} ${stateClass}`} aria-disabled="true" title={label}>
        {content}
      </span>
    );
  }

  return (
    <Link href={href} className={`${base} ${stateClass}`}>
      {content}
    </Link>
  );
}
