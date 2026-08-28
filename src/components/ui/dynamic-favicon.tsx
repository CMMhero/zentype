"use client";

import { useEffect, useRef } from "react";
import { useSettingsStore } from "~/stores/settings-store";
import { getTheme } from "~/lib/themes";

// Tabler KeyboardFilled icon path
const KEYBOARD_PATH =
  'M20 5a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3zm-8 8a1 1 0 0 0-1 1v.01a1 1 0 0 0 2 0V14a1 1 0 0 0-1-1zm-6 0a1 1 0 0 0-1 1v.01a1 1 0 0 0 2 0V14a1 1 0 0 0-1-1zm12 0a1 1 0 0 0-1 1v.01a1 1 0 0 0 2 0V14a1 1 0 0 0-1-1zm-4-5a1 1 0 0 0-1 1v.01a1 1 0 0 0 2 0V10a1 1 0 0 0-1-1zm-6 0a1 1 0 0 0-1 1v.01a1 1 0 0 0 2 0V10a1 1 0 0 0-1-1zm12 0a1 1 0 0 0-1 1v.01a1 1 0 0 0 2 0V10a1 1 0 0 0-1-1z';

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
      `<path fill="${fg}" d="${KEYBOARD_PATH}"/>`,
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
