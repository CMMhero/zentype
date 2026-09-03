"use client";

import { IconAt, IconCrown, IconHash, IconPlayerSkipForward } from "@tabler/icons-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Kbd } from "~/components/ui/kbd";
import { Skeleton } from "~/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { modeLabel, type SessionUser, type TestResult } from "~/lib/types";

// Non-compact WpmChart renders at h-56 — the loader skeleton must match so
// the layout doesn't jump when the lazy chunk finishes loading.
const WpmChart = dynamic(() => import("~/components/charts/wpm-chart").then((m) => m.WpmChart), {
  ssr: false,
  loading: () => <Skeleton className="h-56 w-full" />,
});

export type SaveState = "cloud" | "guest" | "failed" | "skipped" | "invalid";

interface ResultViewProps {
  result: TestResult;
  saveState: SaveState;
  isPB?: boolean;
  /** Signed-in user, when present. Guests get a sign-in hint instead. */
  user?: SessionUser | null;
  onNext: () => void;
}

const SAVE_BADGE: Record<
  SaveState,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  cloud: { label: "saved", variant: "default" },
  guest: { label: "guest", variant: "secondary" },
  failed: { label: "sync failed", variant: "destructive" },
  invalid: { label: "invalid", variant: "destructive" },
  skipped: { label: "not saved", variant: "secondary" },
};

export function ResultView({ result, saveState, isPB, user, onNext }: ResultViewProps) {
  const { label, variant } = SAVE_BADGE[saveState];
  // Guests who aren't saving to the cloud get a hint to sign in and keep
  // their history. (A "failed" state with a signed-in user is transient.)
  const showLoginHint = !user && (saveState === "guest" || saveState === "failed");

  return (
    <div
      className="zt-fade-in mx-auto flex w-full max-w-4xl flex-col gap-6 py-6"
      role="region"
      aria-label="Test results"
    >
      {/* Header — WPM and acc (labels below numbers), no separator */}
      <div className="flex items-end gap-6 sm:gap-8">
        <div className="flex flex-col">
          <span className="flex items-center gap-2">
            <span className="text-primary text-4xl leading-none font-bold tabular-nums sm:text-5xl">
              {result.wpm}
            </span>
            {isPB && (
              <Badge variant="secondary" className="gap-0.5 text-[9px] font-bold tracking-widest">
                <IconCrown className="size-3" /> PB
              </Badge>
            )}
          </span>
          <span className="text-muted-foreground mt-1.5 text-xs tracking-wider">wpm</span>
        </div>
        <div className="flex flex-col">
          <span className="text-secondary text-4xl leading-none font-bold tabular-nums sm:text-5xl">
            {result.accuracy}%
          </span>
          <span className="text-muted-foreground mt-1.5 text-xs tracking-wider">acc</span>
        </div>
      </div>

      {/* Meta — mode, punctuation, numbers badges */}
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        <Badge
          variant="outline"
          className="border-secondary bg-secondary text-secondary-foreground h-5 text-[10px] font-medium normal-case"
        >
          {modeLabel(result)}
        </Badge>
        {result.punctuation && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Badge
                  variant="outline"
                  className="border-secondary bg-secondary text-secondary-foreground size-5 p-0 text-[10px] font-medium normal-case"
                >
                  <IconAt className="size-3" />
                </Badge>
              }
            />
            <TooltipContent>punctuation</TooltipContent>
          </Tooltip>
        )}
        {result.numbers && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Badge
                  variant="outline"
                  className="border-secondary bg-secondary text-secondary-foreground size-5 p-0 text-[10px] font-medium normal-case"
                >
                  <IconHash className="size-3" />
                </Badge>
              }
            />
            <TooltipContent>numbers</TooltipContent>
          </Tooltip>
        )}
        <Badge variant={variant} className="text-[9px]">
          {label}
        </Badge>
      </p>

      {/* Chart — lazy-loaded recharts */}
      <WpmChart timeline={result.timeline} />

      {/* Mini grid — identical to history detail */}
      <div className="grid grid-cols-3 gap-3 text-center sm:grid-cols-6">
        <Mini label="raw" value={String(result.rawWpm)} />
        <Mini label="cons" value={`${result.consistency}%`} />
        <Mini label="correct" value={String(result.chars.correct)} />
        <Mini label="errors" value={String(result.chars.incorrect)} />
        <Mini label="extra" value={String(result.chars.extra)} />
        <Mini label="missed" value={String(result.chars.missed)} />
      </div>

      {/* Next test */}
      <div className="flex items-center justify-between gap-3">
        {showLoginHint ? (
          <p className="text-muted-foreground flex items-center gap-1 text-xs">
            <Button
              variant="link"
              size="sm"
              render={<Link href="/login" />}
              className="h-auto p-0 text-xs"
            >
              sign in
            </Button>
            to save your result
          </p>
        ) : (
          // Reserve the space so "next test" stays right-aligned either way
          <span aria-hidden="true" />
        )}
        <Button size="default" onClick={onNext} className="gap-2">
          <IconPlayerSkipForward /> next test{" "}
          <Kbd className="ml-1 border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground">
            tab
          </Kbd>
        </Button>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <Card size="sm" className="items-center rounded-2xl py-2 text-center">
      <CardContent className="flex flex-col gap-0.5 px-2">
        <div className="font-semibold tabular-nums">{value}</div>
        <div className="text-muted-foreground text-[10px] tracking-wider">{label}</div>
      </CardContent>
    </Card>
  );
}
