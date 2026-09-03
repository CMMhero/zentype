import { cn } from "~/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-2xl bg-muted", className)}
      {...props}
    />
  );
}

/**
 * Button-shaped placeholder matching Button (outline, sm): icon + label bar.
 * Pass a width via className (e.g. "w-32").
 */
function ButtonSkeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <Skeleton
      className={cn("flex h-8 shrink-0 items-center gap-2 rounded-4xl px-3", className)}
      {...props}
    >
      <span className="size-3.5 shrink-0 rounded bg-muted-foreground/15" />
      <span className="h-2 min-w-8 flex-1 rounded bg-muted-foreground/15" />
    </Skeleton>
  );
}

/**
 * Select-trigger-shaped placeholder matching SelectTrigger (sm): value bar +
 * chevron. Pass a width via className (e.g. "w-36").
 */
function SelectSkeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <Skeleton
      className={cn(
        "flex h-7 shrink-0 items-center justify-between gap-1.5 rounded-3xl px-3",
        className,
      )}
      {...props}
    >
      <span className="h-2 w-14 rounded bg-muted-foreground/15" />
      <span className="size-4 shrink-0 rounded bg-muted-foreground/15" />
    </Skeleton>
  );
}

export { ButtonSkeleton, SelectSkeleton, Skeleton };
