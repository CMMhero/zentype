"use client";

import {
  IconCopy,
  IconDownload,
  IconKeyboardFilled,
  IconPlayerSkipForward,
} from "@tabler/icons-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ResultDetails } from "~/components/typing/result-details";
import { Button } from "~/components/ui/button";
import { Kbd } from "~/components/ui/kbd";
import { Skeleton } from "~/components/ui/skeleton";
import { copyResultImage, createResultImage, downloadResultImage } from "~/lib/share-image";
import type { SessionUser, TestResult } from "~/lib/types";

// Non-compact WpmChart renders at h-56 — the loader skeleton must match so
// the layout doesn't jump when the lazy chunk finishes loading.
const WpmChart = dynamic(() => import("~/components/charts/wpm-chart").then((m) => m.WpmChart), {
  ssr: false,
  loading: () => <Skeleton className="h-56 w-full" />,
});

export type SaveState = "cloud" | "guest" | "failed" | "skipped" | "invalid";

interface ResultViewProps {
  result: TestResult;
  saveState: SaveState;
  isPB?: boolean;
  /** Signed-in user, when present. Guests get a sign-in hint instead. */
  user?: SessionUser | null;
  onNext: () => void;
}

export function ResultView({ result, saveState, isPB, user, onNext }: ResultViewProps) {
  // Guests who aren't saving to the cloud get a hint to sign in and keep
  // their history. (A "failed" state with a signed-in user is transient.)
  const showLoginHint = !user && (saveState === "guest" || saveState === "failed");
  // Which export is running. While either runs, the action buttons are swapped
  // for share branding (zentype wordmark + username) so the captured image
  // matches the live result view minus the interactive controls.
  const [busy, setBusy] = useState<"copy" | "download" | null>(null);
  const capturing = busy !== null;
  const cardRef = useRef<HTMLDivElement>(null);

  async function exportImage(action: "copy" | "download") {
    if (busy || !cardRef.current) return;
    setBusy(action);
    try {
      // Let React commit the buttons → branding swap and paint before capture.
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const blob = await createResultImage(cardRef.current);
      if (action === "copy") {
        if (await copyResultImage(blob)) {
          toast.success("result image copied to clipboard");
        } else {
          toast.error("image copy isn't supported here — use download instead");
        }
      } else {
        downloadResultImage(blob, result);
        toast.success("result image downloaded");
      }
    } catch (err) {
      console.error("[zentype] export result image failed:", err);
      toast.error("couldn't create the result image");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      ref={cardRef}
      className="zt-fade-in mx-auto flex w-full max-w-4xl flex-col gap-6 py-6"
      role="region"
      aria-label="Test results"
    >
      {/* Shared stat body — header, badges + date, chart, mini grid. The chart
          stays lazy so recharts isn't in the initial test-page bundle. */}
      <ResultDetails result={result} isPB={isPB} chart={<WpmChart timeline={result.timeline} />} />

      {/* Next test */}
      <div className="flex items-center justify-between gap-3">
        {showLoginHint && !capturing ? (
          <p className="text-muted-foreground flex items-center gap-1 text-xs">
            <Button
              variant="link"
              size="sm"
              render={<Link href="/login" />}
              className="h-auto p-0 text-xs"
            >
              sign in
            </Button>
            to save your result
          </p>
        ) : (
          // Reserve the space so the action row stays right-aligned either way
          <span aria-hidden="true" />
        )}
        {capturing ? (
          // Share branding — takes the buttons' spot while the image is taken
          <div className="flex h-9 items-center gap-2 whitespace-nowrap" aria-hidden="true">
            <span className="flex items-center gap-1.5">
              <IconKeyboardFilled className="text-primary size-4" />
              <span className="text-sm font-semibold tracking-tight">zentype</span>
            </span>
            {user && (
              <>
                <span className="text-muted-foreground" aria-hidden="true">
                  ·
                </span>
                <span className="text-sm font-semibold">{user.username}</span>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => void exportImage("copy")}
              disabled={busy !== null}
              aria-label="copy the result image to the clipboard"
            >
              <IconCopy /> {busy === "copy" ? "copying…" : "copy image"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => void exportImage("download")}
              disabled={busy !== null}
              aria-label="download the result image"
            >
              <IconDownload /> {busy === "download" ? "downloading…" : "download image"}
            </Button>
            <Button size="default" onClick={onNext} className="gap-2">
              <IconPlayerSkipForward /> next test{" "}
              <Kbd className="ml-1 border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground">
                tab
              </Kbd>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
