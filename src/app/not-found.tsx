"use client";

import { BackToTyping } from "~/components/ui/back-to-typing";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="relative flex flex-col items-center gap-8 text-center">
        {/* Decorative gradient orb */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2">
          <div className="size-48 rounded-full bg-primary/5 blur-3xl" />
        </div>

        {/* Large 404 */}
        <span className="text-[140px] font-bold leading-none tracking-tighter text-primary/10 select-none">
          404
        </span>

        {/* Text content */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">page not found</h1>
          <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
            looks like this page doesn&apos;t exist. maybe it moved, or maybe it was never here.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-4">
          <BackToTyping />
        </div>
      </div>
    </div>
  );
}
