"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUiStore } from "~/stores/ui-store";
import { isTypingTarget } from "~/lib/keyboard";

export function useGlobalHotkeys() {
  const router = useRouter();
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);
  const setHelpOpen = useUiStore((s) => s.setHelpOpen);

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
        const routes = ["/", "/leaderboard", "/profile", "/history", "/settings"];
        const idx = Number(e.key);
        if (idx >= 1 && idx <= routes.length) {
          e.preventDefault();
          router.push(routes[idx - 1]);
          return;
        }
      }

      if (typing || e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "?") {
        e.preventDefault();
        setHelpOpen(true);
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router, setPaletteOpen, setHelpOpen]);
}
