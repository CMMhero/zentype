"use client";

import Link from "next/link";
import { IconArrowLeft, IconKeyboardFilled } from "@tabler/icons-react";
import { Button } from "~/components/ui/button";

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
          <h1 className="text-xl font-semibold tracking-tight">
            page not found
          </h1>
          <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
            looks like this page doesn&apos;t exist. maybe it moved, or maybe it was never here.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-4">
          <Button asChild size="sm" className="gap-2">
            <Link href="/">
              <IconKeyboardFilled className="size-4" /> start typing
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1.5 text-xs" onClick={() => history.back()}>
            <IconArrowLeft className="size-3" /> go back
          </Button>
        </div>
      </div>
    </div>
  );
}
