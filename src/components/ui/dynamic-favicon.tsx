"use client";

import { useEffect, useRef } from "react";
import { useSettingsStore } from "~/stores/settings-store";
import { getTheme } from "~/lib/themes";

// Letter "Z" path (drawn as geometry — no font dependency)
const Z_PATH = 'M5 6h14v2.5L9.5 17H19v2.5H5V17l9.5-8.5H5Z';

export function DynamicFavicon() {
  const themeId = useSettingsStore((s) => s.settings.themeId);
  const prevUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const theme = getTheme(themeId);
    const fg = theme.vars["--primary"];
    const bg = theme.vars["--background"];

    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">',
      `<rect width="24" height="24" rx="4" fill="${bg}"/>`,
      `<path fill="${fg}" d="${Z_PATH}"/>`,
      '</svg>',
    ].join('');

    // Create a blob URL — always unique, guaranteed to bust cache
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    // Revoke previous blob URL to avoid memory leaks
    if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    prevUrlRef.current = url;

    // Remove EVERY existing favicon / apple-touch-icon link
    document
      .querySelectorAll("link[rel='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']")
      .forEach((el) => el.remove());

    // Append fresh favicon
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    link.href = url;
    document.head.appendChild(link);
  }, [themeId]);

  return null;
}
