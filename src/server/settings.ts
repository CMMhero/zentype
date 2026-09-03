"use server";

import { getSupabaseServerClient } from "~/lib/supabase/server";
import type { GameSettings } from "~/lib/types";

type SettingsPatch = Partial<GameSettings>;

async function requireUser() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ? { supabase, user: data.user } : null;
}

export async function loadUserSettings(): Promise<SettingsPatch | null> {
  const ctx = await requireUser();
  if (!ctx) return null;
  const { data } = await ctx.supabase
    .from("user_settings")
    .select("settings")
    .eq("user_id", ctx.user.id)
    .maybeSingle();
  if (!data?.settings) return null;
  return data.settings as SettingsPatch;
}

export async function saveUserSettings(patch: SettingsPatch): Promise<{ ok: boolean }> {
  const ctx = await requireUser();
  if (!ctx) return { ok: false };
  const { error } = await ctx.supabase
    .from("user_settings")
    .upsert(
      { user_id: ctx.user.id, settings: patch, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  if (error) {
    console.error("[zentype] saveUserSettings:", error.message);
    return { ok: false };
  }
  return { ok: true };
}
