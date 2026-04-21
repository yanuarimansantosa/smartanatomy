import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle, CircleDashed } from "lucide-react";
import { NetworkStatus } from "@/components/network-status";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { DarkToggle } from "@/components/dark-toggle";
import { BrandHeader, BrandFooter } from "@/components/brand-header";
import {
  ROADMAP,
  REPO_OWNER,
  REPO_NAME,
  flattenMilestones,
  type Milestone,
  type MilestoneStatus,
} from "@/lib/roadmap";
import {
  fetchTagsWithStatus,
  tagMatches,
  type GitHubTag,
} from "@/lib/github-tags";

export const metadata = {
  title: "Progres pembangunan",
  description:
    "Roadmap NovaCareEMR disinkronkan dengan tag GitHub sebagai bukti pengiriman tiap stage.",
};

// ISR — re-render the page at most every 5 minutes (matches fetchTags TTL).
export const revalidate = 300;

const today = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
}).format(new Date());

function resolveStatus(
  m: Milestone,
  tag: GitHubTag | undefined,
): MilestoneStatus {
  if (m.manualStatus) return m.manualStatus;
  return tag ? "done" : "planned";
}

function StatusBadge({ status }: { status: MilestoneStatus }) {
  if (status === "done") {
    return (
      <span
        aria-label="Selesai"
        title="Selesai — tag GitHub tersedia"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
      >
        <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
      </span>
    );
  }
  if (status === "in-progress") {
    return (
      <span
        aria-label="Sedang dikerjakan"
        title="Sedang dikerjakan"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent"
      >
        <CircleDashed className="h-4 w-4" strokeWidth={2} />
      </span>
    );
  }
  return (
    <span
      aria-label="Belum dimulai"
      title="Belum dimulai"
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground/60"
    >
      <Circle className="h-4 w-4" strokeWidth={1.5} />
    </span>
  );
}

function tagUrl(tagName: string) {
  return `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/tag/${encodeURIComponent(tagName)}`;
}

export default async function Progress() {
  const { tags, status: tagsStatus } = await fetchTagsWithStatus();

  // Resolve every milestone once.
  const resolved = ROADMAP.map((cat) => {
    const items = cat.items.map((m) => {
      const tag = tagMatches(tags, m.expectedTag);
      const status = resolveStatus(m, tag);
      return { milestone: m, tag, status };
    });
    const done = items.filter((i) => i.status === "done").length;
    const inProg = items.filter((i) => i.status === "in-progress").length;
    return { category: cat, items, done, inProg, total: items.length };
  });

  const totalAll = flattenMilestones().length;
  const doneAll = resolved.reduce((acc, c) => acc + c.done, 0);
  const inProgAll = resolved.reduce((acc, c) => acc + c.inProg, 0);
  const pct = totalAll === 0 ? 0 : Math.round((doneAll / totalAll) * 100);
  const liveTagsCount = tags.length;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-6 py-3 md:px-10">
        <BrandHeader today={today} />
        <div className="flex shrink-0 items-center gap-2">
          <DarkToggle />
          <ThemeSwitcher />
          <NetworkStatus />
        </div>
      </header>

      <main className="flex-1 px-6 py-10 md:px-10 md:py-14">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke beranda
          </Link>

          {/* ---------- Hero ---------- */}
          <section className="mt-10">
            <p className="mb-5 inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.22em] text-accent">
              <span aria-hidden className="inline-block h-px w-8 bg-accent/60" />
              <span>Progres pembangunan · live</span>
            </p>

            <h1 className="font-display text-4xl font-medium leading-[1.05] tracking-tight text-foreground md:text-5xl xl:text-6xl">
              Roadmap yang{" "}
              <span className="italic font-normal text-primary">
                dapat ditelusuri.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Setiap milestone disinkronkan dengan tag rilis di GitHub. Tag yang
              sudah ada menjadi bukti — bukan klaim. Halaman ini memuat ulang
              setiap 5 menit dari{" "}
              <a
                href={`https://github.com/${REPO_OWNER}/${REPO_NAME}/tags`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
              >
                {REPO_OWNER}/{REPO_NAME}
              </a>
              .
            </p>
          </section>

          {/* ---------- Overall progress ---------- */}
          <section className="mt-12 rounded-2xl border border-border bg-card p-7 md:p-9">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  Total milestone
                </p>
                <p className="mt-3 font-display text-5xl font-normal leading-none tracking-tight text-foreground md:text-6xl">
                  {pct}
                  <span className="ml-1 text-2xl text-muted-foreground md:text-3xl">
                    %
                  </span>
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  <span className="text-foreground">{doneAll}</span> selesai
                  {inProgAll > 0 ? (
                    <>
                      <span className="mx-2 text-muted-foreground/40">·</span>
                      <span className="text-foreground">{inProgAll}</span>{" "}
                      sedang dikerjakan
                    </>
                  ) : null}
                  <span className="mx-2 text-muted-foreground/40">·</span>
                  <span className="text-foreground">{totalAll}</span> total
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>
                  Tag GitHub terpantau:{" "}
                  <span className="text-foreground">{liveTagsCount}</span>
                </p>
                <p className="mt-1">
                  Cache 5 menit ·{" "}
                  {tagsStatus === "ok"
                    ? "live"
                    : tagsStatus === "private"
                      ? "repo private — set GITHUB_TOKEN"
                      : tagsStatus === "rate-limit"
                        ? "rate-limited (60/h anonim)"
                        : "API error"}
                </p>
              </div>
            </div>

            <div
              className="mt-6 h-2 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progres total roadmap"
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </section>

          {/* ---------- Per-category sections ---------- */}
          {resolved.map((cat) => {
            const catPct =
              cat.total === 0 ? 0 : Math.round((cat.done / cat.total) * 100);
            return (
              <section key={cat.category.key} className="mt-16">
                <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-4">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                      {cat.category.subtitle}
                    </p>
                    <h2 className="mt-2 font-display text-2xl font-medium tracking-tight md:text-3xl">
                      {cat.category.title}
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-2xl font-normal text-foreground">
                      {cat.done}
                      <span className="text-muted-foreground/60">
                        /{cat.total}
                      </span>
                    </span>
                    <div
                      className="h-1.5 w-32 overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-valuenow={catPct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Progres ${cat.category.title}`}
                    >
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${catPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <ul className="mt-6 divide-y divide-border/60">
                  {cat.items.map(({ milestone, tag, status }) => (
                    <li
                      key={milestone.id}
                      className="flex items-start gap-4 py-4"
                    >
                      <StatusBadge status={status} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <p className="font-display text-base font-medium tracking-tight text-foreground md:text-lg">
                            {milestone.title}
                          </p>
                          {tag ? (
                            <a
                              href={tagUrl(tag.name)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center rounded-md border border-primary/30 bg-primary/5 px-2 py-0.5 font-mono text-[11px] text-primary transition-colors hover:bg-primary/10"
                            >
                              {tag.name}
                            </a>
                          ) : status === "in-progress" ? (
                            <span className="inline-flex items-center rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] uppercase tracking-wider text-accent">
                              In progress
                            </span>
                          ) : null}
                        </div>
                        {milestone.detail ? (
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {milestone.detail}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

          {/* ---------- Method note ---------- */}
          <section className="mt-16 rounded-2xl border border-border bg-card p-7 md:p-9">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Metode
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
              <span className="text-foreground">Mengapa tag, bukan checklist?</span>{" "}
              Karena tag adalah commit yang sudah di-push — siapa saja bisa
              memverifikasinya. Tidak ada ruang untuk klaim yang tidak bisa
              ditelusuri. Prinsip{" "}
              <Link
                href="/tentang"
                className="underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
              >
                Accountability
              </Link>{" "}
              berlaku untuk roadmap, sama seperti untuk audit log klinis.
            </p>
          </section>
        </div>
      </main>

      <BrandFooter />
    </div>
  );
}
