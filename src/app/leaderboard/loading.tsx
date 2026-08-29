import { Skeleton } from "~/components/ui/skeleton";
import { LeaderboardSkeleton } from "~/components/leaderboard-skeleton";

export default function LeaderboardLoading() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-28" />
        </div>
        <Skeleton className="h-9 w-36 rounded-md" />
      </header>
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-28 rounded-md" />
        <Skeleton className="h-9 w-20 rounded-md" />
      </div>
      <LeaderboardSkeleton />
    </div>
  );
}
