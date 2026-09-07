import { IconAt, IconCrown, IconHash } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { modeLabel, type TestResult } from "~/lib/types";
import { cn, formatResultDateTime } from "~/lib/utils";

/**
 * The shared stat body shown after a test (result view) and when opening a
 * test from the profile history (detail dialog): wpm/acc headline with the PB
 * badge, mode/punctuation/numbers badges with the timestamp on the right, the
 * caller-supplied chart, and the six mini stat tiles.
 *
 * Consumers provide their own chart so each page keeps its own lazy-loading of
 * the recharts chunk. Renders a fragment — the parent supplies the column gap.
 */
export function ResultDetails({
  result,
  isPB,
  compact = false,
  chart,
}: {
  result: TestResult;
  isPB?: boolean;
  /** Smaller stat numbers and tighter header gaps for dialogs/sheets. */
  compact?: boolean;
  /** Chart node rendered between the badge row and the mini grid. */
  chart: ReactNode;
}) {
  return (
    <>
      {/* Stat header — wpm and acc (labels below numbers), no separator */}
      <div className={cn("flex items-end", compact ? "gap-4 sm:gap-8" : "gap-6 sm:gap-8")}>
        <div className="flex flex-col">
          <span className="flex items-center gap-2">
            <span
              className={cn(
                "leading-none font-bold tabular-nums text-primary",
                compact ? "text-3xl sm:text-5xl" : "text-4xl sm:text-5xl",
              )}
            >
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
          <span
            className={cn(
              "leading-none font-bold tabular-nums",
              compact ? "text-3xl sm:text-5xl" : "text-4xl sm:text-5xl",
            )}
          >
            {result.accuracy}%
          </span>
          <span className="text-muted-foreground mt-1.5 text-xs tracking-wider">acc</span>
        </div>
      </div>

      {/* Meta — mode, punctuation, numbers badges; date on the right */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
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
        </p>
        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
          {formatResultDateTime(result.createdAt)}
        </span>
      </div>

      {/* Chart lives with the consumer so each page can lazy-load recharts */}
      {chart}

      {/* Mini stat grid */}
      <div className="grid grid-cols-3 gap-3 text-center sm:grid-cols-6">
        <Mini label="raw" value={String(result.rawWpm)} />
        <Mini label="cons" value={`${result.consistency}%`} />
        {result.chars ? (
          <>
            <Mini label="correct" value={String(result.chars.correct)} />
            <Mini label="errors" value={String(result.chars.incorrect)} />
            <Mini label="extra" value={String(result.chars.extra)} />
            <Mini label="missed" value={String(result.chars.missed)} />
          </>
        ) : (
          <>
            {/* Lite history rows lack the char breakdown until details load */}
            <MiniSkeleton label="correct" />
            <MiniSkeleton label="errors" />
            <MiniSkeleton label="extra" />
            <MiniSkeleton label="missed" />
          </>
        )}
      </div>
    </>
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

function MiniSkeleton({ label }: { label: string }) {
  return (
    <Card size="sm" className="items-center rounded-2xl py-2 text-center">
      <CardContent className="flex flex-col gap-0.5 px-2">
        <Skeleton className="mx-auto mb-1 h-4 w-8" />
        <div className="text-muted-foreground text-[10px] tracking-wider">{label}</div>
      </CardContent>
    </Card>
  );
}
