-- =====================================================================
-- UniGuide Gabès — security hardening (safe to run more than once)
-- Run AFTER 001_init.sql, in: Supabase Dashboard -> SQL Editor -> New query -> Run
-- =====================================================================

-- 1. Lock the tables for the public Supabase REST API.
--    Only the UniGuide API (which connects directly as the database owner) may read or write them.
--    Browsers use Supabase only for login, never for these tables.
alter table public.profiles enable row level security;
alter table public.places   enable row level security;

drop policy if exists "profiles: read own row" on public.profiles;   -- no longer needed

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on public.profiles from anon';
    execute 'revoke all on public.places   from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on public.profiles from authenticated';
    execute 'revoke all on public.places   from authenticated';
  end if;
end $$;

-- 2. Audit log: who approved / rejected / published what, and when. Only the API can write or read it.
create table if not exists public.audit_log (
  id          bigint generated always as identity primary key,
  at          timestamptz not null default now(),
  actor_id    uuid,
  actor_email text,
  action      text not null,          -- place.create | place.approve | place.reject
  place_id    uuid,
  details     jsonb
);
create index if not exists audit_log_at_idx on public.audit_log (at desc);
alter table public.audit_log enable row level security;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on public.audit_log from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on public.audit_log from authenticated';
  end if;
end $$;

-- 3. Data rules enforced by the database itself (apply to NEW and changed rows; old rows are left alone)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'places_category_check') then
    alter table public.places add constraint places_category_check
      check (category in ('faculty','housing','library','cafe','transport','pharmacy','other')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'places_source_url_check') then
    alter table public.places add constraint places_source_url_check
      check (source_url is null or source_url ~* '^https?://') not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'places_description_len_check') then
    alter table public.places add constraint places_description_len_check
      check (description is null or char_length(description) <= 1000) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'places_reason_len_check') then
    alter table public.places add constraint places_reason_len_check
      check (rejection_reason is null or char_length(rejection_reason) <= 300) not valid;
  end if;
end $$;

-- 4. Check: all three tables must show rls = true
select tablename, rowsecurity as rls
from pg_tables
where schemaname = 'public' and tablename in ('profiles', 'places', 'audit_log')
order by tablename;
