"use server";

import { getSupabaseServerClient } from "~/lib/supabase/server";
import type { SessionUser } from "~/lib/types";

function toSessionUser(user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): SessionUser {
  const meta = user.user_metadata ?? {};
  const username =
    (meta["user_name"] as string) ||
    (meta["preferred_username"] as string) ||
    (meta["name"] as string)?.replace(/\s+/g, "_").toLowerCase() ||
    user.email?.split("@")[0] ||
    `user_${user.id.slice(0, 6)}`;
  return {
    id: user.id,
    email: user.email ?? "",
    username,
    avatarUrl:
      (meta["avatar_url"] as string) || (meta["picture"] as string) || null,
  };
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    const base = toSessionUser(data.user);
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", data.user.id)
      .maybeSingle();
    if (profile?.username) base.username = profile.username;
    return base;
  } catch {
    return null;
  }
}

export async function signInWithProvider(
  provider: "github" | "google",
): Promise<{ url: string | null; error: string | null }> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return { url: null, error: "Auth is not configured (missing env)." };
  }
  const { data: res, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
      skipBrowserRedirect: true,
    },
  });
  if (error) return { url: null, error: error.message };
  return { url: res.url, error: null };
}

export async function signOutFn(): Promise<{ ok: boolean }> {
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  return { ok: true };
}

const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;

export async function updateUsername(
  username: string,
): Promise<{ error: string | null }> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Auth is not configured." };
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Not signed in." };
  const trimmed = username.trim();
  if (!USERNAME_RE.test(trimmed)) {
    return {
      error: "Username must be 3-24 characters (letters, numbers, _).",
    };
  }
  const { error: insErr } = await supabase.from("profiles").upsert({
    id: auth.user.id,
    username: trimmed,
  });
  if (insErr) {
    if (insErr.code === "23505") return { error: "Username already taken." };
    return { error: insErr.message };
  }
  return { error: null };
}
