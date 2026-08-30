import { Skeleton } from "~/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center px-4 py-6 md:py-6">
      {/* Config bar — static skeleton matching ConfigBar layout */}
      <div className="mb-4 flex w-full items-center gap-2 pb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-14 rounded-md" />
        ))}
      </div>

      {/* Live stats bar skeleton */}
      <div className="mb-4 flex w-full items-end justify-between">
        <div className="flex items-baseline gap-3 sm:gap-5">
          <div>
            <Skeleton className="h-8 w-16" />
          </div>
          <div>
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
        <div>
          <Skeleton className="h-8 w-12" />
        </div>
      </div>

      {/* Progress bar skeleton */}
      <Skeleton className="mb-3 h-1.5 w-full rounded-full" />

      {/* Typing area — the dynamic part that loads words */}
      <div className="relative w-full p-4">
        <div className="flex flex-col gap-3 py-2">
          <Skeleton className="h-7 w-4/5" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-3/5" />
        </div>
      </div>
    </div>
  );
}
