"use client";

import { useState } from "react";
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
import { Input } from "~/components/ui/input";
import { useAuth } from "~/components/user-provider";
import { invalidateProfileCaches } from "~/lib/profile-cache";
import { resetAccount } from "~/server/results";
import { useResultsStore } from "~/stores/results-store";
import { useSettingsStore } from "~/stores/settings-store";

const CONFIRM_PHRASE = "yes, reset my account";

/**
 * Type-confirm account data reset. Deletes every stored record (results, xp,
 * achievements, settings) but keeps the account, then restores local defaults
 * so the user is signed in with a brand-new account state.
 */
export function ResetAccountDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const resetSettings = useSettingsStore((s) => s.reset);
  const clearLocal = useResultsStore((s) => s.clearLocal);
  const [value, setValue] = useState("");
  const [resetting, setResetting] = useState(false);

  const confirmed = value.trim().toLowerCase() === CONFIRM_PHRASE;

  async function handleReset() {
    if (!confirmed || resetting || !user) return;
    setResetting(true);
    try {
      const res = await resetAccount();
      if (!res.ok) {
        toast.error(res.error ?? "account reset failed");
        return;
      }
      // Drop cached stats/ranks and restore local defaults so the account
      // behaves like a brand-new one without a reload.
      invalidateProfileCaches(user.id, user.username);
      resetSettings();
      clearLocal();
      onOpenChange(false);
      toast.success("account reset");
    } catch {
      toast.error("account reset failed");
    } finally {
      setResetting(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!resetting) onOpenChange(v);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>reset account?</AlertDialogTitle>
          <AlertDialogDescription>
            clears your test results, xp, achievements, and settings. your account stays, so you can
            keep typing right away. this wipes your history with no undo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs">
            type <span className="text-foreground font-semibold">{CONFIRM_PHRASE}</span> to confirm
          </p>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={CONFIRM_PHRASE}
            autoFocus
            className="text-center"
            aria-label={`type ${CONFIRM_PHRASE} to confirm`}
            disabled={resetting}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={resetting}>cancel</AlertDialogCancel>
          <Button variant="destructive" disabled={!confirmed || resetting} onClick={handleReset}>
            {resetting ? "resetting…" : "reset account"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
