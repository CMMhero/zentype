import { Skeleton } from "~/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-4 py-8">
      {/* Typing area skeleton */}
      <div className="w-full space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-8 w-5/6" />
      </div>
      {/* Stats bar */}
      <div className="flex items-center gap-6">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-16" />
      </div>
      {/* Config bar */}
      <div className="flex items-center gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-12 rounded-md" />
        ))}
      </div>
    </div>
  );
}
