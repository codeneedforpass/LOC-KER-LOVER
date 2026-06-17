/**
 * Typed access to Vite environment variables.
 * All client-safe config uses the VITE_ prefix.
 */

function read(key: keyof ImportMetaEnv): string | undefined {
  const value = import.meta.env[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export const env = {
  appUrl: read('VITE_APP_URL') ?? 'http://localhost:3000',
  appEnv: (read('VITE_APP_ENV') ?? 'development') as ImportMetaEnv['VITE_APP_ENV'],
  useMockData: read('VITE_USE_MOCK_DATA') !== 'false',
  supabase: {
    url: read('VITE_SUPABASE_URL'),
    anonKey: read('VITE_SUPABASE_ANON_KEY'),
  },
  clerk: {
    publishableKey: read('VITE_CLERK_PUBLISHABLE_KEY'),
  },
  mapboxToken: read('VITE_MAPBOX_TOKEN'),
  oneSignalAppId: read('VITE_ONESIGNAL_APP_ID'),
} as const;

export function isClerkConfigured(): boolean {
  return Boolean(env.clerk.publishableKey);
}

export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabase.url && env.supabase.anonKey);
}
