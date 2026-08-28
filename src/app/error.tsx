"use client";

import { IconAlertTriangle, IconRefresh, IconArrowLeft } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="relative flex flex-col items-center gap-8 text-center">
        {/* Decorative gradient orb */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2">
          <div className="size-48 rounded-full bg-destructive/5 blur-3xl" />
        </div>

        {/* Large error code */}
        <div className="relative">
          <span className="text-[120px] font-bold leading-none tracking-tighter text-destructive/10 select-none">
            500
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-destructive/10 flex size-16 items-center justify-center rounded-2xl border border-destructive/20 backdrop-blur-sm">
              <IconAlertTriangle className="text-destructive size-8" />
            </div>
          </div>
        </div>

        {/* Text content */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">
            something broke
          </h1>
          <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
            {error.message || "an unexpected error occurred. try refreshing or heading back."}
          </p>
          {error.digest && (
            <p className="text-muted-foreground/50 font-mono text-xs">
              {error.digest}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-4">
          <Button size="sm" className="gap-2" onClick={reset}>
            <IconRefresh className="size-4" /> try again
          </Button>
          <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs transition-colors">
            <IconArrowLeft className="size-3" /> go back
          </button>
        </div>
      </div>
    </div>
  );
}
