-- user_points: total XP per user
CREATE TABLE IF NOT EXISTS user_points (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- point_events: every XP grant/loss
CREATE TABLE IF NOT EXISTS point_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  awarded integer NOT NULL,
  total integer NOT NULL,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_point_events_user ON point_events(user_id, created_at DESC);

-- user_achievements: tracks unlocks
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  progress integer DEFAULT 0,
  PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

-- RLS
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own points"
  ON user_points FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can read own point events"
  ON point_events FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can read own achievements"
  ON user_achievements FOR SELECT USING (auth.uid() = user_id);

-- Functions to upsert points atomically
CREATE OR REPLACE FUNCTION upsert_user_points(p_user_id uuid, p_xp integer)
RETURNS void AS $$
BEGIN
  INSERT INTO user_points (user_id, total_xp, level, updated_at)
  VALUES (p_user_id, p_xp, 1, now())
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp = user_points.total_xp + p_xp,
    level = GREATEST(1, (user_points.total_xp + p_xp) / 500 + 1),
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Function to record a point event
CREATE OR REPLACE FUNCTION record_point_event(
  p_user_id uuid,
  p_awarded integer,
  p_total integer,
  p_event_type text,
  p_event_data jsonb DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO point_events (id, user_id, awarded, total, event_type, event_data)
  VALUES (gen_random_uuid(), p_user_id, p_awarded, p_total, p_event_type, p_event_data)
  RETURNING id INTO v_id;

  PERFORM upsert_user_points(p_user_id, p_awarded);
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function to unlock an achievement
CREATE OR REPLACE FUNCTION unlock_achievement(
  p_user_id uuid,
  p_achievement_id text,
  p_xp integer DEFAULT 0
)
RETURNS boolean AS $$
DECLARE
  v_already boolean;
  v_total integer;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM user_achievements WHERE user_id = p_user_id AND achievement_id = p_achievement_id
  ) INTO v_already;

  IF v_already THEN RETURN false; END IF;

  INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
  VALUES (p_user_id, p_achievement_id, now());

  IF p_xp > 0 THEN
    SELECT total_xp INTO v_total FROM user_points WHERE user_id = p_user_id;
    IF v_total IS NULL THEN v_total := 0; END IF;
    PERFORM record_point_event(
      p_user_id, p_xp, v_total + p_xp, 'achievement',
      jsonb_build_object('achievement_id', p_achievement_id)
    );
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;
