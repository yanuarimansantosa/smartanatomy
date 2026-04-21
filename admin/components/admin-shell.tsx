"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Blocks,
  Sparkles,
  Bell,
  Shield,
  Settings,
  Activity,
  ChevronsUpDown,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type NavItem = {
  group: string;
  items: { label: string; href: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[];
};

const NAV: NavItem[] = [
  {
    group: "Overview",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Activity log", href: "/activity", icon: Activity },
    ],
  },
  {
    group: "Platform",
    items: [
      { label: "Tenants", href: "/tenants", icon: Building2 },
      { label: "Modules", href: "/modules", icon: Blocks },
      { label: "Claude credits", href: "/claude-credits", icon: Sparkles, badge: "NEW" },
    ],
  },
  {
    group: "Operations",
    items: [
      { label: "Notifications", href: "/notifications", icon: Bell },
      { label: "Security", href: "/security", icon: Shield },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full bg-background grid-bg">
      {/* ============ Sidebar ============ */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl md:flex">
        {/* Brand */}
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/40 text-primary-foreground shadow-[0_0_20px_-4px_oklch(0.70_0.20_278_/_0.5)]">
            <span className="font-semibold tracking-tight">S</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">Salam AI</span>
            <span className="text-[11px] text-muted-foreground">Admin · v0.1</span>
          </div>
        </div>

        {/* Tenant switcher (stub) */}
        <div className="px-3 pt-3">
          <button className="flex w-full items-center gap-2.5 rounded-xl border border-sidebar-border bg-sidebar-accent/30 px-3 py-2.5 text-left transition hover:border-primary/30 hover:bg-sidebar-accent/60">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-primary/20 text-primary text-xs font-semibold">
              MI
            </div>
            <div className="flex-1 leading-tight">
              <div className="text-xs text-muted-foreground">Platform</div>
              <div className="text-sm font-medium">MedInovaTech</div>
            </div>
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Nav */}
        <nav className="mt-4 flex-1 overflow-y-auto px-2">
          {NAV.map((section) => (
            <div key={section.group} className="mb-5">
              <div className="px-3 pb-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/80">
                {section.group}
              </div>
              <ul className="flex flex-col gap-0.5">
                {section.items.map((it) => {
                  const Icon = it.icon;
                  const active = pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href));
                  return (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        )}
                      >
                        <Icon className={cn("h-4 w-4", active && "text-primary")} />
                        <span className="flex-1">{it.label}</span>
                        {it.badge && (
                          <Badge variant="outline" className="h-4 border-primary/40 bg-primary/10 px-1.5 text-[9px] font-medium tracking-wide text-primary">
                            {it.badge}
                          </Badge>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer / user */}
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-primary/40 to-primary/10 text-xs font-semibold text-primary">
              YS
            </div>
            <div className="flex-1 leading-tight">
              <div className="text-sm font-medium">dr. Yanuar</div>
              <div className="text-[11px] text-muted-foreground">Super Admin</div>
            </div>
            <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400/60" />
          </div>
        </div>
      </aside>

      {/* ============ Main column ============ */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/60 px-6 backdrop-blur-xl">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Cari tenant, modul, log…"
              className="h-9 w-full rounded-lg border border-input bg-card/60 pl-9 pr-16 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
            />
            <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          </div>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="ghost" size="icon-sm" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] text-muted-foreground">Platform healthy</span>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
