import Link from "next/link";
import { IconKeyboardFilled } from "@tabler/icons-react";
import { Button } from "~/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="bg-primary/10 flex size-14 items-center justify-center rounded-2xl">
          <IconKeyboardFilled className="text-primary size-7" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">page not found</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            this page doesn't exist. head back to start typing.
          </p>
        </div>
      </div>
      <Button asChild size="sm" className="gap-2">
        <Link href="/">
          <IconKeyboardFilled className="size-4" /> start typing
        </Link>
      </Button>
    </div>
  );
}
