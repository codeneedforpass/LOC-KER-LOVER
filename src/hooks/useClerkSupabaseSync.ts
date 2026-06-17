import { useUser } from '@clerk/react';
import { useEffect } from 'react';
import { syncClerkProfileToSupabase } from '../lib/clerkProfile';
import { isSupabaseConfigured } from '../lib/env';

export function useClerkSupabaseSync() {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || !isSupabaseConfigured()) return;
    syncClerkProfileToSupabase(user);
  }, [isLoaded, isSignedIn, user]);
}
