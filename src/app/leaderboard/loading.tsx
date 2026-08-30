import { Skeleton } from "~/components/ui/skeleton";
import { IconTrophyFilled, IconTrophy, IconBolt } from "@tabler/icons-react";

export default function LeaderboardLoading() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      {/* Header — static */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <IconTrophyFilled className="text-primary size-5" />
          leaderboard
        </h1>
        <div className="flex items-center gap-2">
          <div className="bg-muted/50 flex gap-1 rounded-lg p-1">
            <span className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium">
              <IconTrophy className="size-3.5" /> wpm
            </span>
            <span className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground">
              <IconBolt className="size-3.5" /> level
            </span>
          </div>
        </div>
      </header>

      {/* Filters — static */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
        <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>

      {/* Leaderboard rows — the dynamic part */}
      <div className="flex flex-col gap-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border border-border/30 px-4 py-3">
            <Skeleton className="h-5 w-8 shrink-0" />
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <Skeleton className="h-4 w-28 shrink-0" />
            <div className="flex-1" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
