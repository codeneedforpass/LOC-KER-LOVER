/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  email: string;
  fullName: string;
  latitude: number;
  longitude: number;
  batteryPercentage: number;
  isCharging: boolean;
  lastSeen: string;
  isLocationSharing: boolean;
  partnerId: string | null;
  pairingCode: string;
  profilePicture: string;
  status: 'online' | 'moving' | 'offline' | 'paused';
}

export interface SavedPlace {
  id: string;
  name: string;
  type: 'home' | 'work' | 'school' | 'other';
  latitude: number;
  longitude: number;
  radius: number; // in meters for geofencing
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'sharing_start' | 'sharing_stop' | 'status_change' | 'pair_request' | 'pair_accepted' | 'geofence' | 'emergency';
  timestamp: string;
  read: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface TravelHistoryItem {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  addressName: string;
}

export interface PhotoAsset {
  id: string;
  url: string;
  caption: string;
  uploadedBy: string;
  timestamp: string;
}
