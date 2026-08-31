import { Skeleton } from "~/components/ui/skeleton";
import { IconClock, IconTypography, IconAt, IconHash } from "@tabler/icons-react";
import { PillGroup, PillButton } from "~/components/ui/pill-toggle";

export default function HomeLoading() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center px-4 py-6 md:py-6">
      {/* ConfigBar wrapper — matches real page pb-4 + transition */}
      <div className="pb-4 transition-all duration-200 opacity-100">
      <div className="mx-auto flex w-fit flex-wrap items-center justify-center gap-2 text-sm sm:gap-3">
        <div className="grid w-full grid-cols-[3fr_7fr] gap-2 sm:w-fit sm:grid-cols-none sm:flex sm:gap-2">
          {/* Mode selector */}
          <PillGroup>
            <PillButton active>
              <IconClock className="size-3.5" /> time
            </PillButton>
            <PillButton active={false}>
              <IconTypography className="size-3.5" /> words
            </PillButton>
          </PillGroup>

          {/* Variant selector */}
          <PillGroup className="w-full min-w-0 overflow-hidden sm:w-64">
            {[15, 30, 60, 120].map((t) => (
              <PillButton key={t} active={t === 30}>{t}s</PillButton>
            ))}
          </PillGroup>
        </div>

        {/* Punctuation & numbers */}
        <PillGroup>
          <PillButton active={false}>
            <IconAt className="size-3.5" /> punct
          </PillButton>
          <PillButton active={false}>
            <IconHash className="size-3.5" /> nums
          </PillButton>
        </PillGroup>
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

      {/* Progress bar — at 0%, matches Progress component bg-secondary */}
      <div className="mb-3 bg-secondary relative h-1.5 w-full overflow-hidden rounded-full">
        <div className="bg-primary h-full w-full flex-1 transition-all" style={{ transform: 'translateX(-100%)' }} />
      </div>

      {/* Typing area — skeleton for words (the dynamic part) */}
      <div className="relative w-full p-4">
        <div className="flex flex-col gap-3 py-2">
          <Skeleton className="h-7 w-4/5" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-3/5" />
        </div>
      </div>

      {/* Keybinds hint — static */}
      <div className="mt-auto flex flex-col items-center gap-1.5 pt-4 text-center text-xs text-muted-foreground">
        <p>press any key to start</p>
      </div>
    </div>
  );
}
