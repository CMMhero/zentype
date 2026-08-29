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

const SHORTCUTS: Array<{ keys: string[]; action: string }> = [
  { keys: ["tab"], action: "restart test" },
  { keys: ["ctrl", "k"], action: "command palette" },
  { keys: ["?"], action: "this help dialog" },
  { keys: ["esc"], action: "close dialogs / pause focus" },
  { keys: ["alt", "1..4"], action: "test · leaderboard · profile · settings" },
  { keys: ["backspace"], action: "fix current word" },
];

export function HelpDialog() {
  const open = useUiStore((s) => s.helpOpen);
  const setOpen = useUiStore((s) => s.setHelpOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Navigate and control tests.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1">
          {SHORTCUTS.map((s, i) => (
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
              {i < SHORTCUTS.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
