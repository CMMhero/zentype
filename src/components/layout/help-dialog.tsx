"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Kbd } from "~/components/ui/kbd";
import { Separator } from "~/components/ui/separator";
import { useUiStore } from "~/stores/ui-store";
import { KEYBINDS } from "~/lib/keybinds";

export function HelpDialog() {
  const open = useUiStore((s) => s.helpOpen);
  const setOpen = useUiStore((s) => s.setHelpOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>keybinds</DialogTitle>
          <DialogDescription>
            navigate and control tests.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1">
          {KEYBINDS.map((s, i) => (
            <div key={i}>
              <div className="flex items-center justify-between py-1.5 text-sm">
                <span className="text-muted-foreground">{s.action}</span>
                <span className="flex items-center gap-1">
                  {s.keys.map((k, j) => (
                    <span key={j} className="flex items-center gap-1">
                      {j > 0 && <span className="text-muted-foreground text-xs">+</span>}
                      <Kbd>{k}</Kbd>
                    </span>
                  ))}
                </span>
              </div>
              {i < KEYBINDS.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
