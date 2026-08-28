"use client";

import Link from "next/link";
import { IconArrowLeft, IconKeyboardFilled } from "@tabler/icons-react";
import { Button } from "~/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16">
      <div className="relative flex flex-col items-center gap-8 text-center">
        {/* Decorative gradient orb */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2">
          <div className="size-48 rounded-full bg-primary/5 blur-3xl" />
        </div>

        {/* Large 404 */}
        <div className="relative">
          <span className="text-[140px] font-bold leading-none tracking-tighter text-primary/10 select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-primary/10 flex size-16 items-center justify-center rounded-2xl border border-primary/20 backdrop-blur-sm">
              <IconKeyboardFilled className="text-primary size-8" />
            </div>
          </div>
        </div>

        {/* Text content */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">
            page not found
          </h1>
          <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
            looks like this page doesn&apos;t exist. maybe it moved, or maybe it was never here.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => history.back()}>
            <IconArrowLeft className="size-4" /> go back
          </Button>
          <Button asChild size="sm" className="gap-2">
            <Link href="/">
              <IconKeyboardFilled className="size-4" /> start typing
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
