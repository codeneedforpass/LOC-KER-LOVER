import { useUser } from '@clerk/react';
import { useCallback, useEffect, useState } from 'react';
import { UNPAIRED_PARTNER } from '../lib/unpairedPartner';
import { recordPartnerAlertEvent } from '../lib/onesignal';
import {
  addNotificationInDb,
  clearNotificationsInDb,
  getPairKey,
  loadChatMessages,
  loadNotificationsForUser,
  loadPartnerProfile,
  loadProfileByClerkId,
  pairWithCode,
  sendChatMessageInDb,
  subscribeToProductionRealtime,
  unpairCurrentUser,
  updateUserInDb,
} from '../lib/productionData';
import {
  chatRowToApp,
  LocationRow,
  notificationRowToApp,
  NotificationRow,
  profileLocationToUser,
  ProfileRow,
} from '../lib/supabaseMappers';
import { useGeolocation } from './useGeolocation';
import { AppNotification, ChatMessage, User } from '../types';

export function useProductionState() {
  const { user: clerkUser, isLoaded } = useUser();
  const [self, setSelf] = useState<User | null>(null);
  const [partner, setPartner] = useState<User>(UNPAIRED_PARTNER);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [ready, setReady] = useState(false);

  const reloadPartner = useCallback(async (partnerId: string | null) => {
    if (!partnerId) {
      setPartner(UNPAIRED_PARTNER);
      return;
    }
    const loaded = await loadPartnerProfile(partnerId);
    setPartner(loaded ?? UNPAIRED_PARTNER);
  }, []);

  const reloadSelf = useCallback(async () => {
    if (!clerkUser) return null;
    const profile = await loadProfileByClerkId(clerkUser.id);
    if (profile) setSelf(profile);
    return profile;
  }, [clerkUser]);

  useEffect(() => {
    if (!isLoaded || !clerkUser) return;

    let cancelled = false;

    (async () => {
      for (let attempt = 0; attempt < 8; attempt++) {
        const profile = await loadProfileByClerkId(clerkUser.id);
        if (cancelled) return;
        if (profile) {
          setSelf(profile);
          if (profile.partnerId) await reloadPartner(profile.partnerId);
          setNotifications(await loadNotificationsForUser(profile.id));
          if (profile.partnerId) {
            const p = await loadPartnerProfile(profile.partnerId);
            if (p) {
              setPartner(p);
              setChatMessages(await loadChatMessages(getPairKey(profile, p)));
            }
          }
          setReady(true);
          return;
        }
        await new Promise((r) => setTimeout(r, 750));
      }
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, clerkUser, reloadPartner]);

  useEffect(() => {
    if (!self) return;

    const pairKey = self.partnerId && partner.id ? getPairKey(self, partner) : null;
    const channel = subscribeToProductionRealtime(
      self.id,
      self.partnerId,
      pairKey,
      (row: LocationRow) => {
        const apply = (user: User) =>
          user.id === row.user_id
            ? {
                ...user,
                latitude: row.latitude,
                longitude: row.longitude,
                batteryPercentage: row.battery_percentage ?? user.batteryPercentage,
                isCharging: row.is_charging ?? user.isCharging,
                lastSeen: 'Just now',
              }
            : user;
        setSelf((prev) => (prev ? apply(prev) : prev));
        setPartner((prev) => apply(prev));
      },
      (row: ProfileRow) => {
        const mapped = profileLocationToUser(row, {
          user_id: row.id,
          latitude: row.id === self.id ? self.latitude : partner.latitude,
          longitude: row.id === self.id ? self.longitude : partner.longitude,
          battery_percentage: row.id === self.id ? self.batteryPercentage : partner.batteryPercentage,
          is_charging: row.id === self.id ? self.isCharging : partner.isCharging,
          last_seen: new Date().toISOString(),
          updated_at: row.updated_at,
        });
        if (row.id === self.id) setSelf(mapped);
        else if (row.id === partner.id) setPartner(mapped);
        if (row.id === self.id && row.partner_id && row.partner_id !== partner.id) {
          reloadPartner(row.partner_id);
        }
      },
      (row: NotificationRow) => setNotifications((prev) => [notificationRowToApp(row), ...prev]),
      (row) => setChatMessages((prev) => [...prev, chatRowToApp(row)])
    );

    return () => {
      channel?.unsubscribe();
    };
  }, [self?.id, self?.partnerId, partner.id, reloadPartner]);

  useGeolocation({
    enabled: Boolean(self?.isLocationSharing && ready),
    onPosition: (latitude, longitude) => {
      if (!self) return;
      setSelf((prev) => (prev ? { ...prev, latitude, longitude, lastSeen: 'Just now' } : prev));
      updateUserInDb(self.id, { latitude, longitude, lastSeen: 'Just now' });
    },
  });

  const handleUpdateSelf = useCallback(
    async (updates: Partial<User>) => {
      if (!self) return;
      setSelf((prev) => (prev ? { ...prev, ...updates } : prev));
      await updateUserInDb(self.id, updates);
    },
    [self]
  );

  const handlePair = useCallback(
    async (code: string) => {
      if (!self) return false;
      const ok = await pairWithCode(code);
      if (!ok) return false;
      const refreshed = await reloadSelf();
      if (refreshed?.partnerId) await reloadPartner(refreshed.partnerId);
      return true;
    },
    [self, reloadPartner, reloadSelf]
  );

  const handleUnpair = useCallback(async () => {
    if (!self) return;
    await unpairCurrentUser(self.id, self.partnerId);
    setSelf((prev) => (prev ? { ...prev, partnerId: null } : prev));
    setPartner(UNPAIRED_PARTNER);
    setChatMessages([]);
  }, [self]);

  const handleNotifyUser = useCallback(
    async (targetUserId: string, title: string, message: string, type: AppNotification['type']) => {
      const row = await addNotificationInDb(targetUserId, title, message, type);
      if (row && self && targetUserId === self.id) {
        setNotifications((prev) => [row, ...prev]);
      }
      if (type === 'emergency' || type === 'geofence' || type === 'sharing_stop' || type === 'sharing_start') {
        await recordPartnerAlertEvent(type, title, message, self?.partnerId);
      }
    },
    [self]
  );

  const handleClearNotifications = useCallback(async () => {
    if (!self) return;
    await clearNotificationsInDb(self.id);
    setNotifications([]);
  }, [self]);

  const handleSendChatMessage = useCallback(
    async (text: string) => {
      if (!self || !self.partnerId || !partner.id) return;
      const pairKey = getPairKey(self, partner);
      const msg = await sendChatMessageInDb(pairKey, self.id, text);
      if (msg) setChatMessages((prev) => [...prev, msg]);
    },
    [self, partner]
  );

  const handleDeleteAccount = useCallback(async () => {
    await handleUnpair();
  }, [handleUnpair]);

  return {
    self,
    partner,
    notifications,
    chatMessages,
    ready,
    handleUpdateSelf,
    handlePair,
    handleUnpair,
    handleNotifyUser,
    handleClearNotifications,
    handleDeleteAccount,
    handleSendChatMessage,
  };
}
