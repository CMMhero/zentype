"use client";

import { useEffect } from "react";
import { useSettingsStore } from "~/stores/settings-store";
import { getTheme } from "~/lib/themes";

export function DynamicFavicon() {
  const themeId = useSettingsStore((s) => s.settings.themeId);

  useEffect(() => {
    const theme = getTheme(themeId);
    const fgColor = theme.vars["--primary"];
    const bgColor = theme.vars["--background"];

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
      <rect width="24" height="24" rx="4" fill="${bgColor}"/>
      <g transform="translate(4, 4)">
        <path fill="none" stroke="${fgColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M14 3a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H2a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z"/>
        <circle cx="3.5" cy="7.5" r="0.5" fill="${fgColor}"/>
        <circle cx="6.5" cy="7.5" r="0.5" fill="${fgColor}"/>
        <circle cx="9.5" cy="7.5" r="0.5" fill="${fgColor}"/>
        <circle cx="12.5" cy="7.5" r="0.5" fill="${fgColor}"/>
        <circle cx="4.5" cy="10.5" r="0.5" fill="${fgColor}"/>
        <circle cx="7.5" cy="10.5" r="0.5" fill="${fgColor}"/>
        <circle cx="10.5" cy="10.5" r="0.5" fill="${fgColor}"/>
        <line x1="3" y1="13" x2="13" y2="13" stroke="${fgColor}" stroke-width="1"/>
      </g>
    </svg>`;

    // Create data URI instead of blob URL for better cache busting
    const dataUri = `data:image/svg+xml,${encodeURIComponent(svg)}`;

    // Remove existing favicon
    const existingLinks = document.querySelectorAll("link[rel='icon'], link[rel='shortcut icon']");
    existingLinks.forEach((link) => link.remove());

    // Create new favicon with timestamp to force refresh
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.href = `${dataUri}&t=${Date.now()}`;
    document.head.appendChild(link);

    // Also update apple-touch-icon if present
    const appleLinks = document.querySelectorAll("link[rel='apple-touch-icon']");
    appleLinks.forEach((appleLink) => {
      (appleLink as HTMLLinkElement).href = `${dataUri}&t=${Date.now()}`;
    });
  }, [themeId]);

  return null;
}
