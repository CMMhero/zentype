/** True when the event target is a form field / dialog where typing shortcuts must not fire. */
export function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  // zentype's own hidden capture input must not count
  if (el.hasAttribute("data-zt-ignore")) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable ||
    el.closest("[role='dialog']") !== null ||
    el.closest("[data-command-overlay]") !== null
  );
}

export function isDialogOpen(): boolean {
  return typeof document !== "undefined"
    ? document.querySelector("[role='dialog']") !== null
    : false;
}
