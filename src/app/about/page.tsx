import type { Metadata } from "next";
import Link from "next/link";
import { IconKeyboard, IconTrophy, IconAward, IconChartBar, IconPalette, IconBrandGithub } from "@tabler/icons-react";
import { getPublicStats } from "~/server/results";

export const metadata: Metadata = {
  title: "About | zentype",
  description: "About zentype - a keyboard-first typing test with gamification",
};

export default async function AboutPage() {
  const stats = await getPublicStats();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">about zentype</h1>
      <p className="text-muted-foreground mt-2 text-xs">Last updated: August 29, 2026</p>

      <div className="mt-8 space-y-8">
        {/* What is zentype */}
        <section>
          <h2 className="text-base font-semibold">what is zentype?</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            zentype is a keyboard-first typing test built for speed and accuracy tracking,
            inspired by monkeytype. It combines gamification elements like XP,
            levels, achievements, and global leaderboards to make typing practice engaging.
          </p>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Built with Next.js 15, Supabase, shadcn/ui, and Tailwind CSS. Open source and free to use.
          </p>
        </section>

        {/* Stats */}
        <section>
          <h2 className="text-base font-semibold">community stats</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="users" value={stats?.totalUsers ?? 0} />
            <StatCard label="tests typed" value={stats?.totalTests ?? 0} />
            <StatCard label="hours typed" value={stats?.totalHours ?? 0} />
            <StatCard label="xp earned" value={stats?.totalAchievements ?? 0} />
          </div>
        </section>

        {/* Features */}
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

        {/* Credits */}
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/30 bg-card p-3 text-center">
      <div className="text-xl font-bold tabular-nums text-primary">
        {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toLocaleString()}
      </div>
      <div className="text-muted-foreground mt-1 text-[10px] tracking-wider uppercase">{label}</div>
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
