-- Run AFTER schema.reference.sql and clerk.schema.sql
-- Enables Clerk JWT auth for production (replaces auth.uid() policies + demo anon policies).
--
-- Clerk Dashboard → Configure → Supabase → enable integration (JWT template "supabase").
-- https://clerk.com/docs/integrations/databases/supabase

-- Remove demo simulator policies if present
drop policy if exists "Simulator anon profiles" on public.profiles;
drop policy if exists "Simulator anon locations" on public.locations;
drop policy if exists "Simulator anon notifications" on public.notifications;
drop policy if exists "Simulator anon chat" on public.chat_messages;

-- Remove Supabase Auth policies (app uses Clerk, not Supabase Auth)
drop policy if exists "Users read own or partner profile" on public.profiles;
drop policy if exists "Users insert own profile" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;
drop policy if exists "Users read own or partner location" on public.locations;
drop policy if exists "Users upsert own location" on public.locations;
drop policy if exists "Users read own notifications" on public.notifications;
drop policy if exists "Users update own notifications" on public.notifications;
drop policy if exists "Users read paired chat messages" on public.chat_messages;
drop policy if exists "Users send chat messages" on public.chat_messages;

create or replace function public.current_clerk_id()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'sub', '');
$$;

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles where clerk_id = public.current_clerk_id() limit 1;
$$;

-- Profiles
create policy "Clerk read own or partner profile"
  on public.profiles for select
  using (
    clerk_id = public.current_clerk_id()
    or id in (select partner_id from public.profiles where clerk_id = public.current_clerk_id())
  );

create policy "Clerk insert own profile"
  on public.profiles for insert
  with check (clerk_id = public.current_clerk_id());

create policy "Clerk update own profile"
  on public.profiles for update
  using (clerk_id = public.current_clerk_id())
  with check (clerk_id = public.current_clerk_id());

-- Locations
create policy "Clerk read own or partner location"
  on public.locations for select
  using (
    user_id = public.current_profile_id()
    or user_id in (select partner_id from public.profiles where clerk_id = public.current_clerk_id())
  );

create policy "Clerk upsert own location"
  on public.locations for all
  using (user_id = public.current_profile_id())
  with check (user_id = public.current_profile_id());

-- Notifications
create policy "Clerk read own notifications"
  on public.notifications for select
  using (user_id = public.current_profile_id());

create policy "Clerk update own notifications"
  on public.notifications for update
  using (user_id = public.current_profile_id());

create policy "Clerk insert notifications for self or partner"
  on public.notifications for insert
  with check (
    user_id = public.current_profile_id()
    or user_id in (select partner_id from public.profiles where clerk_id = public.current_clerk_id())
  );

-- Chat
create policy "Clerk read paired chat"
  on public.chat_messages for select
  using (
    pair_key in (
      select least(p.id::text, p.partner_id::text) || ':' || greatest(p.id::text, p.partner_id::text)
      from public.profiles p
      where p.clerk_id = public.current_clerk_id() and p.partner_id is not null
    )
  );

create policy "Clerk send chat"
  on public.chat_messages for insert
  with check (sender_id = public.current_profile_id());

-- Pair with partner code (both sides updated atomically)
create or replace function public.pair_with_code(partner_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid;
  them uuid;
begin
  select id into me from public.profiles where clerk_id = public.current_clerk_id();
  select id into them from public.profiles where pairing_code = upper(trim(partner_code)) and id <> me;

  if me is null or them is null then
    return false;
  end if;

  update public.profiles set partner_id = them where id = me;
  update public.profiles set partner_id = me where id = them;
  return true;
end;
$$;

grant execute on function public.pair_with_code(text) to authenticated;
grant execute on function public.current_profile_id() to authenticated;
