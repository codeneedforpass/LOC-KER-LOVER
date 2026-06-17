/** Fixed UUIDs for Alex & Taylor demo accounts (see supabase/seed.demo.sql). */
export const DEMO_USER_A_ID = 'a0000000-0000-4000-8000-000000000001';
export const DEMO_USER_B_ID = 'b0000000-0000-4000-8000-000000000002';

export const DEMO_PAIRING_CODES = {
  alex: 'LVR-9426',
  taylor: 'LVR-1378',
} as const;

export function pairKeyFor(userIdA: string, userIdB: string): string {
  return [userIdA, userIdB].sort().join(':');
}

export function userIdFromSlot(userId: 'alex' | 'taylor'): string {
  return userId === 'alex' ? DEMO_USER_A_ID : DEMO_USER_B_ID;
}
