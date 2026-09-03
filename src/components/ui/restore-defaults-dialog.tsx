"use client";

import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { useSettingsStore } from "~/stores/settings-store";

/** Alert-dialog confirm for resetting all settings to defaults. */
export function RestoreDefaultsDialog({
  open,
  onOpenChange,
  onConfirmed,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after settings are reset (e.g. to close the command palette). */
  onConfirmed?: () => void;
}) {
  const reset = useSettingsStore((s) => s.reset);

  function handleRestore() {
    reset();
    onOpenChange(false);
    onConfirmed?.();
    toast.info("settings restored to defaults");
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>restore all settings to defaults?</AlertDialogTitle>
          <AlertDialogDescription>
            resets your theme, font, sound, and gameplay settings back to their defaults. this
            can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>cancel</AlertDialogCancel>
          <Button variant="secondary" onClick={handleRestore}>
            yes, restore
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
