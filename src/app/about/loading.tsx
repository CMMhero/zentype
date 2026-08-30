import { Skeleton } from "~/components/ui/skeleton";
import { IconInfoCircleFilled, IconKeyboardFilled } from "@tabler/icons-react";

export default function AboutLoading() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <IconInfoCircleFilled className="text-primary size-5" /> about zentype
        </h1>
      </header>

      <div className="space-y-8">
        <section>
          <h2 className="text-base font-semibold">what is <IconKeyboardFilled className="text-primary size-4 inline" /> zentype?</h2>
          <div className="mt-2 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold">community stats</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border/30 bg-card p-3 text-center">
                <Skeleton className="mx-auto h-7 w-16" />
                <Skeleton className="mx-auto mt-1 h-3 w-12" />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold">features</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border/30 bg-card p-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-5" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="mt-2 space-y-1.5">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold">credits</h2>
          <div className="mt-2 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </section>

        <div className="pt-4">
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}
