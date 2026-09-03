import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

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
  );
}

export { BackToTyping };
