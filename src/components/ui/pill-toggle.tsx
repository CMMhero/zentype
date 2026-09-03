"use client";

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";

import { cn } from "~/lib/utils";

function PillGroup({ className, ...props }: ToggleGroupPrimitive.Props) {
  return (
    <ToggleGroupPrimitive
      data-slot="pill-group"
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center gap-1 rounded-3xl p-[3px]",
        className,
      )}
      {...props}
    />
  );
}

function PillButton({ className, children, ...props }: TogglePrimitive.Props & { value: string }) {
  return (
    <TogglePrimitive
      data-slot="pill-button"
      className={cn(
        "inline-flex h-full min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-2.5 text-sm font-medium whitespace-nowrap transition-[color,box-shadow,background-color] outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 text-muted-foreground hover:text-foreground aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
    </TogglePrimitive>
  );
}

export { PillButton, PillGroup };
