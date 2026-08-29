"use client";

import { useEffect, useState } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  // Track the app's appearance (dark/light) so toasts match the selected theme.
  const [appearance, setAppearance] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const root = document.documentElement;
    const read = () =>
      setAppearance(root.dataset.appearance === "light" ? "light" : "dark");
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ["data-appearance"] });
    return () => observer.disconnect();
  }, []);

  return (
    <Sonner
      theme={appearance}
      className="toaster group"
      style={
        {
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
