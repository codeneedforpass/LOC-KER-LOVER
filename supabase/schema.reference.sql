# Reference schema — run in Supabase SQL Editor when wiring the live backend.
# Not applied automatically; enable RLS on every table before production.

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null,
  profile_picture text,
  pairing_code text unique not null,
  partner_id uuid references public.profiles (id),
  is_location_sharing boolean not null default false,
  status text not null default 'offline' check (status in ('online', 'moving', 'offline', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Latest location per user (Realtime-friendly)
create table if not exists public.locations (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  battery_percentage smallint,
  is_charging boolean default false,
  last_seen timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  message text not null,
  type text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  pair_key text not null,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.locations enable row level security;
alter table public.notifications enable row level security;
alter table public.chat_messages enable row level security;

-- Example policies (tighten for production)
create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id or auth.uid() = partner_id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users read partner location"
  on public.locations for select
  using (
    auth.uid() = user_id
    or user_id in (select partner_id from public.profiles where id = auth.uid())
  );

create policy "Users upsert own location"
  on public.locations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
