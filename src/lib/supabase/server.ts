import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

let missingWarned = false;

/**
 * Cookie-bound Supabase client for server components/actions.
 * Returns null when SUPABASE_URL / SUPABASE_ANON_KEY are not configured,
 * so the app still runs (guest-only mode) without a backend.
 */
export async function getSupabaseServerClient() {
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
  const cookieStore = await cookies();
  return createServerClient(url, key, {
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
