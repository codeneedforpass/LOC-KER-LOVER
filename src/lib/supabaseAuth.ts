import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from './env';

export type GetClerkToken = () => Promise<string | null>;

let anonClient: SupabaseClient | null = null;
let authedClient: SupabaseClient | null = null;
let tokenGetter: GetClerkToken | null = null;

export function setClerkTokenGetter(getter: GetClerkToken | null): void {
  tokenGetter = getter;
  authedClient = null;
}

export function getAnonSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!anonClient) {
    anonClient = createClient(env.supabase.url!, env.supabase.anonKey!);
  }
  return anonClient;
}

export function getAuthenticatedSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured() || !tokenGetter) return null;

  if (!authedClient) {
    authedClient = createClient(env.supabase.url!, env.supabase.anonKey!, {
      accessToken: async () => (await tokenGetter!()) ?? null,
    });
  }

  return authedClient;
}

/** @deprecated Use getAuthenticatedSupabase when signed in */
export function getSupabase(): SupabaseClient | null {
  return getAuthenticatedSupabase() ?? getAnonSupabase();
}
