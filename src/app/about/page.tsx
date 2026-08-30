import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { IconInfoCircleFilled, IconKeyboard, IconKeyboardFilled, IconTrophy, IconAward, IconChartBar, IconPalette, IconBrandGithub } from "@tabler/icons-react";
import { getPublicStats } from "~/server/results";
import { Skeleton } from "~/components/ui/skeleton";

export const metadata: Metadata = {
  title: "About",
  description: "About zentype - a customizable typing test with leaderboards, achievements, and stats",
};

function ZentypeIcon({ className }: { className?: string }) {
  return <IconKeyboardFilled className={className} />;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

async function CommunityStats() {
  const stats = await getPublicStats();
  return (
    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatCard label="users" value={stats?.totalUsers ?? 0} />
      <StatCard label="tests typed" value={stats?.totalTests ?? 0} />
      <StatCard label="time typed" value={formatTime(stats?.totalSeconds ?? 0)} />
      <StatCard label="xp earned" value={stats?.totalXpEarned ?? 0} />
    </div>
  );
}

function CommunityStatsSkeleton() {
  return (
    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border/30 bg-card p-3 text-center">
          <Skeleton className="mx-auto h-7 w-16" />
          <Skeleton className="mx-auto mt-1 h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

export default async function AboutPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-8" role="main" aria-label="About zentype">
      <header className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <IconInfoCircleFilled className="text-primary size-5" /> about zentype
        </h1>
      </header>

      <div className="space-y-8">
        <section>
          <h2 className="text-base font-semibold">what is <ZentypeIcon className="text-primary size-4 inline" /> zentype?</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            <ZentypeIcon className="text-primary size-4 inline" /> zentype is a typing test with speed and accuracy tracking, inspired by monkeytype.
            XP, levels, 110+ achievements, streak heatmaps, and global leaderboards.
          </p>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Built with Next.js, Supabase, shadcn/ui, and Tailwind CSS. Open source and free to use.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">community stats</h2>
          <Suspense fallback={<CommunityStatsSkeleton />}>
            <CommunityStats />
          </Suspense>
        </section>

        <section>
          <h2 className="text-base font-semibold">features</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FeatureCard
              icon={<IconKeyboard className="size-5" />}
              title="typing modes"
              description="Time (15/30/60/120s) and word (10/25/50/100) modes. Punctuation and numbers toggles. Blind mode, stop on error, strict space. Works on phone and desktop."
            />
            <FeatureCard
              icon={<IconChartBar className="size-5" />}
              title="detailed stats"
              description="Net and raw WPM, accuracy, kogasa consistency, character breakdown. Per-second timeline charts and personal bests per mode."
            />
            <FeatureCard
              icon={<IconTrophy className="size-5" />}
              title="leaderboards"
              description="Global leaderboards ranked by mode and variant. Weekly and all-time views. Redis-backed with Postgres fallback."
            />
            <FeatureCard
              icon={<IconAward className="size-5" />}
              title="achievements"
              description="110+ achievements: tests typed, WPM milestones, accuracy runs, streaks, consistency, account age, and more. XP per test, 500 per level."
            />
            <FeatureCard
              icon={<IconPalette className="size-5" />}
              title="customization"
              description="80+ themes, 50+ fonts, 4 caret styles, virtual keyboard, WebAudio sounds, and a command palette (cmd+k)."
            />
            <FeatureCard
              icon={<IconBrandGithub className="size-5" />}
              title="open source"
              description="Next.js, Supabase, shadcn/ui, Tailwind CSS. Open source under the repo linked above."
            />
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold">credits</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Built by{" "}
            <a href="https://cmmhero.top" target="_blank" rel="noreferrer" className="text-primary hover:underline">
              CMMhero
            </a>
            . Full-stack typing test with cloud sync, XP, and leaderboards.
          </p>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Trophy UI components by{" "}
            <a href="https://ui.trophy.so" target="_blank" rel="noreferrer" className="text-primary hover:underline">
              trophyso/ui
            </a>
            .
          </p>
        </section>

        <div className="pt-4">
          <Link href="/" className="text-primary text-xs underline underline-offset-2">
            ← back to test
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  const display = typeof value === "string"
    ? value
    : value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toLocaleString();
  return (
    <div className="rounded-lg border border-border/30 bg-card p-3 text-center">
      <div className="text-xl font-bold tabular-nums text-primary">
        {display}
      </div>
      <div className="text-muted-foreground mt-1 text-[10px] tracking-wider">{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-lg border border-border/30 bg-card p-4">
      <div className="flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{description}</p>
    </div>
  );
}
