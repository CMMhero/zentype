"use client";

import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";
import { Button } from "~/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="bg-destructive/10 flex size-14 items-center justify-center rounded-2xl">
          <IconAlertTriangle className="text-destructive size-7" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">something went wrong</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {error.message || "an unexpected error occurred"}
          </p>
        </div>
      </div>
      <Button onClick={reset} size="sm" className="gap-2">
        <IconRefresh className="size-4" /> try again
      </Button>
    </div>
  );
}
