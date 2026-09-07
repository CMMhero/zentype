import { toCanvas } from "html-to-image";
import type { TestResult } from "~/lib/types";

/** 2x scale for crisp output on any display. */
const CAPTURE_SCALE = 2;
/** Extra themed margin added around the captured card (CSS px at 1x). */
const CARD_PADDING = 32;
/** Corner radius, matching the app's `rounded-4xl` cards (CSS px at 1x). */
const CARD_RADIUS = 32;

/**
 * Create the shareable result-card PNG, 1:1 with what the user sees: the live
 * ResultView DOM is captured via html-to-image (cloned and rendered through the
 * browser engine, so the theme, font, chart and badges match exactly), then the
 * card is re-drawn onto a larger canvas with a themed border around it and
 * rounded-4xl corners — all applied to the image only, so the live layout never
 * shifts and the keyboard-shortcut row below the card is never captured.
 *
 * Callers first swap the interactive controls for the card's share branding
 * (zentype wordmark + username), then pass the ResultView root element here.
 */
export async function createResultImage(node: HTMLElement): Promise<Blob> {
  // Make sure the active webfont is loaded so the clone renders real text.
  await document.fonts.ready;

  // The card itself is transparent — fill with the page background so the
  // image and its padding stand alone on any surface.
  const background =
    getComputedStyle(document.documentElement).getPropertyValue("--background").trim() || "#282828";

  const source = await toCanvas(node, {
    pixelRatio: CAPTURE_SCALE,
    backgroundColor: background,
    cacheBust: true,
  });

  const pad = CARD_PADDING * CAPTURE_SCALE;
  const radius = CARD_RADIUS * CAPTURE_SCALE;

  const canvas = document.createElement("canvas");
  canvas.width = source.width + pad * 2;
  canvas.height = source.height + pad * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");

  // Round the whole composed card (margin included) like a card; the corners
  // stay transparent so the rounding reads on any background.
  roundedRectPath(ctx, 0, 0, canvas.width, canvas.height, radius);
  ctx.fillStyle = background;
  ctx.fill();

  ctx.save();
  ctx.clip();
  ctx.drawImage(source, pad, pad);
  ctx.restore();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("canvas.toBlob returned null");
  return blob;
}

/** Copy the PNG to the clipboard. Returns false when unsupported/failed. */
export async function copyResultImage(blob: Blob): Promise<boolean> {
  if (typeof ClipboardItem === "undefined") return false;
  if (typeof navigator.clipboard?.write !== "function") return false;
  try {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  } catch {
    // Clipboard writes can fail on permissions or unsupported image types.
    return false;
  }
}

/** Download the PNG using a filename derived from the result. */
export function downloadResultImage(blob: Blob, result: TestResult): void {
  const filename = `zentype-${result.mode}-${result.variant}-${result.id.slice(0, 8)}.png`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
