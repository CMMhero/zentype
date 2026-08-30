-- =============================================================
-- zentype v2 — Fix RLS for level leaderboard
-- The user_points table needs public read access so the level
-- leaderboard can show all users' XP and levels.
-- =============================================================

-- Allow all users to read user_points for the level leaderboard
CREATE POLICY "public read access for user_points"
  ON user_points FOR SELECT
  USING (true);
