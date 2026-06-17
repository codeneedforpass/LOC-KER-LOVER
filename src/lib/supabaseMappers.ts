import { AppNotification, ChatMessage, User } from '../types';

export interface ProfileRow {
  id: string;
  email: string;
  full_name: string;
  profile_picture: string | null;
  pairing_code: string;
  partner_id: string | null;
  is_location_sharing: boolean;
  status: User['status'];
  created_at: string;
  updated_at: string;
}

export interface LocationRow {
  user_id: string;
  latitude: number;
  longitude: number;
  battery_percentage: number | null;
  is_charging: boolean | null;
  last_seen: string;
  updated_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export interface ChatMessageRow {
  id: string;
  pair_key: string;
  sender_id: string;
  text: string;
  created_at: string;
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}

export function profileLocationToUser(profile: ProfileRow, location?: LocationRow | null): User {
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    profilePicture: profile.profile_picture ?? '',
    pairingCode: profile.pairing_code,
    partnerId: profile.partner_id,
    isLocationSharing: profile.is_location_sharing,
    status: profile.status,
    latitude: location?.latitude ?? 0,
    longitude: location?.longitude ?? 0,
    batteryPercentage: location?.battery_percentage ?? 0,
    isCharging: location?.is_charging ?? false,
    lastSeen: location ? formatRelativeTime(location.last_seen) : 'Unknown',
  };
}

export function userUpdatesToProfileRow(updates: Partial<User>): Partial<ProfileRow> {
  const row: Partial<ProfileRow> = {};
  if (updates.email !== undefined) row.email = updates.email;
  if (updates.fullName !== undefined) row.full_name = updates.fullName;
  if (updates.profilePicture !== undefined) row.profile_picture = updates.profilePicture;
  if (updates.pairingCode !== undefined) row.pairing_code = updates.pairingCode;
  if (updates.partnerId !== undefined) row.partner_id = updates.partnerId;
  if (updates.isLocationSharing !== undefined) row.is_location_sharing = updates.isLocationSharing;
  if (updates.status !== undefined) row.status = updates.status;
  return row;
}

export function userUpdatesToLocationRow(userId: string, updates: Partial<User>): Partial<LocationRow> & { user_id: string } {
  const row: Partial<LocationRow> & { user_id: string } = { user_id: userId };
  if (updates.latitude !== undefined) row.latitude = updates.latitude;
  if (updates.longitude !== undefined) row.longitude = updates.longitude;
  if (updates.batteryPercentage !== undefined) row.battery_percentage = updates.batteryPercentage;
  if (updates.isCharging !== undefined) row.is_charging = updates.isCharging;
  if (
    updates.latitude !== undefined ||
    updates.longitude !== undefined ||
    updates.batteryPercentage !== undefined ||
    updates.isCharging !== undefined
  ) {
    row.last_seen = new Date().toISOString();
  }
  return row;
}

export function notificationRowToApp(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    type: row.type as AppNotification['type'],
    timestamp: formatRelativeTime(row.created_at),
    read: row.read,
  };
}

export function chatRowToApp(row: ChatMessageRow): ChatMessage {
  return {
    id: row.id,
    senderId: row.sender_id,
    text: row.text,
    timestamp: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}
