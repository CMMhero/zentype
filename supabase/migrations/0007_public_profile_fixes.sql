-- Repair public profile RPCs in case 0006 was not fully applied.
-- Idempotent: safe to run multiple times.
-- Ensures anon/authenticated can read another user's points and achievements
-- for public profiles via SECURITY DEFINER functions (RLS stays owner-only).

-- Public points lookup
CREATE OR REPLACE FUNCTION public.get_user_points_by_id(p_user_id uuid)
RETURNS TABLE (
  total_xp bigint,
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

-- Public achievements lookup
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

-- Make sure the profiles table is publicly readable (needed for username lookup)
DROP POLICY IF EXISTS "profiles are readable by everyone" ON public.profiles;
CREATE POLICY "profiles are readable by everyone"
ON public.profiles FOR SELECT USING (true);