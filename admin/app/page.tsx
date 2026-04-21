import { AdminShell } from "@/components/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  Building2,
  Users,
  Activity,
  Sparkles,
  Blocks,
  TrendingUp,
  CheckCircle2,
  Clock,
} from "lucide-react";

export default function AdminHome() {
  return (
    <AdminShell>
      <div className="mx-auto w-full max-w-[1400px]">
        {/* Hero */}
        <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <Badge variant="outline" className="h-5 border-primary/40 bg-primary/10 px-2 text-[10px] tracking-wide text-primary">
                PLATFORM
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())}
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ringkasan kesehatan platform NovaCareEMR — tenant, modul, dan pemakaian kredit Claude.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Export laporan
            </Button>
            <Button size="sm">
              Tambah tenant
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Top KPI row */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={Building2} label="Tenant aktif" value="0" delta="siap onboard pertama" positive />
          <Kpi icon={Users} label="Dokter" value="0" delta="blm ada user" />
          <Kpi icon={Activity} label="Sesi hari ini" value="0" delta="0 pasien baru" />
          <Kpi icon={Sparkles} label="Kredit Claude" value="500" delta="free pool default" positive />
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
          {/* Tenants — large */}
          <div className="bento col-span-1 lg:col-span-4 min-h-[280px]">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Tenant onboarding
                </div>
                <div className="mt-1 text-xl font-semibold tracking-tight">Belum ada tenant</div>
              </div>
              <Button variant="outline" size="sm">
                Provision tenant
              </Button>
            </div>
            <div className="mt-6 flex h-[180px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-center">
              <div className="max-w-xs">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="text-sm font-medium">Provision tenant pertama</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Setiap tenant dapat subdomain, database isolated, dan paket modul sendiri.
                </div>
              </div>
            </div>
          </div>

          {/* Claude credits — small */}
          <div className="bento col-span-1 lg:col-span-2 min-h-[280px] overflow-hidden">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Claude API pool
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <div className="text-3xl font-semibold tracking-tight">500</div>
              <div className="text-xs text-muted-foreground">turns/bulan/tenant</div>
            </div>
            <div className="mt-4 space-y-2.5">
              <Progress label="Harian (default)" value={0} max={100} unit="turns" />
              <Progress label="Bulanan (default)" value={0} max={500} unit="turns" />
            </div>
            <div className="mt-5 border-t border-border pt-4 text-[11px] text-muted-foreground">
              Reseller pool via subscription owner · Haiku 4.5 model
            </div>
          </div>

          {/* Modules — medium */}
          <div className="bento col-span-1 lg:col-span-3 min-h-[200px]">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Modul terdaftar
                </div>
                <div className="mt-1 text-xl font-semibold tracking-tight">5 core · 0 optional</div>
              </div>
              <Blocks className="h-5 w-5 text-muted-foreground/60" />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {["Pasien Baru", "Cari Pasien", "Jadwal", "Sesi", "Pengaturan"].map((m) => (
                <div
                  key={m}
                  className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1.5 text-xs"
                >
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  <span className="truncate">{m}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity feed — medium */}
          <div className="bento col-span-1 lg:col-span-3 min-h-[200px]">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Aktivitas terkini
                </div>
                <div className="mt-1 text-xl font-semibold tracking-tight">Audit log</div>
              </div>
              <Activity className="h-5 w-5 text-muted-foreground/60" />
            </div>
            <ul className="space-y-3 text-sm">
              <ActivityRow when="baru saja" actor="system" what="admin dashboard scaffolded" ok />
              <ActivityRow when="5m" actor="system" what="SSL cert provisioned (LE)" ok />
              <ActivityRow when="15m" actor="system" what="postgres 16 + rme_app role created" ok />
              <ActivityRow when="kemarin" actor="dr. Yanuar" what="v0.3.0-gold-tier tagged" />
            </ul>
          </div>

          {/* Health strip — full */}
          <div className="bento col-span-1 lg:col-span-6">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
              <Health label="Web app (dev)" status="pending" />
              <Health label="Admin (dashboard)" status="ok" />
              <Health label="Postgres rme-dev" status="ok" />
              <Health label="Postgres rme-prod" status="ok" />
              <Health label="Claude API pool" status="pending" />
              <Health label="Resend email" status="pending" />
              <Health label="Telegram bot" status="pending" />
              <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Health check refresh tiap 30s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  delta,
  positive,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  delta: string;
  positive?: boolean;
}) {
  return (
    <div className="bento">
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-muted/60">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
      <div className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</div>
      <div className={`mt-1 text-xs ${positive ? "text-emerald-400" : "text-muted-foreground"}`}>
        {delta}
      </div>
    </div>
  );
}

function Progress({ label, value, max, unit }: { label: string; value: number; max: number; unit: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums">
          {value}/{max} {unit}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted/60">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ActivityRow({ when, actor, what, ok }: { when: string; actor: string; what: string; ok?: boolean }) {
  return (
    <li className="flex items-start gap-3">
      <div className="mt-1.5">
        {ok ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 leading-tight">
        <div className="text-sm">{what}</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">
          {actor} · {when}
        </div>
      </div>
    </li>
  );
}

function Health({ label, status }: { label: string; status: "ok" | "pending" | "down" }) {
  const dot = {
    ok: "bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400/60",
    pending: "bg-amber-400 shadow-[0_0_8px] shadow-amber-400/60",
    down: "bg-red-400 shadow-[0_0_8px] shadow-red-400/60",
  }[status];
  return (
    <div className="flex items-center gap-2">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      <span className="text-xs">{label}</span>
    </div>
  );
}
