import { useEffect, useRef } from "react";

const NUMBER_ROW = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

const ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"],
  ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
];

const ACTIVE_CLASSES = ["border-primary", "bg-primary", "text-primary-foreground", "scale-95"];
const INACTIVE_CLASSES = ["border-border", "bg-card", "text-muted-foreground"];

function sel(key: string) {
  return key === " " ? "[data-key=\"space\"]" : `[data-key="${key}"]`;
}

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
    deactivateEl(container.querySelector<HTMLElement>(sel(key)));
  }
  active.clear();
}

interface VirtualKeyboardProps {
  numbers?: boolean;
  punctuation?: boolean;
}

export function VirtualKeyboard({ numbers, punctuation }: VirtualKeyboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<Set<string>>(new Set());
  const showNumberRow = numbers || punctuation;

  useEffect(() => {
    const allKeys = new Set([
      ...ROWS.flat(),
      " ",
      ...(showNumberRow ? NUMBER_ROW : []),
    ]);

    const onDown = (e: KeyboardEvent) => {
      const key = e.key === " " ? " " : e.key.toLowerCase();
      if (!allKeys.has(key)) return;
      if (activeRef.current.has(key)) return;
      activeRef.current.add(key);
      activateEl(containerRef.current?.querySelector<HTMLElement>(sel(key)) ?? null);
    };

    const onUp = (e: KeyboardEvent) => {
      const key = e.key === " " ? " " : e.key.toLowerCase();
      if (!activeRef.current.has(key)) return;
      activeRef.current.delete(key);
      deactivateEl(containerRef.current?.querySelector<HTMLElement>(sel(key)) ?? null);
    };

    const onBlur = () => clearAllKeys(containerRef.current, activeRef.current);

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    const onVisChange = () => { if (document.hidden) clearAllKeys(containerRef.current, activeRef.current); };
    document.addEventListener("visibilitychange", onVisChange);

    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisChange);
      clearAllKeys(containerRef.current, activeRef.current);
    };
  }, [showNumberRow]);

  return (
    <div
      ref={containerRef}
      className="mx-auto -mt-1 flex w-fit select-none flex-col items-center gap-1 scale-75 sm:scale-100 origin-top"
      aria-hidden
    >
      {showNumberRow && (
        <div className="flex gap-1 sm:gap-1.5">
          {NUMBER_ROW.map((key) => (
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
      )}
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
