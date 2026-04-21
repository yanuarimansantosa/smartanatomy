"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  GaugeCircle,
  Info,
  Menu,
  ScrollText,
  Settings,
  Sparkles,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { NovaCareMark } from "./brand-header";

const COLLAPSE_KEY = "novacare:nav:collapsed";

type NavItem = {
  label: string;
  href: string;
  Icon: LucideIcon;
  disabled?: boolean;
  hint?: string;
};

const PRIMARY: NavItem[] = [
  { label: "Beranda", href: "/", Icon: GaugeCircle },
  { label: "Pasien", href: "/pasien", Icon: Users },
  {
    label: "Jadwal",
    href: "/jadwal",
    Icon: CalendarDays,
    disabled: true,
    hint: "Segera",
  },
  {
    label: "Audit log",
    href: "/audit",
    Icon: ScrollText,
    disabled: true,
    hint: "Segera",
  },
];

const SECONDARY: NavItem[] = [
  { label: "Progres", href: "/progress", Icon: Sparkles },
  { label: "Tentang", href: "/tentang", Icon: Info },
  {
    label: "Pengaturan",
    href: "/pengaturan",
    Icon: Settings,
    disabled: true,
    hint: "Segera",
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem(COLLAPSE_KEY);
    if (saved === "0") setCollapsed(false);
    if (saved === "1") setCollapsed(true);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
  }, [collapsed, hydrated]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-dvh w-full">
      {/* Mobile hamburger — only visible <md */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Buka menu"
        className="fixed left-3 top-3 z-30 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background/95 text-foreground shadow-sm backdrop-blur md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      ) : null}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card transition-[transform,width] duration-200 ease-out md:sticky md:top-0 md:h-dvh md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "w-[72px]" : "w-[232px]"}`}
        aria-label="Navigasi utama"
      >
        {/* Brand mark + close (mobile) */}
        <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-3 py-3">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            title="NovaCareEMR — beranda"
          >
            <NovaCareMark className="h-10 w-10 shrink-0" iconSize={22} />
            {!collapsed ? (
              <span className="min-w-0 truncate font-display text-base font-medium leading-none tracking-tight">
                NovaCare
                <span className="font-normal text-primary">EMR</span>
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Tutup menu"
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Primary section */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <SidebarSectionHeader label="Sistem" collapsed={collapsed} />
          <ul className="mt-1 space-y-0.5">
            {PRIMARY.map((it) => (
              <li key={it.href}>
                <NavLink item={it} active={isActive(pathname, it.href)} collapsed={collapsed} />
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <SidebarSectionHeader label="Lainnya" collapsed={collapsed} />
            <ul className="mt-1 space-y-0.5">
              {SECONDARY.map((it) => (
                <li key={it.href}>
                  <NavLink item={it} active={isActive(pathname, it.href)} collapsed={collapsed} />
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Footer — collapse toggle */}
        <div className="shrink-0 border-t border-border/60 p-2">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Perlebar sidebar" : "Ciutkan sidebar"}
            title={collapsed ? "Perlebar" : "Ciutkan"}
            className="hidden h-10 w-full items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:inline-flex"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span>Ciutkan</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

function SidebarSectionHeader({
  label,
  collapsed,
}: {
  label: string;
  collapsed: boolean;
}) {
  if (collapsed) {
    return <div aria-hidden className="mx-2 h-px bg-border/60" />;
  }
  return (
    <div className="px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
      {label}
    </div>
  );
}

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const { Icon, label, href, disabled, hint } = item;

  const base =
    "group relative flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors";
  const stateClass = disabled
    ? "cursor-not-allowed text-muted-foreground/50"
    : active
      ? "bg-primary/10 text-primary"
      : "text-foreground/70 hover:bg-muted hover:text-foreground";

  const iconEl = (
    <Icon
      className={`h-5 w-5 shrink-0 ${active ? "text-primary" : ""}`}
      strokeWidth={active ? 2 : 1.5}
      aria-hidden
    />
  );

  const content = (
    <>
      {/* Active rail */}
      {active ? (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary"
        />
      ) : null}
      {iconEl}
      {!collapsed ? (
        <span className="min-w-0 flex-1 truncate">{label}</span>
      ) : null}
      {!collapsed && hint ? (
        <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
          {hint}
        </span>
      ) : null}
      {/* Tooltip in collapsed mode */}
      {collapsed ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          {label}
          {hint ? (
            <span className="ml-1.5 rounded bg-muted px-1 text-[9px] uppercase tracking-wider text-muted-foreground">
              {hint}
            </span>
          ) : null}
        </span>
      ) : null}
    </>
  );

  if (disabled) {
    return (
      <span className={`${base} ${stateClass}`} aria-disabled="true" title={label}>
        {content}
      </span>
    );
  }

  return (
    <Link href={href} className={`${base} ${stateClass}`} title={collapsed ? label : undefined}>
      {content}
    </Link>
  );
}

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
