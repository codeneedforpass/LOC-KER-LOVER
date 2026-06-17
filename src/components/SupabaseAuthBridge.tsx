import { useSession } from '@clerk/react';
import { useEffect } from 'react';
import { setClerkTokenGetter } from '../lib/supabaseAuth';

export default function SupabaseAuthBridge() {
  const { session, isLoaded } = useSession();

  useEffect(() => {
    if (!isLoaded) return;

    if (!session) {
      setClerkTokenGetter(null);
      return;
    }

    setClerkTokenGetter(async () => {
      try {
        return await session.getToken({ template: 'supabase' });
      } catch {
        return await session.getToken();
      }
    });
  }, [isLoaded, session]);

  return null;
}
