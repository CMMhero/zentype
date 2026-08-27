"use client";

import { useEffect, useRef } from "react";
import { useSettingsStore } from "~/stores/settings-store";
import { useUser } from "~/components/user-provider";
import { loadUserSettings, saveUserSettings } from "~/server/settings";

export function useSettingsSync() {
  const user = useUser();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const loadedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load DB settings on login (once)
  useEffect(() => {
    if (!user || loadedRef.current) return;
    loadedRef.current = true;
    void loadUserSettings().then((db) => {
      if (db) update(db);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Debounce save to DB on settings change (only when logged in)
  useEffect(() => {
    if (!user) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void saveUserSettings(settings);
    }, 1000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [user, settings]);
}
