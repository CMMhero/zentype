-- =============================================================
-- zentype — schema (consolidated from the original 0001-0009 files)
-- Tables, indexes, RLS policies, and the auth signup trigger.
-- Safe to run on a fresh project or re-run on an existing one:
-- every statement is idempotent.
-- Run in Supabase dashboard → SQL Editor, or via:
--   supabase db push   (after linking your project)
-- =============================================================

-- ---------- profiles ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text unique,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are readable by everyone" on public.profiles;
create policy "profiles are readable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- auto-create profile when a user signs up (OAuth metadata → username)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_username text;
  final_username text;
  suffix int := 0;
begin
  base_username := coalesce(
    new.raw_user_meta_data ->> 'user_name',
    new.raw_user_meta_data ->> 'preferred_username',
    regexp_replace(coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)), '\s+', '_', 'gi'),
    'user'
  );
  -- sanitize: letters/numbers/underscore only, 3..24 chars
  base_username := substring(regexp_replace(base_username, '[^a-zA-Z0-9_]', '', 'g') || '___', 1, 24);
  final_username := base_username;

  while exists (select 1 from public.profiles p where p.username = final_username) loop
    suffix := suffix + 1;
    final_username := substring(base_username, 1, 24 - length(suffix::text)) || suffix::text;
  end loop;

  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    lower(final_username),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- test results ----------
create table if not exists public.test_results (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  local_id     text,
  mode         text not null check (mode in ('time', 'words')),
  variant      int  not null check (variant > 0),
  source       text not null default 'words',
  wpm          numeric(6,2) not null check (wpm >= 0),
  raw_wpm      numeric(6,2) not null check (raw_wpm >= 0),
  accuracy     numeric(5,2) not null check (accuracy >= 0 and accuracy <= 100),
  consistency  numeric(5,2) not null default 0 check (consistency >= 0 and consistency <= 100),
  chars        jsonb not null default '{}'::jsonb,
  timeline     jsonb not null default '[]'::jsonb,
  punctuation  boolean not null default false,
  numbers      boolean not null default false,
  created_at   timestamptz not null default now()
);

-- guards for databases migrated before the punctuation/numbers columns landed
-- (no-op on fresh setups, where the columns are part of create table)
alter table public.test_results add column if not exists punctuation boolean not null default false;
alter table public.test_results add column if not exists numbers boolean not null default false;

-- guest→account merge deduplication
create unique index if not exists test_results_user_local_id_idx
  on public.test_results (user_id, local_id)
  where local_id is not null;

create index if not exists test_results_user_created_idx
  on public.test_results (user_id, created_at desc);

create index if not exists test_results_board_idx
  on public.test_results (mode, variant, wpm desc);

alter table public.test_results enable row level security;

-- leaderboards and public profiles read through a security-definer RPC
-- (see 0002), so the fallback path also works for anonymous reads
drop policy if exists "public read access for test_results" on public.test_results;
create policy "public read access for test_results"
  on public.test_results for select
  using (true);

drop policy if exists "users insert own results" on public.test_results;
create policy "users insert own results"
  on public.test_results for insert
  with check (auth.uid() = user_id);

drop policy if exists "users delete own results" on public.test_results;
create policy "users delete own results"
  on public.test_results for delete
  using (auth.uid() = user_id);

-- ---------- user settings ----------
create table if not exists public.user_settings (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  settings     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.user_settings enable row level security;

drop policy if exists "users read own settings" on public.user_settings;
create policy "users read own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

drop policy if exists "users insert own settings" on public.user_settings;
create policy "users insert own settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

drop policy if exists "users update own settings" on public.user_settings;
create policy "users update own settings"
  on public.user_settings for update
  using (auth.uid() = user_id);

-- ---------- gamification: points, events, achievements ----------
create table if not exists public.user_points (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_xp integer not null default 0,
  level integer not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists public.point_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  awarded integer not null,
  total integer not null,
  event_type text not null,
  event_data jsonb default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_point_events_user
  on public.point_events (user_id, created_at desc);

create table if not exists public.user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null,
  unlocked_at timestamptz not null default now(),
  progress integer default 0,
  primary key (user_id, achievement_id)
);

create index if not exists idx_user_achievements_user
  on public.user_achievements (user_id);

alter table public.user_points enable row level security;
alter table public.point_events enable row level security;
alter table public.user_achievements enable row level security;

-- owner-only reads/writes for gamification internals
drop policy if exists "Users can read own points" on public.user_points;
create policy "Users can read own points"
  on public.user_points for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own points" on public.user_points;
create policy "Users can insert own points"
  on public.user_points for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own points" on public.user_points;
create policy "Users can update own points"
  on public.user_points for update using (auth.uid() = user_id);

drop policy if exists "Users can read own point events" on public.point_events;
create policy "Users can read own point events"
  on public.point_events for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own point events" on public.point_events;
create policy "Users can insert own point events"
  on public.point_events for insert with check (auth.uid() = user_id);

drop policy if exists "Users can read own achievements" on public.user_achievements;
create policy "Users can read own achievements"
  on public.user_achievements for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own achievements" on public.user_achievements;
create policy "Users can insert own achievements"
  on public.user_achievements for insert with check (auth.uid() = user_id);

-- public reads for the level leaderboard (all users' XP)
drop policy if exists "public read access for user_points" on public.user_points;
create policy "public read access for user_points"
  on public.user_points for select using (true);
