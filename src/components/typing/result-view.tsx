"use client";

import { IconPlayerSkipForward, IconAt, IconHash, IconCrown } from "@tabler/icons-react";
import dynamic from "next/dynamic";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Kbd } from "~/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { modeLabel, type TestResult } from "~/lib/types";

const WpmChart = dynamic(() => import("~/components/charts/wpm-chart").then((m) => m.WpmChart), { ssr: false, loading: () => <Skeleton className="h-40 w-full" /> });

export type SaveState = "cloud" | "guest" | "failed" | "skipped" | "invalid";

interface ResultViewProps {
  result: TestResult;
  saveState: SaveState;
  isPB?: boolean;
  onNext: () => void;
}

const SAVE_BADGE: Record<SaveState, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  cloud: { label: "saved", variant: "default" },
  guest: { label: "guest", variant: "secondary" },
  failed: { label: "sync failed", variant: "destructive" },
  invalid: { label: "invalid", variant: "destructive" },
  skipped: { label: "not saved", variant: "secondary" },
};

export function ResultView({ result, saveState, isPB, onNext }: ResultViewProps) {
  const { label, variant } = SAVE_BADGE[saveState];

  return (
    <div className="zt-fade-in mx-auto flex w-full max-w-4xl flex-col gap-6 py-6" role="region" aria-label="Test results">
      {/* Header — WPM and acc (labels below numbers), no separator */}
      <div className="flex items-end gap-6 sm:gap-8">
        <div className="flex flex-col">
          <span className="flex items-center gap-2">
            <span className="text-primary text-4xl leading-none font-bold tabular-nums sm:text-5xl">{result.wpm}</span>
            {isPB && (
              <span className="inline-flex items-center gap-0.5 rounded bg-secondary px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-secondary-foreground">
                <IconCrown className="size-3" /> PB
              </span>
            )}
          </span>
          <span className="text-muted-foreground mt-1.5 text-xs tracking-wider">wpm</span>
        </div>
        <div className="flex flex-col">
          <span className="text-secondary text-4xl leading-none font-bold tabular-nums sm:text-5xl">{result.accuracy}%</span>
          <span className="text-muted-foreground mt-1.5 text-xs tracking-wider">acc</span>
        </div>
      </div>

      {/* Meta — mode, punctuation, numbers badges */}
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        <Badge variant="outline" className="border-secondary bg-secondary text-secondary-foreground h-5 text-[10px] font-medium normal-case">
          {modeLabel(result)}
        </Badge>
        {result.punctuation && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="border-secondary bg-secondary text-secondary-foreground size-5 p-0 text-[10px] font-medium normal-case">
                <IconAt className="size-3" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>punctuation</TooltipContent>
          </Tooltip>
        )}
        {result.numbers && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="border-secondary bg-secondary text-secondary-foreground size-5 p-0 text-[10px] font-medium normal-case">
                <IconHash className="size-3" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>numbers</TooltipContent>
          </Tooltip>
        )}
        <Badge variant={variant} className="text-[9px]">{label}</Badge>
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
      <div className="flex items-center justify-end">
        <Button size="lg" onClick={onNext} className="gap-2.5">
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
    <div className="border-border/30 bg-card rounded border p-2">
      <div className="font-semibold tabular-nums">{value}</div>
      <div className="text-muted-foreground text-[10px] tracking-wider">{label}</div>
    </div>
  );
}
