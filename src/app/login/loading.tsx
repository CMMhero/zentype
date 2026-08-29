import { Skeleton } from "~/components/ui/skeleton";

export default function LoginLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
      <Skeleton className="h-8 w-48" />
      <div className="flex w-full max-w-sm flex-col gap-3">
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
    </div>
  );
}
