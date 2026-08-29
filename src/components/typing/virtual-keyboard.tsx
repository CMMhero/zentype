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

const ACTIVE_CLASSES = ["border-primary", "bg-primary", "text-primary-foreground", "scale-95"];
const INACTIVE_CLASSES = ["border-border", "bg-card", "text-muted-foreground"];

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
    const onDown = (e: KeyboardEvent) => {
      const key = e.key === " " ? " " : e.key.toLowerCase();
      if (!ALL_KEYS.has(key)) return;
      if (activeRef.current.has(key)) return;
      activeRef.current.add(key);
      const sel = key === " " ? "[data-key=\"space\"]" : `[data-key="${key}"]`;
      activateEl(containerRef.current?.querySelector<HTMLElement>(sel) ?? null);
    };

    const onUp = (e: KeyboardEvent) => {
      const key = e.key === " " ? " " : e.key.toLowerCase();
      if (!activeRef.current.has(key)) return;
      activeRef.current.delete(key);
      const sel = key === " " ? "[data-key=\"space\"]" : `[data-key="${key}"]`;
      deactivateEl(containerRef.current?.querySelector<HTMLElement>(sel) ?? null);
    };

    const onBlur = () => clearAllKeys(containerRef.current, activeRef.current);

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) clearAllKeys(containerRef.current, activeRef.current);
    });

    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
      clearAllKeys(containerRef.current, activeRef.current);
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
