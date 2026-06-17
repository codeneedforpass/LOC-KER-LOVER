import { AppNotification, ChatMessage, User } from '../types';
import { getAuthenticatedSupabase } from './supabaseAuth';
import {
  chatRowToApp,
  ChatMessageRow,
  LocationRow,
  notificationRowToApp,
  NotificationRow,
  profileLocationToUser,
  ProfileRow,
  userUpdatesToLocationRow,
  userUpdatesToProfileRow,
} from './supabaseMappers';
import { pairKeyFor } from './pairKey';

const EMPTY_LOCATION: LocationRow = {
  user_id: '',
  latitude: 0,
  longitude: 0,
  battery_percentage: 100,
  is_charging: false,
  last_seen: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export async function loadProfileByClerkId(clerkId: string): Promise<User | null> {
  const supabase = getAuthenticatedSupabase();
  if (!supabase) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('clerk_id', clerkId)
    .maybeSingle();

  if (error || !profile) {
    console.error('Failed to load profile:', error);
    return null;
  }

  const { data: location } = await supabase
    .from('locations')
    .select('*')
    .eq('user_id', profile.id)
    .maybeSingle();

  return profileLocationToUser(profile as ProfileRow, (location as LocationRow) ?? { ...EMPTY_LOCATION, user_id: profile.id });
}

export async function loadPartnerProfile(partnerId: string): Promise<User | null> {
  const supabase = getAuthenticatedSupabase();
  if (!supabase) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', partnerId)
    .maybeSingle();

  if (error || !profile) return null;

  const { data: location } = await supabase
    .from('locations')
    .select('*')
    .eq('user_id', partnerId)
    .maybeSingle();

  return profileLocationToUser(profile as ProfileRow, (location as LocationRow) ?? { ...EMPTY_LOCATION, user_id: partnerId });
}

export async function pairWithCode(code: string): Promise<boolean> {
  const supabase = getAuthenticatedSupabase();
  if (!supabase) return false;

  const { data, error } = await supabase.rpc('pair_with_code', { partner_code: code.trim().toUpperCase() });
  if (error) {
    console.error('pair_with_code failed:', error);
    return false;
  }
  return Boolean(data);
}

export async function unpairCurrentUser(userId: string, partnerId: string | null): Promise<boolean> {
  const supabase = getAuthenticatedSupabase();
  if (!supabase) return false;

  const { error: selfError } = await supabase.from('profiles').update({ partner_id: null }).eq('id', userId);
  if (partnerId) {
    await supabase.from('profiles').update({ partner_id: null }).eq('id', partnerId);
  }
  return !selfError;
}

export async function updateUserInDb(userId: string, updates: Partial<User>): Promise<boolean> {
  const supabase = getAuthenticatedSupabase();
  if (!supabase) return false;

  const profileUpdates = userUpdatesToProfileRow(updates);
  if (Object.keys(profileUpdates).length > 0) {
    const { error } = await supabase.from('profiles').update(profileUpdates).eq('id', userId);
    if (error) {
      console.error('Failed to update profile:', error);
      return false;
    }
  }

  const locationFields = ['latitude', 'longitude', 'batteryPercentage', 'isCharging'] as const;
  if (locationFields.some((key) => updates[key] !== undefined)) {
    const locationRow = userUpdatesToLocationRow(userId, updates);
    const { error } = await supabase.from('locations').upsert(locationRow);
    if (error) {
      console.error('Failed to upsert location:', error);
      return false;
    }
  }

  return true;
}

export async function loadNotificationsForUser(userId: string): Promise<AppNotification[]> {
  const supabase = getAuthenticatedSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return (data as NotificationRow[]).map(notificationRowToApp);
}

export async function loadChatMessages(pairKey: string): Promise<ChatMessage[]> {
  const supabase = getAuthenticatedSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('pair_key', pairKey)
    .order('created_at', { ascending: true });

  if (error) return [];
  return (data as ChatMessageRow[]).map(chatRowToApp);
}

export async function addNotificationInDb(
  userId: string,
  title: string,
  message: string,
  type: AppNotification['type']
): Promise<AppNotification | null> {
  const supabase = getAuthenticatedSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, title, message, type })
    .select()
    .single();

  if (error || !data) return null;
  return notificationRowToApp(data as NotificationRow);
}

export async function clearNotificationsInDb(userId: string): Promise<boolean> {
  const supabase = getAuthenticatedSupabase();
  if (!supabase) return false;
  const { error } = await supabase.from('notifications').delete().eq('user_id', userId);
  return !error;
}

export async function sendChatMessageInDb(pairKey: string, senderId: string, text: string): Promise<ChatMessage | null> {
  const supabase = getAuthenticatedSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ pair_key: pairKey, sender_id: senderId, text })
    .select()
    .single();

  if (error || !data) return null;
  return chatRowToApp(data as ChatMessageRow);
}

export function getPairKey(user: User, partner: User): string {
  return pairKeyFor(user.id, partner.id);
}

export function subscribeToProductionRealtime(
  userId: string,
  partnerId: string | null,
  pairKey: string | null,
  onLocationChange: (row: LocationRow) => void,
  onProfileChange: (row: ProfileRow) => void,
  onNotificationInsert: (row: NotificationRow) => void,
  onChatInsert: (row: ChatMessageRow) => void
) {
  const supabase = getAuthenticatedSupabase();
  if (!supabase) return null;

  const watchIds = partnerId ? `${userId},${partnerId}` : userId;

  const channel = supabase
    .channel(`loc-ker-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'locations', filter: `user_id=in.(${watchIds})` },
      (payload) => onLocationChange(payload.new as LocationRow)
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=in.(${watchIds})` },
      (payload) => onProfileChange(payload.new as ProfileRow)
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload) => onNotificationInsert(payload.new as NotificationRow)
    );

  if (pairKey) {
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `pair_key=eq.${pairKey}` },
      (payload) => onChatInsert(payload.new as ChatMessageRow)
    );
  }

  return channel.subscribe();
}
