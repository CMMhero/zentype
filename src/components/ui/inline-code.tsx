import { cn } from "~/lib/utils";

/**
 * Inline code chip for technical tokens in prose (table names, values,
 * shortcuts). Uses the shadcn inline-code style: monospace on a muted chip.
 * Pass text-sm / text-xs to match the surrounding paragraph size.
 */
export function InlineCode({
  className,
  ...props
}: React.ComponentProps<"code">) {
  return (
    <code
      data-slot="inline-code"
      className={cn(
        "relative rounded-md bg-muted px-[0.3rem] py-[0.2rem] font-mono text-[0.9em] font-medium text-foreground",
        className,
      )}
      {...props}
    />
  );
}
