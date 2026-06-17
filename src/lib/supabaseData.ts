import { RealtimeChannel } from '@supabase/supabase-js';
import { AppNotification, ChatMessage, User } from '../types';
import { DEMO_USER_A_ID, DEMO_USER_B_ID, pairKeyFor } from './demoUsers';
import { getSupabase } from './supabase';
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

export async function loadDemoUsers(): Promise<{ userA: User; userB: User } | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', [DEMO_USER_A_ID, DEMO_USER_B_ID]);

  if (profileError || !profiles?.length) {
    console.error('Failed to load profiles:', profileError);
    return null;
  }

  const { data: locations, error: locationError } = await supabase
    .from('locations')
    .select('*')
    .in('user_id', [DEMO_USER_A_ID, DEMO_USER_B_ID]);

  if (locationError) {
    console.error('Failed to load locations:', locationError);
    return null;
  }

  const locationByUser = new Map((locations as LocationRow[]).map((l) => [l.user_id, l]));
  const profileById = new Map((profiles as ProfileRow[]).map((p) => [p.id, p]));
  const profileA = profileById.get(DEMO_USER_A_ID);
  const profileB = profileById.get(DEMO_USER_B_ID);

  if (!profileA || !profileB) return null;

  return {
    userA: profileLocationToUser(profileA, locationByUser.get(DEMO_USER_A_ID)),
    userB: profileLocationToUser(profileB, locationByUser.get(DEMO_USER_B_ID)),
  };
}

export async function loadNotifications(): Promise<AppNotification[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .in('user_id', [DEMO_USER_A_ID, DEMO_USER_B_ID])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load notifications:', error);
    return [];
  }

  return (data as NotificationRow[]).map(notificationRowToApp);
}

export async function loadChatMessages(pairKey: string): Promise<ChatMessage[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('pair_key', pairKey)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to load chat messages:', error);
    return [];
  }

  return (data as ChatMessageRow[]).map(chatRowToApp);
}

export async function updateUserInDb(userId: string, updates: Partial<User>): Promise<boolean> {
  const supabase = getSupabase();
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
  const hasLocationUpdate = locationFields.some((key) => updates[key] !== undefined);
  if (hasLocationUpdate) {
    const locationRow = userUpdatesToLocationRow(userId, updates);
    const { error } = await supabase.from('locations').upsert(locationRow);
    if (error) {
      console.error('Failed to upsert location:', error);
      return false;
    }
  }

  return true;
}

export async function pairUsersInDb(userAId: string, userBId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { error: errorA } = await supabase.from('profiles').update({ partner_id: userBId }).eq('id', userAId);
  const { error: errorB } = await supabase.from('profiles').update({ partner_id: userAId }).eq('id', userBId);
  return !errorA && !errorB;
}

export async function unpairUsersInDb(userAId: string, userBId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { error: errorA } = await supabase.from('profiles').update({ partner_id: null }).eq('id', userAId);
  const { error: errorB } = await supabase.from('profiles').update({ partner_id: null }).eq('id', userBId);
  return !errorA && !errorB;
}

export async function addNotificationInDb(
  userId: string,
  title: string,
  message: string,
  type: AppNotification['type']
): Promise<AppNotification | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, title, message, type })
    .select()
    .single();

  if (error || !data) {
    console.error('Failed to insert notification:', error);
    return null;
  }

  return notificationRowToApp(data as NotificationRow);
}

export async function clearNotificationsInDb(): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { error } = await supabase
    .from('notifications')
    .delete()
    .in('user_id', [DEMO_USER_A_ID, DEMO_USER_B_ID]);

  return !error;
}

export async function sendChatMessageInDb(pairKey: string, senderId: string, text: string): Promise<ChatMessage | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ pair_key: pairKey, sender_id: senderId, text })
    .select()
    .single();

  if (error || !data) {
    console.error('Failed to send chat message:', error);
    return null;
  }

  return chatRowToApp(data as ChatMessageRow);
}

export function subscribeToRealtime(
  pairKey: string,
  onLocationChange: (row: LocationRow) => void,
  onProfileChange: (row: ProfileRow) => void,
  onNotificationInsert: (row: NotificationRow) => void,
  onChatInsert: (row: ChatMessageRow) => void
): RealtimeChannel | null {
  const supabase = getSupabase();
  if (!supabase) return null;

  return supabase
    .channel('loc-ker-lover-live')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'locations', filter: `user_id=in.(${DEMO_USER_A_ID},${DEMO_USER_B_ID})` },
      (payload) => onLocationChange(payload.new as LocationRow)
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=in.(${DEMO_USER_A_ID},${DEMO_USER_B_ID})` },
      (payload) => onProfileChange(payload.new as ProfileRow)
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications' },
      (payload) => onNotificationInsert(payload.new as NotificationRow)
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `pair_key=eq.${pairKey}` },
      (payload) => onChatInsert(payload.new as ChatMessageRow)
    )
    .subscribe();
}

export function getDemoPairKey(userA: User, userB: User): string {
  return pairKeyFor(userA.id, userB.id);
}
