"use client";

import { useEffect, useRef } from "react";
import { useSettingsStore } from "~/stores/settings-store";
import { getTheme } from "~/lib/themes";

// Original colors in public/logo.svg that we swap per theme
const ORIGINAL_BG = "rgb(28,30,38)";
const ORIGINAL_FG = "rgb(233,86,120)";

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgb(${r},${g},${b})`;
}

function cleanForFavicon(raw: string): string {
  // Strip XML declaration, DOCTYPE, and convert width/height to fixed 32px
  return raw
    .replace(/<\?xml[\s\S]*?\?>\s*/gi, "")
    .replace(/<!DOCTYPE[\s\S]*?>\s*/gi, "")
    .replace(/xmlns:serif="[^"]*"\s*/g, "")
    .replace(/xml:space="[^"]*"\s*/g, "")
    .replace(/xmlns:xlink="[^"]*"\s*/g, "")
    .replace(/width="100%"/g, 'width="32"')
    .replace(/height="100%"/g, 'height="32"')
    .trim();
}

export function DynamicFavicon() {
  const themeId = useSettingsStore((s) => s.settings.themeId);
  const prevUrlRef = useRef<string | null>(null);
  const svgCacheRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // Fetch logo.svg once, cache the cleaned text
      if (!svgCacheRef.current) {
        try {
          const res = await fetch("/logo.svg");
          const raw = await res.text();
          svgCacheRef.current = cleanForFavicon(raw);
        } catch {
          return;
        }
      }

      if (cancelled) return;

      const theme = getTheme(themeId);
      const fg = hexToRgb(theme.vars["--primary"]);
      const bg = hexToRgb(theme.vars["--background"]);

      // Replace original colors with theme colors
      const svg = svgCacheRef.current!
        .replaceAll(ORIGINAL_BG, bg)
        .replaceAll(ORIGINAL_FG, fg);

      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);

      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
      prevUrlRef.current = url;

      // Remove every existing favicon link
      document
        .querySelectorAll("link[rel='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']")
        .forEach((el) => el.remove());

      // Append dynamic favicon (overrides the static /favicon.ico)
      const link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/svg+xml";
      link.href = url;
      document.head.appendChild(link);
    }

    run();

    return () => { cancelled = true; };
  }, [themeId]);

  return null;
}
