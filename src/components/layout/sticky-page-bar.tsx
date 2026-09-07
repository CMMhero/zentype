import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

/**
 * Sticky sub-header bar that keeps the page title row (and any tabs/filters)
 * reachable while scrolling.
 *
 * - Content stays aligned with the page column (max-w-4xl + px-4).
 * - The background spans the page container with a small overhang on each
 *   side, so component edges/borders/shadows never collide with the bar.
 * - It reuses the page's fixed gradient (.zt-page-bg), so the gradient
 *   continues seamlessly instead of standing out as a solid block.
 * - The bar pins at the exact spot it occupies at the top of the page
 *   (navbar h-12 + py-8), and the background extends up over the top gap
 *   (to just below the navbar). Because the background is the same fixed
 *   gradient as the page, this is invisible at the top of the page yet
 *   keeps the gap covered while scrolling.
 */
export function StickyPageBar({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("pt-1 pb-3", className)}>
      {/* Background layer: page-container width plus a bit of overhang on each
          side, reusing the page's fixed gradient. -top-8 extends it over the
          page's py-8 gap so it reaches just below the navbar. */}
      <div aria-hidden className="zt-page-bg absolute -top-8 bottom-0 -inset-x-6 -z-10" />
      {children}
    </div>
  );
}