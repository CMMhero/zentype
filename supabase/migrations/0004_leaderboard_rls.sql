-- =============================================================
-- zentype v2 — Fix RLS for leaderboard and public profiles
-- This migration adds read access to test_results for all users
-- so the leaderboard and public profiles work correctly.
-- =============================================================

-- Allow all users (anon and authenticated) to read test_results for leaderboards
-- The existing "users read own results" policy is too restrictive
-- We replace it with a policy that allows reading all results
DROP POLICY IF EXISTS "users read own results" ON public.test_results;
DROP POLICY IF EXISTS "authenticated users can read all test_results" ON public.test_results;

-- New policy: all users can read all test_results for public leaderboards
CREATE POLICY "public read access for test_results"
  ON public.test_results FOR SELECT
  USING (true);

-- The existing "profiles are readable by everyone" policy should work
-- but let's ensure it exists
DROP POLICY IF EXISTS "profiles are readable by everyone" ON public.profiles;
CREATE POLICY "profiles are readable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Create a view for public leaderboard data that doesn't expose sensitive info
CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT 
  tr.user_id,
  tr.mode,
  tr.variant,
  tr.wpm,
  tr.accuracy,
  tr.consistency,
  tr.created_at,
  p.username,
  p.avatar_url
FROM public.test_results tr
JOIN public.profiles p ON tr.user_id = p.id;

-- Grant select on the view to everyone
GRANT SELECT ON public.leaderboard_view TO anon;
GRANT SELECT ON public.leaderboard_view TO authenticated;
