import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

/**
 * Sticky sub-header bar that keeps the page title row (and any tabs/filters)
 * reachable while scrolling.
 *
 * - Content stays aligned with the page column (max-w-4xl + px-4).
 * - The background spans the page container's padding box exactly (inset-x
 *   matches the page px-4), so component edges/borders/shadows never collide
 *   with the bar — and nothing sticks out past the viewport on mobile, which
 *   would otherwise add a page-level horizontal scroll.
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
    // relative: contains the absolute background layer. Without it the bg
    // positions against the nearest positioned ancestor (or the viewport)
    // and its negative side insets push past the viewport on mobile.
    <div className={cn("relative pt-1 pb-3", className)}>
      {/* Background layer: page-container width plus the page's own padding on
          each side, reusing the page's fixed gradient. -top-8 extends it over
          the page's py-8 gap so it reaches just below the navbar. */}
      <div aria-hidden className="zt-page-bg absolute -top-8 -inset-x-4 bottom-0 -z-10" />
      {children}
    </div>
  );
}
