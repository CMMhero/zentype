-- =============================================================
-- ZenType v2 — user settings persistence
-- Run in Supabase dashboard → SQL Editor
-- =============================================================

create table if not exists public.user_settings (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  settings     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "users read own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "users insert own settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

create policy "users update own settings"
  on public.user_settings for update
  using (auth.uid() = user_id);
