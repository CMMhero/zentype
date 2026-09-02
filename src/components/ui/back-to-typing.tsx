import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";

import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"

/**
 * Standardized "back to typing" link used across secondary pages.
 */
function BackToTyping({ className }: { className?: string }) {
  return (
    <Button variant="link" size="sm" asChild className={cn("h-auto gap-1 p-0 text-xs", className)}>
      <Link href="/">
        <IconArrowLeft className="size-3" /> back to typing
      </Link>
    </Button>
  )
}

export { BackToTyping }