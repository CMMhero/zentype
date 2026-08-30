import { Skeleton } from "~/components/ui/skeleton";
import { IconClock, IconTypography, IconAt, IconHash } from "@tabler/icons-react";
import { cn } from "~/lib/utils";

function ConfigButton({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "h-[calc(100%-2px)] flex-1 gap-1.5 rounded-md border border-transparent px-3 text-sm font-medium",
        active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
      )}
    >
      {children}
    </span>
  );
}

export default function HomeLoading() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center px-4 py-6 md:py-6">
      {/* ConfigBar — rendered with default values (time, 30s, no punct, no nums) */}
      <div className="mx-auto flex w-fit flex-wrap items-center justify-center gap-2 pb-4 text-sm sm:gap-3">
        <div className="grid w-full grid-cols-[1fr_2fr] gap-2 sm:w-fit sm:grid-cols-none sm:flex sm:gap-2">
          <div className="bg-muted/80 inline-flex h-9 items-center justify-center gap-1 rounded-lg p-[3px]">
            <ConfigButton active><IconClock className="size-3.5" /> time</ConfigButton>
            <ConfigButton active={false}><IconTypography className="size-3.5" /> words</ConfigButton>
          </div>
          <div className="bg-muted/80 inline-flex h-9 min-w-0 items-center justify-center gap-1 overflow-hidden rounded-lg p-[3px] sm:w-64">
            {[15, 30, 60, 120].map((t) => (
              <ConfigButton key={t} active={t === 30}>{t}s</ConfigButton>
            ))}
          </div>
        </div>
        <div className="bg-muted/80 inline-flex h-9 items-center justify-center gap-1 rounded-lg p-[3px]">
          <ConfigButton active={false}><IconAt className="size-3.5" /> punct</ConfigButton>
          <ConfigButton active={false}><IconHash className="size-3.5" /> nums</ConfigButton>
        </div>
      </div>

      {/* Live stats — default idle values */}
      <div className="mb-4 flex w-full items-end justify-between">
        <div className="flex items-baseline gap-3 sm:gap-5">
          <div>
            <span className="text-primary text-2xl font-bold tabular-nums sm:text-3xl">0</span>
            <span className="text-muted-foreground ml-1 text-xs font-medium">wpm</span>
          </div>
          <div>
            <span className="text-lg font-semibold tabular-nums sm:text-xl">0%</span>
            <span className="text-muted-foreground ml-1 text-xs font-medium">acc</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold tabular-nums">30</span>
          <span className="text-muted-foreground ml-1 text-xs font-medium">s</span>
        </div>
      </div>

      {/* Progress bar — at 0% */}
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-primary/20">
        <div className="h-full w-0 rounded-full bg-primary transition-all" />
      </div>

      {/* Typing area — skeleton for words (the dynamic part) */}
      <div className="relative w-full p-4">
        <div className="flex flex-col gap-3 py-2">
          <Skeleton className="h-7 w-4/5" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-3/5" />
        </div>
      </div>

      {/* Shortcuts hint — static */}
      <div className="mt-auto flex flex-col items-center gap-1.5 pt-4 text-center text-xs text-muted-foreground">
        <p>press any key to start</p>
      </div>
    </div>
  );
}
