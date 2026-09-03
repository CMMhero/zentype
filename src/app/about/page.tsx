import type { Metadata } from "next";
import { BackToTyping } from "~/components/ui/back-to-typing";
import { IconInfoCircleFilled, IconKeyboard, IconKeyboardFilled, IconTrophy, IconAward, IconChartBar, IconPalette, IconBrandGithub } from "@tabler/icons-react";
import { CommunityStats } from "~/components/community-stats";
import { Card, CardContent } from "~/components/ui/card";

export const metadata: Metadata = {
  title: "about",
  description: "About zentype - a customizable typing test with leaderboards, achievements, and stats",
};

function ZentypeIcon({ className }: { className?: string }) {
  return <IconKeyboardFilled className={className} />;
}

export default function AboutPage() {
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
            <ZentypeIcon className="text-primary size-4 inline" /> zentype is a typing test with speed and accuracy tracking, inspired by{" "}
            <a href="https://monkeytype.com/" target="_blank" rel="noreferrer" className="text-primary hover:underline">monkeytype</a>.
            XP, levels, 100+ achievements, streak heatmaps, and global leaderboards.
          </p>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Built with{" "}
            <a href="https://nextjs.org/" target="_blank" rel="noreferrer" className="text-primary hover:underline">Next.js</a>,{" "}
            <a href="https://supabase.com/" target="_blank" rel="noreferrer" className="text-primary hover:underline">Supabase</a>,{" "}
            <a href="https://ui.shadcn.com/" target="_blank" rel="noreferrer" className="text-primary hover:underline">shadcn/ui</a>, and{" "}
            <a href="https://tailwindcss.com/" target="_blank" rel="noreferrer" className="text-primary hover:underline">Tailwind CSS</a>. Open source and free to use.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">community stats</h2>
          <CommunityStats />
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
              description="Net and raw WPM, accuracy, consistency (how steady your speed stays), character breakdown. Per-second timeline charts and personal bests per mode."
            />
            <FeatureCard
              icon={<IconTrophy className="size-5" />}
              title="leaderboards"
              description="Global leaderboards ranked by mode and variant. Weekly and all-time views. Redis-backed with Postgres fallback."
            />
            <FeatureCard
              icon={<IconAward className="size-5" />}
              title="achievements"
              description="100+ achievements: tests completed, WPM milestones, accuracy runs, streaks, consistency, account age, and more. XP per test, 500 per level."
            />
            <FeatureCard
              icon={<IconPalette className="size-5" />}
              title="customization"
              description="200+ themes, 80+ fonts, 4 caret styles, virtual keyboard, WebAudio sounds, and a command palette (cmd+k)."
            />
            <FeatureCard
              icon={<IconBrandGithub className="size-5" />}
              title="open source"
              description={<>Next.js, Supabase, shadcn/ui, Tailwind CSS. <a href="https://github.com/CMMhero/zentype" target="_blank" rel="noreferrer" className="text-primary hover:underline">open source on github</a>.</>}
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
          <BackToTyping />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: React.ReactNode }) {
  return (
    <Card size="sm">
      <CardContent>
        <div className="flex items-center gap-2">
          <span className="text-primary">{icon}</span>
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}
