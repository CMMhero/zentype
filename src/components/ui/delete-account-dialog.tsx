"use client";

import { useRouter } from "next/navigation";
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
import { deleteAccount } from "~/server/results";
import { useResultsStore } from "~/stores/results-store";

const CONFIRM_PHRASE = "yes, delete my account";

/** Type-confirm account deletion. Deletes the account, then returns home. */
export function DeleteAccountDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { refresh: refreshUser } = useAuth();
  const clearLocal = useResultsStore((s) => s.clearLocal);
  const [value, setValue] = useState("");
  const [deleting, setDeleting] = useState(false);

  const confirmed = value.trim().toLowerCase() === CONFIRM_PHRASE;

  async function handleDelete() {
    if (!confirmed || deleting) return;
    setDeleting(true);
    try {
      const res = await deleteAccount();
      if (!res.ok) {
        toast.error(res.error ?? "account deletion failed");
        return;
      }
      // Sign-out already happened server-side; drop the client-side user so
      // the header switches back to the signed-out state without a reload.
      await refreshUser();
      clearLocal();
      onOpenChange(false);
      toast.success("account deleted");
      router.push("/");
    } catch {
      toast.error("account deletion failed");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!deleting) onOpenChange(v);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>delete my account?</AlertDialogTitle>
          <AlertDialogDescription>
            this permanently deletes your profile, all test results, xp, achievements, and settings.
            this cannot be undone. if you want to keep your data, export json first.
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
            disabled={deleting}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>cancel</AlertDialogCancel>
          <Button variant="destructive" disabled={!confirmed || deleting} onClick={handleDelete}>
            {deleting ? "deleting…" : "delete my account"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
