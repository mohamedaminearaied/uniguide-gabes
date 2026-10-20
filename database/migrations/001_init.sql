-- =====================================================================
-- UniGuide Gabès — database setup (safe to run more than once)
-- Run in: Supabase Dashboard -> SQL Editor -> New query -> paste -> Run
-- It creates what is missing and never deletes data.
-- =====================================================================

-- 1. PostGIS (for "nearby places"). Supabase keeps extensions in the "extensions" schema.
create extension if not exists postgis with schema extensions;

-- 2. Profiles: one row per signed-up user, holds the ROLE (student | admin)
create table if not exists public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  display_name       text,
  preferred_language text not null default 'fr' check (preferred_language in ('ar', 'fr', 'en')),
  role               text not null default 'student' check (role in ('student', 'admin')),
  created_at         timestamptz not null default now()
);
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists preferred_language text not null default 'fr';
alter table public.profiles add column if not exists role text not null default 'student';
alter table public.profiles add column if not exists created_at timestamptz not null default now();

-- 3. Places
create table if not exists public.places (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (char_length(name) between 2 and 120),
  description      text,
  category         text not null default 'other',
  latitude         double precision not null check (latitude  between -90  and 90),
  longitude        double precision not null check (longitude between -180 and 180),
  source_url       text,
  submitter_email  text,
  submitter_id     uuid references auth.users(id) on delete set null,
  status           text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  submitted_at     timestamptz not null default now(),
  reviewed_at      timestamptz
);
alter table public.places add column if not exists description      text;
alter table public.places add column if not exists source_url       text;
alter table public.places add column if not exists submitter_email  text;
alter table public.places add column if not exists submitter_id     uuid references auth.users(id) on delete set null;
alter table public.places add column if not exists rejection_reason text;
alter table public.places add column if not exists submitted_at     timestamptz not null default now();
alter table public.places add column if not exists reviewed_at      timestamptz;

-- Geography column used by GET /places/nearby. Generated from latitude/longitude, so it can never drift.
alter table public.places add column if not exists location extensions.geography(Point, 4326)
  generated always as (
    extensions.st_setsrid(extensions.st_makepoint(longitude, latitude), 4326)::extensions.geography
  ) stored;

create index if not exists places_status_idx    on public.places (status);
create index if not exists places_category_idx  on public.places (category);
create index if not exists places_submitter_idx on public.places (submitter_id);
create index if not exists places_location_gix  on public.places using gist (location);

-- 4. Automatically create a profile (role = student) whenever someone signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Give a profile to people who signed up before this script existed
insert into public.profiles (id, display_name)
select u.id, coalesce(nullif(u.raw_user_meta_data ->> 'display_name', ''), split_part(u.email, '@', 1))
from auth.users u
on conflict (id) do nothing;

-- 5. Security. The API connects directly to Postgres, so the public Supabase REST API
--    does not need access to these tables at all: turn on RLS and grant almost nothing.
alter table public.profiles enable row level security;
alter table public.places   enable row level security;

drop policy if exists "profiles: read own row" on public.profiles;
create policy "profiles: read own row"
  on public.profiles for select to authenticated
  using (id = auth.uid());
-- (No insert/update/delete policies: browsers can never change a profile or a place.)

-- Defence in depth: even if a policy is added by mistake later, a browser session can
-- never give itself the admin role. Only the SQL editor / the API / make-admin can.
create or replace function public.block_role_escalation()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), '') in ('anon', 'authenticated') then
    if tg_op = 'INSERT' and new.role <> 'student' then
      raise exception 'role can only be set by the server';
    elsif tg_op = 'UPDATE' and new.role is distinct from old.role then
      raise exception 'role can only be changed by the server';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_block_role_escalation on public.profiles;
create trigger profiles_block_role_escalation
  before insert or update on public.profiles
  for each row execute function public.block_role_escalation();

-- 6. Quick check: you should see both tables, and rls = true for each
select tablename, rowsecurity as rls
from pg_tables
where schemaname = 'public' and tablename in ('profiles', 'places');
