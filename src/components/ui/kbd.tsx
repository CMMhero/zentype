import { cn } from "~/lib/utils";

/** Terminal-style keycap. */
function Kbd({ className, children, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 select-none items-center justify-center gap-0.5 rounded-sm border border-border bg-muted px-1 font-mono text-[11px] font-medium text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}

export { Kbd };
