/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedPlace } from '../types';

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
    latitude: 37.78,
    longitude: -122.405,
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
];

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} meters`;
  }
  return `${(km * 0.621371).toFixed(2)} miles`;
}
