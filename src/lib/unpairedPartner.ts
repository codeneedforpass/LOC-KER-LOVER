import { User } from '../types';

export const UNPAIRED_PARTNER: User = {
  id: '',
  email: '',
  fullName: 'Partner',
  latitude: 0,
  longitude: 0,
  batteryPercentage: 0,
  isCharging: false,
  lastSeen: '—',
  isLocationSharing: false,
  partnerId: null,
  pairingCode: '',
  profilePicture: '',
  status: 'offline',
};
