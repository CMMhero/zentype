-- =============================================================
-- zentype — self-service account data reset
-- Run this once (Supabase dashboard → SQL Editor, or supabase db
-- push) after the earlier migrations. Idempotent: safe to re-run.
-- =============================================================

-- Wipes every record owned by the caller (results, settings, xp/points,
-- achievements) while keeping the account itself — auth user + profile
-- (username, avatar, join date) — so it feels like a brand-new account.
-- Runs as security definer and only touches auth.uid()'s own rows.
create or replace function public.reset_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  select auth.uid() into v_uid;
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  delete from public.test_results where user_id = v_uid;
  delete from public.user_settings where user_id = v_uid;
  delete from public.user_points where user_id = v_uid;
  delete from public.point_events where user_id = v_uid;
  delete from public.user_achievements where user_id = v_uid;
end;
$$;

-- Only signed-in users may reset their own data (auth.uid() check above).
grant execute on function public.reset_account() to authenticated;
