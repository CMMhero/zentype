import { useEffect, useRef } from "react";

const ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"],
  ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
];

const ALL_KEYS = new Set([
  ...ROWS.flat(),
  " ",
]);

export function VirtualKeyboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<string | null>(null);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const key = e.key === " " ? " " : e.key.toLowerCase();
      if (!ALL_KEYS.has(key)) return;
      if (activeRef.current === key) return; // already highlighted
      activeRef.current = key;
      const el = containerRef.current?.querySelector<HTMLElement>(`[data-key="${key === " " ? "space" : key}"]`);
      if (el) {
        el.dataset.active = "true";
        el.classList.add("border-primary", "bg-primary", "text-primary-foreground", "scale-95");
        el.classList.remove("border-border", "bg-card", "text-muted-foreground");
      }
    };

    const onUp = (e: KeyboardEvent) => {
      const key = e.key === " " ? " " : e.key.toLowerCase();
      if (activeRef.current !== key) return;
      activeRef.current = null;
      const el = containerRef.current?.querySelector<HTMLElement>(`[data-key="${key === " " ? "space" : key}"]`);
      if (el) {
        el.dataset.active = "false";
        el.classList.remove("border-primary", "bg-primary", "text-primary-foreground", "scale-95");
        el.classList.add("border-border", "bg-card", "text-muted-foreground");
      }
    };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="mx-auto -mt-1 flex w-fit select-none flex-col items-center gap-1 scale-75 sm:scale-100 origin-top"
      aria-hidden
    >
      {ROWS.map((row, i) => (
        <div key={i} className="flex gap-1 sm:gap-1.5" style={{ paddingLeft: `${i * 10}px` }}>
          {row.map((key) => (
            <div
              key={key}
              data-key={key}
              data-active="false"
              className="flex size-8 sm:size-9 items-center justify-center rounded border text-xs font-medium transition-all duration-75 border-border bg-card text-muted-foreground"
            >
              {key}
            </div>
          ))}
        </div>
      ))}
      <div
        data-key="space"
        data-active="false"
        className="h-8 w-56 sm:h-9 sm:w-64 rounded-md border transition-all duration-75 border-border bg-card"
      />
    </div>
  );
}
