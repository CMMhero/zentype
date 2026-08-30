"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Wraps page content and triggers a fade+slide animation on route change.
 * Uses the View Transitions API when available (Chrome, Edge, Safari 18+)
 * with a CSS animation fallback for Firefox and older browsers.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;

    const el = containerRef.current;
    if (!el) return;

    // View Transitions API (Chrome/Edge/Safari 18+)
    if ("startViewTransition" in document) {
      (document as any).startViewTransition(() => {
        el.classList.remove("zt-page-enter");
        // Force reflow
        void el.offsetHeight;
        el.classList.add("zt-page-enter");
      });
    } else {
      // CSS fallback
      el.classList.remove("zt-page-enter");
      void el.offsetHeight;
      el.classList.add("zt-page-enter");
    }
  }, [pathname]);

  return (
    <div ref={containerRef} className="zt-page-enter">
      {children}
    </div>
  );
}
