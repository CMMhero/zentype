import { IconPlayerSkipForward, IconAt, IconHash, IconCrown } from "@tabler/icons-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { WpmChart } from "~/components/charts/wpm-chart";
import { Kbd } from "~/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { modeLabel, type TestResult } from "~/lib/types";

export type SaveState = "cloud" | "guest" | "failed" | "skipped";

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
              <span className="inline-flex items-center gap-0.5 rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-primary">
                <IconCrown className="size-3" /> PB
              </span>
            )}
          </span>
          <span className="text-muted-foreground mt-1.5 text-xs tracking-wider">wpm</span>
        </div>
        <div className="flex flex-col">
          <span className="text-4xl leading-none font-bold tabular-nums sm:text-5xl">{result.accuracy}%</span>
          <span className="text-muted-foreground mt-1.5 text-xs tracking-wider">acc</span>
        </div>
      </div>

      {/* Meta — mode, punctuation, numbers badges */}
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-[10px] font-medium normal-case">
          {modeLabel(result)}
        </Badge>
        {result.punctuation && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="gap-1 px-1.5 text-[10px]">
                <IconAt className="size-3" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>punctuation</TooltipContent>
          </Tooltip>
        )}
        {result.numbers && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="gap-1 px-1.5 text-[10px]">
                <IconHash className="size-3" />
              </Badge>
            </TooltipTrigger>
            <TooltipContent>numbers</TooltipContent>
          </Tooltip>
        )}
        <Badge variant={variant} className="text-[9px]">{label}</Badge>
      </p>

      {/* Chart — identical to history detail (no wrapper) */}
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
