import { IconRefresh } from "@tabler/icons-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { WpmChart } from "~/components/charts/wpm-chart";
import { Kbd } from "~/components/ui/kbd";
import { modeLabel, type TestResult } from "~/lib/types";

export type SaveState = "cloud" | "guest" | "failed" | "skipped";

interface ResultViewProps {
  result: TestResult;
  saveState: SaveState;
  onNext: () => void;
}

export function ResultView({ result, saveState, onNext }: ResultViewProps) {
  return (
    <div className="zt-fade-in mx-auto flex w-full max-w-4xl flex-col gap-6 py-6" role="region" aria-label="Test results">
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-8">
          <div>
            <div className="text-muted-foreground text-xs font-bold tracking-widest uppercase">wpm</div>
            <div className="text-primary text-7xl leading-none font-bold tabular-nums">
              {result.wpm}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs font-bold tracking-widest uppercase">accuracy</div>
            <div className="text-7xl leading-none font-bold tabular-nums">
              {result.accuracy}%
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge variant={saveState === "cloud" ? "default" : "secondary"} className="text-[10px]">
            {saveState === "cloud"
              ? "synced to account"
              : saveState === "guest"
                ? "saved locally (guest)"
                : saveState === "failed"
                  ? "sync failed — kept locally"
                  : "not saved"}
          </Badge>
          <span className="text-muted-foreground font-mono text-xs">
            {modeLabel(result)} · {result.source}
          </span>
        </div>
      </div>

      <Card className="gap-2 py-4">
        <CardHeader className="px-4">
          <CardTitle className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
            performance over time
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <WpmChart timeline={result.timeline} />
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardContent className="grid grid-cols-3 gap-y-4 px-4 sm:grid-cols-6">
          <Stat label="raw" value={String(result.rawWpm)} />
          <Stat label="consistency" value={`${result.consistency}%`} />
          <Stat label="correct" value={String(result.chars.correct)} className="text-chart-3" />
          <Stat label="incorrect" value={String(result.chars.incorrect)} className="text-destructive" />
          <Stat label="extra" value={String(result.chars.extra)} className="text-muted-foreground" />
          <Stat label="missed" value={String(result.chars.missed)} className="text-muted-foreground" />
        </CardContent>
      </Card>

      <div className="flex items-center justify-end">
        <Button size="lg" onClick={onNext} className="gap-2.5">
          <IconRefresh /> next test{" "}
          <Kbd className="ml-1 border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground">
            tab
          </Kbd>
        </Button>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 text-center">
      <span className={`text-xl font-semibold tabular-nums ${className ?? ""}`}>{value}</span>
      <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
        {label}
      </span>
    </div>
  );
}
