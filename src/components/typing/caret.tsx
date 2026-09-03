import { cn } from "~/lib/utils";
import type { CaretStyle } from "~/lib/types";

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

  const transition = smooth
    ? "transition-[left,top] duration-75 ease-out"
    : "";

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
          className={cn("zt-caret-blink bg-primary pointer-events-none absolute rounded-full", transition)}
          style={{ ...base, top: y + height - 2, height: 2, width }}
        />
      );
    case "line":
    default:
      return (
        <div
          aria-hidden
          className={cn(
            "zt-caret-blink bg-primary pointer-events-none absolute w-[2px] rounded-full",
            transition,
          )}
          style={{ ...base, left: x - 1, height }}
        />
      );
  }
}
