"use client";

import { useEffect, useState } from "react";
import { useSettingsStore } from "~/stores/settings-store";
import { getTheme } from "~/lib/themes";

export function DynamicFavicon() {
  const themeId = useSettingsStore((s) => s.settings.themeId);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);

  useEffect(() => {
    const theme = getTheme(themeId);
    const fgColor = theme.vars["--primary"];
    const bgColor = theme.vars["--background"];

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="${bgColor}"/><path fill="${fgColor}" d="M20 5a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3zM6 13a1 1 0 0 0-1 1v.01a1 1 0 0 0 2 0V14a1 1 0 0 0-1-1m12 0a1 1 0 0 0-1 1v.01a1 1 0 0 0 2 0V14a1 1 0 0 0-1-1m-7.998 0a1 1 0 0 0-.004 2l4 .01a1 1 0 0 0 .005-2zM6 9a1 1 0 0 0-1 1v.01a1 1 0 0 0 2 0V10a1 1 0 0 0-1-1m4 0a1 1 0 0 0-1 1v.01a1 1 0 0 0 2 0V10a1 1 0 0 0-1-1m4 0a1 1 0 0 0-1 1v.01a1 1 0 0 0 2 0V10a1 1 0 0 0-1-1m4 0a1 1 0 0 0-1 1v.01a1 1 0 0 0 2 0V10a1 1 0 0 0-1-1"/></svg>`;

    const dataUri = `data:image/svg+xml;base64,${btoa(svg)}`;
    setFaviconUrl(`${dataUri}&t=${Date.now()}`);

    // Force-update DOM link tags directly for immediate effect
    const linkHref = `${dataUri}&t=${Date.now()}`;
    const existing = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
    if (existing) {
      existing.href = linkHref;
    } else {
      const link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/svg+xml";
      link.href = linkHref;
      document.head.appendChild(link);
    }
  }, [themeId]);

  if (!faviconUrl) return null;

  return <link rel="icon" type="image/svg+xml" href={faviconUrl} />;
}
