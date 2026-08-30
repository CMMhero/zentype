import { Skeleton } from "~/components/ui/skeleton";
import { Card, CardContent } from "~/components/ui/card";

export default function AboutLoading() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-8">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-full max-w-2xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5 space-y-3">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
