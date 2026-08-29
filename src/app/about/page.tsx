import type { Metadata } from "next";
import Link from "next/link";
import { IconInfoCircleFilled, IconKeyboard, IconKeyboardFilled, IconTrophy, IconAward, IconChartBar, IconPalette, IconBrandGithub } from "@tabler/icons-react";
import { getPublicStats } from "~/server/results";

export const metadata: Metadata = {
  title: "About | zentype",
  description: "About zentype - a customizable, clean typing test with gamification",
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

export default async function AboutPage() {
  const stats = await getPublicStats();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <IconInfoCircleFilled className="text-primary size-5" /> about zentype
        </h1>
      </header>

      <div className="space-y-8">
        <section>
          <h2 className="text-base font-semibold">what is <ZentypeIcon className="text-primary size-4 inline" /> zentype?</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            <ZentypeIcon className="text-primary size-4 inline" /> zentype is a customizable, clean typing test built for speed and accuracy tracking,
            inspired by monkeytype. It combines gamification elements like XP,
            levels, achievements, and global leaderboards to make typing practice engaging.
          </p>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Built with Next.js, Supabase, shadcn/ui, and Tailwind CSS. Open source and free to use.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">community stats</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="users" value={stats?.totalUsers ?? 0} />
            <StatCard label="tests typed" value={stats?.totalTests ?? 0} />
            <StatCard label="time typed" value={formatTime(stats?.totalSeconds ?? 0)} />
            <StatCard label="xp earned" value={stats?.totalXpEarned ?? 0} />
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold">features</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FeatureCard
              icon={<IconKeyboard className="size-5" />}
              title="typing modes"
              description="Time-based (15s to 120s) and word-count modes with configurable options like blind mode, stop on error, and strict space."
            />
            <FeatureCard
              icon={<IconChartBar className="size-5" />}
              title="detailed stats"
              description="Track WPM, accuracy, consistency, and character breakdowns. View progress charts and personal bests."
            />
            <FeatureCard
              icon={<IconTrophy className="size-5" />}
              title="leaderboards"
              description="Compete globally on WPM leaderboards. Rank by mode and variant with weekly and all-time views."
            />
            <FeatureCard
              icon={<IconAward className="size-5" />}
              title="achievements"
              description="110+ achievements across categories like speed, accuracy, consistency, streaks, and more. Earn XP and level up."
            />
            <FeatureCard
              icon={<IconPalette className="size-5" />}
              title="customization"
              description="81 themes, 50 fonts, multiple caret styles, virtual keyboard, and sound effects. Make it yours."
            />
            <FeatureCard
              icon={<IconBrandGithub className="size-5" />}
              title="open source"
              description="Built with Next.js, Supabase, shadcn/ui, and Tailwind. Community contributions welcome."
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
            . Full-stack typing test with cloud sync, gamification, and leaderboards.
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
