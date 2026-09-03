import type { CaretStyle } from "~/lib/types";
import { cn } from "~/lib/utils";

interface CaretProps {
  style: CaretStyle;
  x: number;
  y: number;
  height: number;
  width: number;
  smooth: boolean;
}

export function Caret({ style, x, y, height, width, smooth }: CaretProps) {
  if (style === "off") return null;

  const transition = smooth ? "transition-[left,top] duration-75 ease-out" : "";

  const base: React.CSSProperties = { left: x, top: y };

  switch (style) {
    case "block":
      return (
        <div
          aria-hidden
          className={cn(
            "zt-caret-blink bg-primary/40 pointer-events-none absolute rounded-sm",
            transition,
          )}
          style={{ ...base, height, width }}
        />
      );
    case "underline":
      return (
        <div
          aria-hidden
          className={cn(
            "zt-caret-blink bg-primary pointer-events-none absolute rounded-full",
            transition,
          )}
          style={{ ...base, top: y + height - 3, height: 3, width }}
        />
      );
    default:
      return (
        <div
          aria-hidden
          className={cn(
            "zt-caret-blink bg-primary pointer-events-none absolute w-[3px] rounded-full",
            transition,
          )}
          style={{ ...base, left: x - 1.5, height }}
        />
      );
  }
}
