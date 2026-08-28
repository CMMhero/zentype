"use client";

import { useEffect, useRef } from "react";
import { useSettingsStore } from "~/stores/settings-store";
import { useUser } from "~/components/user-provider";
import { loadUserSettings, saveUserSettings } from "~/server/settings";

export function useSettingsSync() {
  const user = useUser();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const loadedUserIdRef = useRef<string | null>(null);
  const loadingRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<typeof settings | null>(null);

  // Load DB settings on login (per-user, once)
  useEffect(() => {
    if (!user) {
      loadedUserIdRef.current = null;
      loadingRef.current = false;
      return;
    }
    if (loadedUserIdRef.current === user.id) return;
    if (loadingRef.current) return;
    loadingRef.current = true;
    void loadUserSettings()
      .then((db) => {
        if (db) {
          // merge DB settings on top of defaults/local to ensure all keys present
          update(db);
        }
        loadedUserIdRef.current = user.id;
      })
      .finally(() => {
        loadingRef.current = false;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Debounce save to DB on settings change (only when logged in)
  // Ensures every field in GameSettings is persisted as a single jsonb blob.
  useEffect(() => {
    if (!user) return;
    // skip save until initial DB load has resolved for this user
    if (loadedUserIdRef.current !== user.id) return;
    pendingRef.current = settings;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const snap = pendingRef.current;
      if (snap) void saveUserSettings(snap);
      pendingRef.current = null;
      saveTimerRef.current = null;
    }, 600);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    };
  }, [user, settings]);

  // Flush any pending save on unmount / page hide (avoid losing last change)
  useEffect(() => {
    const flush = () => {
      if (pendingRef.current && user) {
        // fire-and-forget; navigator.sendBeacon not needed for server action
        void saveUserSettings(pendingRef.current);
        pendingRef.current = null;
      }
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", onVis);
      flush();
    };
  }, [user]);
}
