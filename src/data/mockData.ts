/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, SavedPlace } from '../types';

export const INITIAL_USER_A: User = {
  id: 'user-alex',
  email: 'alex@lockerlover.app',
  fullName: 'Alex Carter',
  latitude: 37.7749, // Sweethearts Cafe
  longitude: -122.4194,
  batteryPercentage: 84,
  isCharging: false,
  lastSeen: 'Just now',
  isLocationSharing: true,
  partnerId: 'user-taylor',
  pairingCode: 'LVR-9426',
  profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  status: 'online',
};

export const INITIAL_USER_B: User = {
  id: 'user-taylor',
  email: 'taylor@lockerlover.app',
  fullName: 'Taylor Vance',
  latitude: 37.7833, // Lovers Point Lookout
  longitude: -122.4167,
  batteryPercentage: 42,
  isCharging: true,
  lastSeen: '2m ago',
  isLocationSharing: true,
  partnerId: 'user-alex',
  pairingCode: 'LVR-1378',
  profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  status: 'moving',
};

export const PRESET_PLACES: SavedPlace[] = [
  {
    id: 'place-home',
    name: 'Cozy Nest (Home)',
    type: 'home',
    latitude: 37.7694,
    longitude: -122.4214,
    radius: 100,
  },
  {
    id: 'place-work',
    name: 'Creative Studio (Work)',
    type: 'work',
    latitude: 37.7800,
    longitude: -122.4050,
    radius: 120,
  },
  {
    id: 'place-cafe',
    name: 'Sweethearts Cafe',
    type: 'other',
    latitude: 37.7749,
    longitude: -122.4194,
    radius: 50,
  },
  {
    id: 'place-lookout',
    name: 'Lovers Point Lookout',
    type: 'other',
    latitude: 37.7833,
    longitude: -122.4167,
    radius: 150,
  },
  {
    id: 'place-park',
    name: 'Greenridge Park',
    type: 'school',
    latitude: 37.7600,
    longitude: -122.4100,
    radius: 200,
  }
];

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // returns distance in km
}

export function formatDistance(km: number): string {
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters} meters`;
  }
  const miles = km * 0.621371;
  return `${miles.toFixed(2)} miles`;
}
