# Supabase SQL — run in this order

1. `schema.reference.sql` — tables + base RLS
2. `clerk.schema.sql` — `clerk_id` column on profiles
3. `production.clerk-rls.sql` — Clerk JWT policies + `pair_with_code` RPC

Enable Clerk → Supabase integration in the Clerk Dashboard before testing the app.
