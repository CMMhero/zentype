import { cn } from "~/lib/utils";

const ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"],
  ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
];

export function VirtualKeyboard({ activeKey }: { activeKey: string | null }) {
  const isActive = (k: string) =>
    activeKey === k || (k === "space" && activeKey === " ");

  return (
    <div
      className="mx-auto -mt-1 flex w-fit select-none flex-col items-center gap-1 scale-75 sm:scale-100 origin-top"
      aria-hidden
    >
      {ROWS.map((row, i) => (
        <div key={i} className="flex gap-1 sm:gap-1.5" style={{ paddingLeft: `${i * 10}px` }}>
          {row.map((key) => (
            <div
              key={key}
              data-active={isActive(key)}
              className={cn(
                "flex size-8 sm:size-9 items-center justify-center rounded border text-xs font-medium transition-all duration-75",
                isActive(key)
                  ? "border-primary bg-primary text-primary-foreground scale-95"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              {key}
            </div>
          ))}
        </div>
      ))}
      <div
        data-active={isActive("space")}
        className={cn(
          "h-8 w-56 sm:h-9 sm:w-64 rounded-md border transition-all duration-75",
          isActive("space")
            ? "border-primary bg-primary scale-x-[0.98]"
            : "border-border bg-card",
        )}
      />
    </div>
  );
}
