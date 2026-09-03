-- =============================================================
-- zentype — functions & views (consolidated from the original 0003-0009 files)
-- Gamification helpers, public read view, and the SECURITY DEFINER
-- RPCs that power leaderboards and public profiles.
-- Idempotent: safe to run on a fresh project or re-run on an existing one.
-- Run after 0001_schema.sql.
-- =============================================================

-- ---------- gamification internals ----------

-- Upsert points atomically: adds p_xp and recomputes the level.
create or replace function public.upsert_user_points(p_user_id uuid, p_xp integer)
returns void
language plpgsql
set search_path = public
as $$
begin
  insert into public.user_points (user_id, total_xp, level, updated_at)
  values (p_user_id, p_xp, 1, now())
  on conflict (user_id) do update set
    total_xp = public.user_points.total_xp + p_xp,
    level = greatest(1, (public.user_points.total_xp + p_xp) / 500 + 1),
    updated_at = now();
end;
$$;

-- Record a point event and apply its XP in one step.
create or replace function public.record_point_event(
  p_user_id uuid,
  p_awarded integer,
  p_total integer,
  p_event_type text,
  p_event_data jsonb default '{}'
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.point_events (id, user_id, awarded, total, event_type, event_data)
  values (gen_random_uuid(), p_user_id, p_awarded, p_total, p_event_type, p_event_data)
  returning id into v_id;

  perform public.upsert_user_points(p_user_id, p_awarded);
  return v_id;
end;
$$;

-- Unlock an achievement exactly once, optionally awarding XP.
create or replace function public.unlock_achievement(
  p_user_id uuid,
  p_achievement_id text,
  p_xp integer default 0
)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  v_already boolean;
  v_total integer;
begin
  select exists(
    select 1 from public.user_achievements
    where user_id = p_user_id and achievement_id = p_achievement_id
  ) into v_already;

  if v_already then return false; end if;

  insert into public.user_achievements (user_id, achievement_id, unlocked_at)
  values (p_user_id, p_achievement_id, now());

  if p_xp > 0 then
    select total_xp into v_total from public.user_points where user_id = p_user_id;
    if v_total is null then v_total := 0; end if;
    perform public.record_point_event(
      p_user_id, p_xp, v_total + p_xp, 'achievement',
      jsonb_build_object('achievement_id', p_achievement_id)
    );
  end if;

  return true;
end;
$$;

-- ---------- leaderboard view (kept for ad-hoc queries) ----------

create or replace view public.leaderboard_view as
select
  tr.user_id,
  tr.mode,
  tr.variant,
  tr.wpm,
  tr.accuracy,
  tr.consistency,
  tr.created_at,
  p.username,
  p.avatar_url
from public.test_results tr
join public.profiles p on tr.user_id = p.id;

grant select on public.leaderboard_view to anon;
grant select on public.leaderboard_view to authenticated;

-- ---------- public RPCs (SECURITY DEFINER, bypass RLS) ----------

-- Level leaderboard: top users by XP.
create or replace function public.get_level_leaderboard(p_limit int default 50)
returns table (
  user_id uuid,
  username text,
  avatar_url text,
  level int,
  total_xp int
)
language sql
security definer
set search_path = public
as $$
  select
    up.user_id,
    coalesce(p.username, 'anon') as username,
    p.avatar_url,
    up.level,
    up.total_xp
  from public.user_points up
  left join public.profiles p on p.id = up.user_id
  order by up.total_xp desc
  limit p_limit;
$$;

grant execute on function public.get_level_leaderboard(int) to anon;
grant execute on function public.get_level_leaderboard(int) to authenticated;

-- WPM leaderboard: each user's best result per mode:variant, optionally since a date.
create or replace function public.get_wpm_leaderboard(
  p_mode text,
  p_variant int,
  p_limit int default 50,
  p_since timestamptz default null
)
returns table (
  user_id uuid,
  username text,
  avatar_url text,
  wpm numeric,
  accuracy numeric,
  consistency numeric,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  with best_per_user as (
    select distinct on (tr.user_id)
      tr.user_id,
      tr.wpm,
      tr.accuracy,
      tr.consistency,
      tr.created_at
    from public.test_results tr
    where tr.mode = p_mode
      and tr.variant = p_variant
      and (p_since is null or tr.created_at >= p_since)
    order by tr.user_id, tr.wpm desc, tr.accuracy desc
  )
  select
    bpu.user_id,
    coalesce(p.username, 'anon') as username,
    p.avatar_url,
    bpu.wpm,
    bpu.accuracy,
    bpu.consistency,
    bpu.created_at
  from best_per_user bpu
  left join public.profiles p on p.id = bpu.user_id
  order by bpu.wpm desc, bpu.accuracy desc
  limit p_limit;
$$;

grant execute on function public.get_wpm_leaderboard(text, int, int, timestamptz) to anon;
grant execute on function public.get_wpm_leaderboard(text, int, int, timestamptz) to authenticated;

-- Public profile stats. Words-mode time is estimated from WPM
-- (round(variant * 60 / wpm), clamped 5-600s) to match the JS formula.
create or replace function public.get_public_profile_stats(p_user_id uuid)
returns table (
  tests_completed bigint,
  avg_wpm_10 numeric,
  avg_wpm_all numeric,
  avg_accuracy numeric,
  avg_consistency numeric,
  time_typed_seconds bigint,
  chars_typed bigint,
  best_by_board jsonb
)
language sql
security definer
set search_path = public
as $$
  select
    count(*)::bigint as tests_completed,
    round(avg(wpm) filter (where rn <= 10), 0) as avg_wpm_10,
    round(avg(wpm), 0) as avg_wpm_all,
    round(avg(accuracy), 0) as avg_accuracy,
    round(avg(consistency), 0) as avg_consistency,
    sum(
      case when mode = 'time' then variant
      else greatest(5, least(600, round((variant * 60.0) / greatest(wpm, 1))))
      end
    )::bigint as time_typed_seconds,
    sum((chars->>'correct')::int + (chars->>'incorrect')::int + (chars->>'extra')::int)::bigint as chars_typed,
    (
      select coalesce(jsonb_object_agg(board_key, best_wpm), '{}'::jsonb)
      from (
        select (mode || ':' || variant::text) as board_key, max(wpm) as best_wpm
        from public.test_results
        where user_id = p_user_id
        group by mode, variant
      ) sub
    ) as best_by_board
  from (
    select *, row_number() over (order by created_at desc) as rn
    from public.test_results
    where user_id = p_user_id
  ) ranked;
$$;

grant execute on function public.get_public_profile_stats(uuid) to anon;
grant execute on function public.get_public_profile_stats(uuid) to authenticated;

-- Recent results for a public profile.
create or replace function public.get_user_results_public(p_user_id uuid, p_limit int default 1000)
returns setof public.test_results
language sql
security definer
set search_path = public
as $$
  select *
  from public.test_results
  where user_id = p_user_id
  order by created_at desc
  limit p_limit;
$$;

grant execute on function public.get_user_results_public(uuid, int) to anon;
grant execute on function public.get_user_results_public(uuid, int) to authenticated;

-- Username search for visiting public profiles.
create or replace function public.search_users(p_query text, p_limit int default 8)
returns table (
  id uuid,
  username text,
  avatar_url text
)
language sql
security definer
set search_path = public
as $$
  select id, username, avatar_url
  from public.profiles
  where username ilike '%' || p_query || '%'
  limit p_limit;
$$;

grant execute on function public.search_users(text, int) to anon;
grant execute on function public.search_users(text, int) to authenticated;

-- Public points lookup (total_xp as bigint to avoid int overflow for high XP).
create or replace function public.get_user_points_by_id(p_user_id uuid)
returns table (
  total_xp bigint,
  level int
)
language sql
security definer
set search_path = public
as $$
  select total_xp, level
  from public.user_points
  where user_id = p_user_id;
$$;

grant execute on function public.get_user_points_by_id(uuid) to anon;
grant execute on function public.get_user_points_by_id(uuid) to authenticated;

-- Public achievements lookup.
create or replace function public.get_user_achievements_by_id(p_user_id uuid)
returns table (
  achievement_id text,
  unlocked_at timestamptz,
  progress int
)
language sql
security definer
set search_path = public
as $$
  select achievement_id, unlocked_at, progress
  from public.user_achievements
  where user_id = p_user_id;
$$;

grant execute on function public.get_user_achievements_by_id(uuid) to anon;
grant execute on function public.get_user_achievements_by_id(uuid) to authenticated;
