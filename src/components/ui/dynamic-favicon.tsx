"use client";

import { useEffect, useRef } from "react";
import { useSettingsStore } from "~/stores/settings-store";
import { getTheme } from "~/lib/themes";

// "zt" lowercase letter paths (drawn as geometry — no font dependency)
const ZT_PATHS = [
  'M3 7h8v2.5L5 14.5h6v2.5H3v-2.5l6-5H3z',  // z
  'M15.5 4h3v3h2.5v2.5h-2.5v7.5h-3v-7.5h-2.5V7h2.5V4z',  // t
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
