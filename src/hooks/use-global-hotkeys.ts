"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUiStore } from "~/stores/ui-store";
import { isTypingTarget } from "~/lib/keyboard";

export function useGlobalHotkeys() {
  const router = useRouter();
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);
  const setHelpOpen = useUiStore((s) => s.setHelpOpen);
  const isTestRunning = useUiStore((s) => s.isTestRunning);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }

      const typing = isTypingTarget(e.target);

      if (e.key === "Tab" && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("zt:restart"));
        return;
      }

      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const routes = ["/", "/leaderboard", "/profile", "/settings"];
        const idx = Number(e.key);
        if (idx >= 1 && idx <= routes.length) {
          e.preventDefault();
          setPaletteOpen(false);
          router.push(routes[idx - 1]);
          return;
        }
      }

      if (typing || e.ctrlKey || e.metaKey || e.altKey) return;

      // Don't open help dialog while a test is active (prevents ? from stealing input)
      if (e.key === "?" && !isTestRunning) {
        e.preventDefault();
        setHelpOpen(true);
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router, setPaletteOpen, setHelpOpen, isTestRunning]);
}
