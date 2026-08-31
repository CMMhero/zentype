-- Fix time_typed_seconds in get_public_profile_stats to use WPM-based estimation
-- matching the JS formula: round(variant * 60 / wpm) clamped 5-600s for words mode
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
    SUM(
      CASE WHEN mode = 'time' THEN variant
      ELSE GREATEST(5, LEAST(600, ROUND((variant * 60.0) / GREATEST(wpm, 1))))
      END
    )::bigint AS time_typed_seconds,
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
