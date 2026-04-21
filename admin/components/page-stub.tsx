import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function PageStub({
  title,
  subtitle,
  badge,
  cta,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  cta?: { label: string; href?: string };
}) {
  return (
    <AdminShell>
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="mb-8">
          {badge && (
            <Badge variant="outline" className="mb-2 h-5 border-primary/40 bg-primary/10 px-2 text-[10px] tracking-wide text-primary">
              {badge}
            </Badge>
          )}
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{subtitle}</p>
        </div>

        <div className="bento flex min-h-[400px] items-center justify-center">
          <div className="max-w-sm text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-dashed border-primary/30 bg-primary/5">
              <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            </div>
            <h2 className="text-base font-medium">Belum ada data</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Halaman ini masih scaffold. Tagging mode — fungsionalitas dibangun setelah dev &amp; admin deploy stabil.
            </p>
            {cta && (
              <Button variant="outline" size="sm" className="mt-5">
                {cta.label}
              </Button>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
