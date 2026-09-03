import {
  IconAward,
  IconBrandGithub,
  IconChartBar,
  IconInfoCircleFilled,
  IconKeyboard,
  IconKeyboardFilled,
  IconPalette,
  IconTrophy,
} from "@tabler/icons-react";
import type { Metadata } from "next";
import { CommunityStats } from "~/components/community-stats";
import { BackToTyping } from "~/components/ui/back-to-typing";
import { Card, CardContent } from "~/components/ui/card";
import { InlineCode } from "~/components/ui/inline-code";
import { TextLink } from "~/components/ui/text-link";

export const metadata: Metadata = {
  title: "about",
  description:
    "About zentype - a customizable typing test with leaderboards, achievements, and stats",
};

function ZentypeIcon({ className }: { className?: string }) {
  return <IconKeyboardFilled className={className} />;
}

export default function AboutPage() {
  return (
    <div
      className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-8"
      role="main"
      aria-label="About zentype"
    >
      <header className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <IconInfoCircleFilled className="text-primary size-5" /> about zentype
        </h1>
      </header>

      <div className="space-y-8">
        <section>
          <h2 className="text-base font-semibold">
            what is <ZentypeIcon className="text-primary size-4 inline" /> zentype?
          </h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            <ZentypeIcon className="text-primary size-4 inline" /> zentype is a typing test with
            speed and accuracy tracking, inspired by{" "}
            <TextLink href="https://monkeytype.com/" target="_blank" rel="noreferrer">
              monkeytype
            </TextLink>
            . it layers on XP and levels, 110+ achievements, streak heatmaps, and global
            leaderboards.
          </p>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Built with{" "}
            <TextLink href="https://nextjs.org/" target="_blank" rel="noreferrer">
              Next.js
            </TextLink>
            ,{" "}
            <TextLink href="https://supabase.com/" target="_blank" rel="noreferrer">
              Supabase
            </TextLink>
            ,{" "}
            <TextLink href="https://ui.shadcn.com/" target="_blank" rel="noreferrer">
              shadcn/ui
            </TextLink>
            , and{" "}
            <TextLink href="https://tailwindcss.com/" target="_blank" rel="noreferrer">
              Tailwind CSS
            </TextLink>
            . Open source and free to use.
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
              description={
                <>
                  Time (<InlineCode>15/30/60/120s</InlineCode>) and words (
                  <InlineCode>10/25/50/100</InlineCode>) modes. Punctuation and numbers toggles.
                  Blind mode, stop on error, strict space. Works on phone and desktop.
                </>
              }
            />
            <FeatureCard
              icon={<IconChartBar className="size-5" />}
              title="detailed stats"
              description="Net and raw WPM, accuracy, consistency (how steady your speed stays), character breakdown. Per-second timeline charts and personal bests per mode."
            />
            <FeatureCard
              icon={<IconTrophy className="size-5" />}
              title="leaderboards"
              description="Global leaderboards ranked by mode and variant. All-time, this week, and today views. Redis-backed with Postgres fallback."
            />
            <FeatureCard
              icon={<IconAward className="size-5" />}
              title="achievements"
              description="110+ achievements: tests completed, WPM milestones, accuracy runs, streaks, consistency, account age, and more. XP per test, 500 per level."
            />
            <FeatureCard
              icon={<IconPalette className="size-5" />}
              title="customization"
              description={
                <>
                  200+ themes, 90+ fonts, 4 caret styles, virtual keyboard, WebAudio sounds, and a
                  command palette.
                </>
              }
            />
            <FeatureCard
              icon={<IconBrandGithub className="size-5" />}
              title="open source"
              description={
                <>
                  Next.js, Supabase, shadcn/ui, Tailwind CSS.{" "}
                  <TextLink
                    href="https://github.com/CMMhero/zentype"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs"
                  >
                    open source on github
                  </TextLink>
                  .
                </>
              }
            />
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold">credits</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Built by{" "}
            <TextLink href="https://cmmhero.top" target="_blank" rel="noreferrer">
              CMMhero
            </TextLink>
            . Full-stack typing test with cloud sync, XP, and leaderboards.
          </p>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Trophy UI components by{" "}
            <TextLink href="https://ui.trophy.so" target="_blank" rel="noreferrer">
              trophyso/ui
            </TextLink>
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

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
}) {
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
