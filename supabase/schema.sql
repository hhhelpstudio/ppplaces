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

-- Road-aligned route geometry (Section 4.5) — signature is the ordered
-- stop points + travel mode, so reopening a trip's plan reuses the same
-- Directions result instead of re-calling Google every render. Road
-- geometry between two fixed points essentially never changes, so this
-- gets a long TTL (see functions/api/route.js).
create table if not exists route_cache (
  signature text primary key,
  path jsonb not null,
  created_at timestamptz not null default now()
);

-- User data. owner_id is denormalized onto every table (not just trips) so
-- RLS policies below are a plain equality check instead of a join.
create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled trip',
  mode text not null default 'dream' check (mode in ('dream', 'planning')),
  lat double precision,
  lng double precision,
  location_name text,
  created_at timestamptz not null default now()
);

-- Safe to re-run on an already-provisioned project: adds the working-location
-- columns above if this schema was applied before they existed.
alter table trips add column if not exists lat double precision;
alter table trips add column if not exists lng double precision;
alter table trips add column if not exists location_name text;

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
  visited_at timestamptz, -- arrival check-in (USER_FLOW.md Step 8)
  created_at timestamptz not null default now()
);

-- For databases created before arrival check-ins existed.
alter table stops add column if not exists visited_at timestamptz;

-- Row Level Security. This is the non-negotiable step from the security
-- discussion: without these policies, the public anon key the browser uses
-- could read or write every user's trips.
alter table trips enable row level security;
alter table days enable row level security;
alter table stops enable row level security;
alter table places_cache enable row level security;
alter table search_cache enable row level security;
alter table route_cache enable row level security;

-- CREATE POLICY has no IF NOT EXISTS in Postgres, so each is preceded by a
-- DROP IF EXISTS — that's what makes this whole file safe to paste and run
-- again later (e.g. after a schema change) without erroring on policies
-- that already exist from a previous run.
drop policy if exists "owners manage their trips" on trips;
create policy "owners manage their trips" on trips
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "owners manage their days" on days;
create policy "owners manage their days" on days
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "owners manage their stops" on stops;
create policy "owners manage their stops" on stops
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- places_cache / search_cache: readable by anyone (it's just map metadata,
-- nothing user-specific), but no insert/update/delete policy is defined for
-- anon/authenticated roles, so writes are denied by default. Only the
-- Cloudflare Pages Function writes to these, using the service_role key,
-- which bypasses RLS entirely.
drop policy if exists "anyone can read cached places" on places_cache;
create policy "anyone can read cached places" on places_cache
  for select using (true);

drop policy if exists "anyone can read search cache" on search_cache;
create policy "anyone can read search cache" on search_cache
  for select using (true);

drop policy if exists "anyone can read route cache" on route_cache;
create policy "anyone can read route cache" on route_cache
  for select using (true);
