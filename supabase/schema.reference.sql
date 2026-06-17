-- Loc-Ker Lover schema — paste into Supabase Dashboard → SQL Editor → Run.
-- Skip the GitHub integration; manage schema manually in the dashboard.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null,
  profile_picture text,
  pairing_code text unique not null,
  clerk_id text unique,
  partner_id uuid references public.profiles (id),
  is_location_sharing boolean not null default false,
  status text not null default 'offline' check (status in ('online', 'moving', 'offline', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.locations (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  battery_percentage smallint,
  is_charging boolean default false,
  last_seen timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  message text not null,
  type text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  pair_key text not null,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create index chat_messages_pair_key_created_at_idx
  on public.chat_messages (pair_key, created_at desc);

create index notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger locations_set_updated_at
  before update on public.locations
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.locations enable row level security;
alter table public.notifications enable row level security;
alter table public.chat_messages enable row level security;

create policy "Users read own or partner profile"
  on public.profiles for select
  using (auth.uid() = id or auth.uid() = partner_id);

create policy "Users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users read own or partner location"
  on public.locations for select
  using (
    auth.uid() = user_id
    or user_id in (select partner_id from public.profiles where id = auth.uid())
  );

create policy "Users upsert own location"
  on public.locations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "Users read paired chat messages"
  on public.chat_messages for select
  using (
    sender_id = auth.uid()
    or pair_key in (
      select least(id::text, partner_id::text) || ':' || greatest(id::text, partner_id::text)
      from public.profiles
      where id = auth.uid() and partner_id is not null
    )
  );

create policy "Users send chat messages"
  on public.chat_messages for insert
  with check (auth.uid() = sender_id);

alter publication supabase_realtime add table public.locations;
