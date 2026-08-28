import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

let missingWarned = false;

function getSupabaseCreds() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    if (!missingWarned) {
      console.warn(
        "[zentype] SUPABASE_URL / SUPABASE_ANON_KEY not set — running in guest-only mode.",
      );
      missingWarned = true;
    }
    return null;
  }
  return { url, key };
}

/**
 * Public read-only Supabase client (no cookies).
 * Use for leaderboard, profiles, and other public data that
 * doesn't need the user's session.
 */
export function getSupabasePublicClient() {
  const creds = getSupabaseCreds();
  if (!creds) return null;
  return createClient(creds.url, creds.key);
}

/**
 * Cookie-bound Supabase client for server components/actions.
 * Returns null when SUPABASE_URL / SUPABASE_ANON_KEY are not configured,
 * so the app still runs (guest-only mode) without a backend.
 */
export async function getSupabaseServerClient() {
  const creds = getSupabaseCreds();
  if (!creds) return null;
  const cookieStore = await cookies();
  return createServerClient(creds.url, creds.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll().map(({ name, value }) => ({
          name,
          value,
        }));
      },
      setAll(cookies: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        try {
          cookies.forEach((cookie) => {
            cookieStore.set(cookie.name, cookie.value);
          });
        } catch {
          // setAll is called from Server Component — ignore
        }
      },
    },
  });
}
