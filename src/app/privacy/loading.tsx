import { IconLockFilled } from "@tabler/icons-react";
import { Skeleton } from "~/components/ui/skeleton";

export default function PrivacyLoading() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <IconLockFilled className="text-primary size-5" /> privacy policy
        </h1>
      </header>

      <div className="space-y-8">
        <section>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-3/4" />
        </section>

        {Array.from({ length: 7 }).map((_, i) => (
          <section key={i}>
            <Skeleton className="h-5 w-40" />
            <div className="mt-2 space-y-1.5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              {i % 2 === 0 && <Skeleton className="h-4 w-2/3" />}
            </div>
          </section>
        ))}

        <div className="pt-4">
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}
