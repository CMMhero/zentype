import { Skeleton } from "~/components/ui/skeleton";

export default function LoginLoading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-6">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <Skeleton className="h-5 w-48" />
        <div className="flex flex-col gap-3 w-64">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}
