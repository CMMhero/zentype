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

const ACTIVE_CLASSES = ["bg-primary", "text-primary-foreground", "ring-primary"];
const INACTIVE_CLASSES = ["bg-card", "text-muted-foreground", "ring-foreground/5"];
const HOME_KEYS = new Set(["f", "j"]);

function activateEl(el: HTMLElement | null) {
  if (!el) return;
  el.dataset.active = "true";
  el.classList.add(...ACTIVE_CLASSES);
  el.classList.remove(...INACTIVE_CLASSES);
}

function deactivateEl(el: HTMLElement | null) {
  if (!el) return;
  el.dataset.active = "false";
  el.classList.remove(...ACTIVE_CLASSES);
  el.classList.add(...INACTIVE_CLASSES);
}

function clearAllKeys(container: HTMLDivElement | null, active: Set<string>) {
  if (!container || active.size === 0) return;
  for (const key of active) {
    const sel = key === " " ? "[data-key=\"space\"]" : `[data-key="${key}"]`;
    deactivateEl(container.querySelector<HTMLElement>(sel));
  }
  active.clear();
}

export function VirtualKeyboard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const container = containerRef.current;
    const active = activeRef.current;

    const onDown = (e: KeyboardEvent) => {
      const key = e.key === " " ? " " : e.key.toLowerCase();
      if (!ALL_KEYS.has(key)) return;
      if (active.has(key)) return;
      active.add(key);
      const sel = key === " " ? "[data-key=\"space\"]" : `[data-key="${key}"]`;
      activateEl(container?.querySelector<HTMLElement>(sel) ?? null);
    };

    const onUp = (e: KeyboardEvent) => {
      const key = e.key === " " ? " " : e.key.toLowerCase();
      if (!active.has(key)) return;
      active.delete(key);
      const sel = key === " " ? "[data-key=\"space\"]" : `[data-key="${key}"]`;
      deactivateEl(container?.querySelector<HTMLElement>(sel) ?? null);
    };

    const onBlur = () => clearAllKeys(container, active);

    const onVisibilityChange = () => {
      if (document.hidden) clearAllKeys(container, active);
    };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearAllKeys(container, active);
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
              className="relative flex size-8 sm:size-9 items-center justify-center rounded-2xl bg-card text-xs font-medium text-muted-foreground ring-1 ring-foreground/5 shadow-sm transition-colors duration-75"
            >
              {key}
              {HOME_KEYS.has(key) && (
                <span className="absolute bottom-1 left-1/2 h-[2px] w-2 -translate-x-1/2 rounded-full bg-muted-foreground/50" />
              )}
            </div>
          ))}
        </div>
      ))}
      <div
        data-key="space"
        data-active="false"
        className="h-8 w-56 sm:h-9 sm:w-64 rounded-full bg-card ring-1 ring-foreground/5 shadow-sm transition-colors duration-75"
      />
    </div>
  );
}
