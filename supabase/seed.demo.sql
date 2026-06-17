-- Run AFTER schema.reference.sql
-- Seeds Alex & Taylor demo accounts + simulator-friendly RLS (dev only).

-- Demo user UUIDs (must match src/lib/demoUsers.ts)
-- Alex:  a0000000-0000-4000-8000-000000000001
-- Taylor: b0000000-0000-4000-8000-000000000002

-- Simulator policies: dual-phone UI uses one anon client (no dual auth sessions).
-- Remove these policies before production.
create policy "Simulator anon profiles"
  on public.profiles for all to anon
  using (true) with check (true);

create policy "Simulator anon locations"
  on public.locations for all to anon
  using (true) with check (true);

create policy "Simulator anon notifications"
  on public.notifications for all to anon
  using (true) with check (true);

create policy "Simulator anon chat"
  on public.chat_messages for all to anon
  using (true) with check (true);

-- Demo auth users (password: password123)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
(
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-4000-8000-000000000001',
  'authenticated', 'authenticated', 'alex@lockerlover.app',
  crypt('password123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now()
),
(
  '00000000-0000-0000-0000-000000000000',
  'b0000000-0000-4000-8000-000000000002',
  'authenticated', 'authenticated', 'taylor@lockerlover.app',
  crypt('password123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now()
)
on conflict (id) do nothing;

insert into public.profiles (
  id, email, full_name, profile_picture, pairing_code, partner_id,
  is_location_sharing, status
) values
(
  'a0000000-0000-4000-8000-000000000001',
  'alex@lockerlover.app', 'Alex Carter',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  'LVR-9426', 'b0000000-0000-4000-8000-000000000002', true, 'online'
),
(
  'b0000000-0000-4000-8000-000000000002',
  'taylor@lockerlover.app', 'Taylor Vance',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  'LVR-1378', 'a0000000-0000-4000-8000-000000000001', true, 'moving'
)
on conflict (id) do nothing;

insert into public.locations (
  user_id, latitude, longitude, battery_percentage, is_charging, last_seen
) values
('a0000000-0000-4000-8000-000000000001', 37.7749, -122.4194, 84, false, now()),
('b0000000-0000-4000-8000-000000000002', 37.7833, -122.4167, 42, true, now())
on conflict (user_id) do update set
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  battery_percentage = excluded.battery_percentage,
  is_charging = excluded.is_charging,
  last_seen = excluded.last_seen;
