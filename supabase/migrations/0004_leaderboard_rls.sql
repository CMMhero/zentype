-- =============================================================
-- ZenType v2 — Fix RLS for leaderboard and public profiles
-- This migration adds read access to test_results for all users
-- so the leaderboard and public profiles work correctly.
-- =============================================================

-- Allow all authenticated users to read test_results for leaderboards
-- The existing "users read own results" policy is too restrictive
-- We replace it with a policy that allows reading all results
DROP POLICY IF EXISTS "users read own results" ON public.test_results;

-- New policy: all authenticated users can read all test_results
-- This enables leaderboard and public profile functionality
CREATE POLICY "authenticated users can read all test_results"
  ON public.test_results FOR SELECT
  USING (auth.role() = 'authenticated');

-- Also allow reading profiles for public profiles (already exists but let's ensure)
-- The existing "profiles are readable by everyone" policy should work

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

-- Grant select on the view to authenticated users
GRANT SELECT ON public.leaderboard_view TO authenticated;
