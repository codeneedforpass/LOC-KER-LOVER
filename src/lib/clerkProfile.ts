import type { useUser } from '@clerk/react';
import { getAuthenticatedSupabase } from './supabaseAuth';

type ClerkUser = NonNullable<ReturnType<typeof useUser>['user']>;

function generatePairingCode(): string {
  return `LVR-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function syncClerkProfileToSupabase(user: ClerkUser): Promise<void> {
  const supabase = getAuthenticatedSupabase();
  if (!supabase) return;

  const email = user.primaryEmailAddress?.emailAddress ?? '';
  const fullName = user.fullName ?? user.firstName ?? 'User';
  const profilePicture = user.imageUrl ?? null;

  const { data: existing } = await supabase
    .from('profiles')
    .select('id, pairing_code')
    .eq('clerk_id', user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('profiles')
      .update({ email, full_name: fullName, profile_picture: profilePicture })
      .eq('clerk_id', user.id);
    return;
  }

  const profileId = crypto.randomUUID();
  const pairingCode = generatePairingCode();

  const { error: profileError } = await supabase.from('profiles').insert({
    id: profileId,
    clerk_id: user.id,
    email,
    full_name: fullName,
    profile_picture: profilePicture,
    pairing_code: pairingCode,
    is_location_sharing: false,
    status: 'online',
  });

  if (profileError) {
    console.error('Failed to create Clerk profile in Supabase:', profileError);
    return;
  }

  await supabase.from('locations').insert({
    user_id: profileId,
    latitude: 37.7749,
    longitude: -122.4194,
    battery_percentage: 100,
    is_charging: false,
  });
}
