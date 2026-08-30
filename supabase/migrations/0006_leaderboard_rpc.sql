-- =============================================================
-- zentype v2 — SECURITY DEFINER RPCs for leaderboard
-- These functions bypass RLS so the leaderboard works for
-- everyone (including unauthenticated visitors) regardless
-- of whether earlier RLS migrations were applied.
-- =============================================================

-- Public read access for test_results (in case 0004 wasn't applied)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'public read access for test_results'
  ) THEN
    ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "users read own results" ON public.test_results;
    CREATE POLICY "public read access for test_results"
      ON public.test_results FOR SELECT USING (true);
  END IF;
END $$;

-- Public read access for user_points (in case 0005 wasn't applied)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'public read access for user_points'
  ) THEN
    ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "public read access for user_points"
      ON user_points FOR SELECT USING (true);
  END IF;
END $$;

-- Public read access for profiles (in case 0004 wasn't applied)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'profiles are readable by everyone'
  ) THEN
    CREATE POLICY "profiles are readable by everyone"
      ON public.profiles FOR SELECT USING (true);
  END IF;
END $$;

-- Ensure RLS is enabled on tables (idempotent)
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Get level leaderboard: returns top users by XP
CREATE OR REPLACE FUNCTION public.get_level_leaderboard(p_limit int DEFAULT 50)
RETURNS TABLE (
  user_id uuid,
  username text,
  avatar_url text,
  level int,
  total_xp int
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    up.user_id,
    COALESCE(p.username, 'anon') AS username,
    p.avatar_url,
    up.level,
    up.total_xp
  FROM public.user_points up
  LEFT JOIN public.profiles p ON p.id = up.user_id
  ORDER BY up.total_xp DESC
  LIMIT p_limit;
$$;

-- Grant execute to everyone (anon + authenticated)
GRANT EXECUTE ON FUNCTION public.get_level_leaderboard(int) TO anon;
GRANT EXECUTE ON FUNCTION public.get_level_leaderboard(int) TO authenticated;

-- Get WPM leaderboard: returns top users per board from test_results
CREATE OR REPLACE FUNCTION public.get_wpm_leaderboard(
  p_mode text,
  p_variant int,
  p_limit int DEFAULT 50,
  p_since timestamptz DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  username text,
  avatar_url text,
  wpm numeric,
  accuracy numeric,
  consistency numeric,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH best_per_user AS (
    SELECT DISTINCT ON (tr.user_id)
      tr.user_id,
      tr.wpm,
      tr.accuracy,
      tr.consistency,
      tr.created_at
    FROM public.test_results tr
    WHERE tr.mode = p_mode
      AND tr.variant = p_variant
      AND (p_since IS NULL OR tr.created_at >= p_since)
    ORDER BY tr.user_id, tr.wpm DESC, tr.accuracy DESC
  )
  SELECT
    bpu.user_id,
    COALESCE(p.username, 'anon') AS username,
    p.avatar_url,
    bpu.wpm,
    bpu.accuracy,
    bpu.consistency,
    bpu.created_at
  FROM best_per_user bpu
  LEFT JOIN public.profiles p ON p.id = bpu.user_id
  ORDER BY bpu.wpm DESC, bpu.accuracy DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_wpm_leaderboard(text, int, int, timestamptz) TO anon;
GRANT EXECUTE ON FUNCTION public.get_wpm_leaderboard(text, int, int, timestamptz) TO authenticated;

-- Get public profile stats: returns aggregated stats for a user
CREATE OR REPLACE FUNCTION public.get_public_profile_stats(p_user_id uuid)
RETURNS TABLE (
  tests_completed bigint,
  avg_wpm_10 numeric,
  avg_wpm_all numeric,
  avg_accuracy numeric,
  avg_consistency numeric,
  time_typed_seconds bigint,
  chars_typed bigint,
  best_by_board jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*)::bigint AS tests_completed,
    ROUND(AVG(wpm) FILTER (WHERE rn <= 10), 0) AS avg_wpm_10,
    ROUND(AVG(wpm), 0) AS avg_wpm_all,
    ROUND(AVG(accuracy), 0) AS avg_accuracy,
    ROUND(AVG(consistency), 0) AS avg_consistency,
    SUM(CASE WHEN mode = 'time' THEN variant ELSE 8 END)::bigint AS time_typed_seconds,
    SUM((chars->>'correct')::int + (chars->>'incorrect')::int + (chars->>'extra')::int)::bigint AS chars_typed,
    (
      SELECT COALESCE(jsonb_object_agg(board_key, best_wpm), '{}'::jsonb)
      FROM (
        SELECT (mode || ':' || variant::text) AS board_key, MAX(wpm) AS best_wpm
        FROM public.test_results
        WHERE user_id = p_user_id
        GROUP BY mode, variant
      ) sub
    ) AS best_by_board
  FROM (
    SELECT *, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS rn
    FROM public.test_results
    WHERE user_id = p_user_id
  ) ranked;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_profile_stats(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_profile_stats(uuid) TO authenticated;

-- Get user results by user_id (for public profiles)
CREATE OR REPLACE FUNCTION public.get_user_results_public(p_user_id uuid, p_limit int DEFAULT 1000)
RETURNS SETOF public.test_results
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.test_results
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_results_public(uuid, int) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_results_public(uuid, int) TO authenticated;

-- Search users by username prefix
CREATE OR REPLACE FUNCTION public.search_users(p_query text, p_limit int DEFAULT 8)
RETURNS TABLE (
  id uuid,
  username text,
  avatar_url text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, username, avatar_url
  FROM public.profiles
  WHERE username ILIKE '%' || p_query || '%'
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.search_users(text, int) TO anon;
GRANT EXECUTE ON FUNCTION public.search_users(text, int) TO authenticated;

-- Get single user's points by user_id (for public profiles)
CREATE OR REPLACE FUNCTION public.get_user_points_by_id(p_user_id uuid)
RETURNS TABLE (
  total_xp int,
  level int
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT total_xp, level
  FROM public.user_points
  WHERE user_id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_points_by_id(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_points_by_id(uuid) TO authenticated;

-- Get user achievements by user_id (for public profiles)
CREATE OR REPLACE FUNCTION public.get_user_achievements_by_id(p_user_id uuid)
RETURNS TABLE (
  achievement_id text,
  unlocked_at timestamptz,
  progress int
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT achievement_id, unlocked_at, progress
  FROM public.user_achievements
  WHERE user_id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_achievements_by_id(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_achievements_by_id(uuid) TO authenticated;