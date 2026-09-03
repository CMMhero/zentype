import { Skeleton } from "~/components/ui/skeleton";

export function LeaderboardSkeleton() {
  return (
    <div className="bg-card w-full rounded-2xl border shadow-sm">
      <div className="divide-border divide-y">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 px-4 py-2">
            <div className="flex w-12 items-center gap-1">
              <Skeleton className="h-4 w-4" />
              {i < 3 && <Skeleton className="h-5 w-5 rounded-full" />}
            </div>
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="size-3.5 rounded-full" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3 border-t px-4 py-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-8 w-16 rounded-3xl" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="size-9 rounded-2xl" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="size-9 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
