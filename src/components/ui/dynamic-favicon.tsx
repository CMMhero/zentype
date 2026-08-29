"use client";

import { useEffect, useRef } from "react";
import { useSettingsStore } from "~/stores/settings-store";
import { getTheme } from "~/lib/themes";

// "zt" letter paths (drawn as geometry — no font dependency)
const ZT_PATHS = [
  'M2 5h10v3L6 15H12v2H2V15l6-7H2z',  // Z
  'M13 5h9v3h-3v9h-3V8h-3V5z',          // T
];

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
      `${ZT_PATHS.map((d) => `<path fill="${fg}" d="${d}"/>`).join('')}`,
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
