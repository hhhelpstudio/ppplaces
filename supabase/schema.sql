-- ppplaces database schema (Supabase / Postgres)
-- Paste this whole file into the Supabase SQL editor once the project is created.

create extension if not exists "pgcrypto";

-- Shared, cross-user caches (Section 4.3 of the PRD). No owner_id — these are
-- keyed by Google place_id / search signature, not by who searched for them.
create table if not exists places_cache (
  place_id text primary key,
  display_name text,
  rating numeric,
  user_rating_count int,
  primary_type text,
  photo_ref text,
  lat double precision,
  lng double precision,
  rich_metadata jsonb,
  last_basic_fetch_at timestamptz,
  last_rich_fetch_at timestamptz
);

create table if not exists search_cache (
  signature text primary key,
  place_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- User data. owner_id is denormalized onto every table (not just trips) so
-- RLS policies below are a plain equality check instead of a join.
create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled trip',
  mode text not null default 'dream' check (mode in ('dream', 'planning')),
  created_at timestamptz not null default now()
);

create table if not exists days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  order_index int not null default 0,
  trip_date date,
  created_at timestamptz not null default now()
);

create table if not exists stops (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references days(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  place_id text not null references places_cache(place_id),
  order_index int not null default 0,
  time_lock time,
  created_at timestamptz not null default now()
);

-- Row Level Security. This is the non-negotiable step from the security
-- discussion: without these policies, the public anon key the browser uses
-- could read or write every user's trips.
alter table trips enable row level security;
alter table days enable row level security;
alter table stops enable row level security;
alter table places_cache enable row level security;
alter table search_cache enable row level security;

create policy "owners manage their trips" on trips
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "owners manage their days" on days
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "owners manage their stops" on stops
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- places_cache / search_cache: readable by anyone (it's just map metadata,
-- nothing user-specific), but no insert/update/delete policy is defined for
-- anon/authenticated roles, so writes are denied by default. Only the
-- Cloudflare Pages Function writes to these, using the service_role key,
-- which bypasses RLS entirely.
create policy "anyone can read cached places" on places_cache
  for select using (true);

create policy "anyone can read search cache" on search_cache
  for select using (true);
