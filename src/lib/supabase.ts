import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from './env';

let client: SupabaseClient | null = null;

/**
 * Returns a Supabase client when URL + anon key are set.
 * While VITE_USE_MOCK_DATA=true (default), the UI still uses in-memory state.
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!client) {
    client = createClient(env.supabase.url!, env.supabase.anonKey!);
  }

  return client;
}
