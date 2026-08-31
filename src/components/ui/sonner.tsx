"use client";

import { useEffect, useState } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  // Track the app's appearance (dark/light) so toasts match the selected theme.
  const [appearance, setAppearance] = useState<"light" | "dark">("dark");
  const [fontFamily, setFontFamily] = useState<string>(() =>
    typeof window === "undefined" ? "inherit" : window.getComputedStyle(document.documentElement).fontFamily
  );

  useEffect(() => {
    const root = document.documentElement;
    const read = () => {
      setAppearance(root.dataset.appearance === "light" ? "light" : "dark");
      setFontFamily(window.getComputedStyle(root).fontFamily);
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ["data-appearance", "data-font", "class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <Sonner
      theme={appearance}
      className="toaster group"
      style={
        {
          fontFamily,
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--success": "var(--primary)",
          "--error": "var(--destructive)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
