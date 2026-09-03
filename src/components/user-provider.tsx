"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { SessionUser } from "~/lib/types";
import { getSessionUser } from "~/server/auth";

type AuthStatus = "loading" | "ready";

interface AuthContextValue {
  user: SessionUser | null;
  status: AuthStatus;
  /** Re-fetch the session from the server (call after sign-in / sign-out). */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  status: "loading",
  refresh: async () => {},
});

/**
 * Resolves the signed-in user on the client instead of blocking the server
 * layout. The root layout renders synchronously, so client-side navigation
 * swaps pages instantly — the session is fetched here once on mount (and
 * again after sign-in / sign-out) without ever gating a navigation.
 */
export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const refresh = useCallback(async () => {
    try {
      const u = await getSessionUser();
      setUser(u);
    } catch {
      setUser(null);
    } finally {
      setStatus("ready");
    }
  }, []);

  // Fetch the session once on mount. This runs on the client, so page
  // transitions never wait for an auth round-trip.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  return <AuthContext.Provider value={{ user, status, refresh }}>{children}</AuthContext.Provider>;
}

/** Full auth state: user, whether the initial fetch settled, and refresh. */
export function useAuth() {
  return useContext(AuthContext);
}

/** The signed-in user, or null while loading / signed out. */
export function useUser() {
  return useContext(AuthContext).user;
}

/** "loading" until the initial session fetch settles, then "ready". */
export function useAuthStatus() {
  return useContext(AuthContext).status;
}
