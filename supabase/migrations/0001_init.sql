-- =============================================================
-- zentype v2 — initial schema
-- Run in Supabase dashboard → SQL Editor, or via supabase CLI:
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

create policy "profiles are readable by everyone"
  on public.profiles for select
  using (true);

create policy "users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

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
  created_at   timestamptz not null default now()
);

-- guest→account merge deduplication
create unique index if not exists test_results_user_local_id_idx
  on public.test_results (user_id, local_id)
  where local_id is not null;

create index if not exists test_results_user_created_idx
  on public.test_results (user_id, created_at desc);

create index if not exists test_results_board_idx
  on public.test_results (mode, variant, wpm desc);

alter table public.test_results enable row level security;

create policy "users insert own results"
  on public.test_results for insert
  with check (auth.uid() = user_id);

create policy "users read own results"
  on public.test_results for select
  using (auth.uid() = user_id);

create policy "users delete own results"
  on public.test_results for delete
  using (auth.uid() = user_id);

-- NOTE: leaderboards are served from Upstash Redis; the Postgres fallback path
-- reads test_results directly from the server using the anon key. Because RLS
-- restricts selects to the row owner, the fallback leaderboard only works for
-- authenticated reads of *aggregated* data via the server function when Redis
-- is unavailable. If you want the SQL fallback to expose usernames, create a
-- security-definer RPC instead of loosening RLS.
