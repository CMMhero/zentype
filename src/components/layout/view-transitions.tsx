"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Triggers the View Transitions API on route change.
 * Browsers that don't support it (Firefox as of 2026) simply get no animation.
 */
export function ViewTransitions() {
  const pathname = usePathname();
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;

    if (!document.startViewTransition) return;

    // Tell the browser to snapshot the current state, then paint the new state
    document.startViewTransition(() => {
      // The DOM has already updated by the time this runs in Next.js client nav.
      // We just need to signal that the transition should proceed.
    });
  }, [pathname]);

  return null;
}
