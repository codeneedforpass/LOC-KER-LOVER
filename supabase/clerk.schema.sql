-- Run AFTER schema.reference.sql (and seed.demo.sql if used)
-- Links Clerk user IDs to Supabase profiles for signed-in users.

alter table public.profiles
  drop constraint if exists profiles_id_fkey;

alter table public.profiles
  add column if not exists clerk_id text unique;

create index if not exists profiles_clerk_id_idx on public.profiles (clerk_id);

-- Simulator policies from seed.demo.sql already allow anon writes for the dual-phone demo.
