import { useSession, useUser } from '@clerk/react';
import { useEffect } from 'react';
import { syncClerkProfileToSupabase } from '../lib/clerkProfile';
import { isSupabaseConfigured } from '../lib/env';

export function useClerkSupabaseSync() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { session } = useSession();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || !session || !isSupabaseConfigured()) return;

    (async () => {
      const token = await session.getToken({ template: 'supabase' }).catch(() => session.getToken());
      if (!token) return;
      await syncClerkProfileToSupabase(user);
    })();
  }, [isLoaded, isSignedIn, user, session]);
}
