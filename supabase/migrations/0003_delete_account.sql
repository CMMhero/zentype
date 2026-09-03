-- =============================================================
-- zentype — self-service account deletion
-- Run this once (in the Supabase dashboard → SQL Editor, or via
-- supabase db push) after 0001_schema.sql and 0002_functions.sql.
-- Idempotent: safe to re-run.
-- =============================================================

-- Self-service account deletion. Verifies the caller is deleting their own
-- auth user, then removes it. Every related row (profiles, test_results,
-- user_settings, user_points, point_events, user_achievements) references
-- auth.users with on delete cascade, so this wipes the whole account.
create or replace function public.delete_account()
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

  delete from auth.users where id = v_uid;
end;
$$;

-- Only signed-in users may delete their own account (auth.uid() check above).
grant execute on function public.delete_account() to authenticated;
