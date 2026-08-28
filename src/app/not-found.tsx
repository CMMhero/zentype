import Link from "next/link";
import { IconKeyboardFilled } from "@tabler/icons-react";
import { Button } from "~/components/ui/button";
import { VirtualKeyboard } from "~/components/typing/virtual-keyboard";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 px-4 py-16 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="bg-primary/10 flex size-16 items-center justify-center rounded-2xl">
          <IconKeyboardFilled className="text-primary size-8" />
        </div>
        <div>
          <h1 className="text-4xl font-bold tabular-nums">404</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            This page doesn't exist. Start typing to go back.
          </p>
        </div>
      </div>

      <VirtualKeyboard activeKey={null} />

      <Button asChild size="lg">
        <Link href="/">
          <IconKeyboardFilled className="size-4" />
          Start typing
        </Link>
      </Button>
    </div>
  );
}
