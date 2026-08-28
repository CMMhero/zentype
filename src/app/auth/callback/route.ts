import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "~/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error_description");

  if (error) {
    return NextResponse.redirect(new URL("/login?error=1", request.url));
  }

  if (code) {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        console.error("[zentype] oauth exchange failed:", exchangeError.message);
        return NextResponse.redirect(new URL("/login?error=1", request.url));
      }
    }
  }

  return NextResponse.redirect(new URL("/", request.url));
}
