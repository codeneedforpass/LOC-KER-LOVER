import { useCallback, useEffect, useState } from 'react';
import { INITIAL_USER_A, INITIAL_USER_B } from '../data/mockData';
import { env, isSupabaseConfigured } from '../lib/env';
import { DEMO_PAIRING_CODES, DEMO_USER_A_ID, DEMO_USER_B_ID, userIdFromSlot } from '../lib/demoUsers';
import { recordPartnerAlertEvent } from '../lib/onesignal';
import {
  addNotificationInDb,
  clearNotificationsInDb,
  getDemoPairKey,
  loadChatMessages,
  loadDemoUsers,
  loadNotifications,
  pairUsersInDb,
  sendChatMessageInDb,
  subscribeToRealtime,
  unpairUsersInDb,
  updateUserInDb,
} from '../lib/supabaseData';
import {
  chatRowToApp,
  LocationRow,
  notificationRowToApp,
  NotificationRow,
  profileLocationToUser,
  ProfileRow,
} from '../lib/supabaseMappers';
import { AppNotification, ChatMessage, User } from '../types';

type LogType = 'info' | 'warn' | 'success' | 'alert';
type LogEntry = { timestamp: string; message: string; type: LogType };

const useSupabase = !env.useMockData && isSupabaseConfigured();

export function useAppState() {
  const [userA, setUserA] = useState<User>(INITIAL_USER_A);
  const [userB, setUserB] = useState<User>(INITIAL_USER_B);
  const [activeControl, setActiveControl] = useState<'alex' | 'taylor'>('alex');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [backendReady, setBackendReady] = useState(!useSupabase);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      timestamp: new Date().toTimeString().split(' ')[0],
      message: useSupabase
        ? 'Loc-Ker Lover booted — connecting to Supabase...'
        : 'Loc-Ker Lover simulator booted (VITE_USE_MOCK_DATA=true).',
      type: 'success',
    },
  ]);

  const addLog = useCallback((message: string, type: LogType = 'info') => {
    const strTime = new Date().toTimeString().split(' ')[0];
    setLogs((prev) => [{ timestamp: strTime, message, type }, ...prev].slice(0, 30));
  }, []);

  const applyLocationRow = useCallback((row: LocationRow) => {
    const apply = (prev: User) =>
      prev.id === row.user_id
        ? {
            ...prev,
            latitude: row.latitude,
            longitude: row.longitude,
            batteryPercentage: row.battery_percentage ?? prev.batteryPercentage,
            isCharging: row.is_charging ?? prev.isCharging,
            lastSeen: 'Just now',
          }
        : prev;
    setUserA(apply);
    setUserB(apply);
  }, []);

  const applyProfileRow = useCallback((row: ProfileRow) => {
    const apply = (prev: User) =>
      prev.id === row.id
        ? profileLocationToUser(row, {
            user_id: row.id,
            latitude: prev.latitude,
            longitude: prev.longitude,
            battery_percentage: prev.batteryPercentage,
            is_charging: prev.isCharging,
            last_seen: new Date().toISOString(),
            updated_at: row.updated_at,
          })
        : prev;
    setUserA(apply);
    setUserB(apply);
  }, []);

  useEffect(() => {
    if (!useSupabase) {
      setNotifications([
        {
          id: 'n1',
          userId: DEMO_USER_A_ID,
          title: 'Pair request accepted!',
          message: 'You are now successfully linked with Taylor. Mutual location sharing is active.',
          type: 'pair_accepted',
          timestamp: '2h ago',
          read: false,
        },
        {
          id: 'n2',
          userId: DEMO_USER_B_ID,
          title: 'Pair request accepted!',
          message: 'You are now successfully linked with Alex. Mutual location sharing is active.',
          type: 'pair_accepted',
          timestamp: '2h ago',
          read: false,
        },
      ]);
      setChatMessages([
        { id: 'm1', senderId: DEMO_USER_A_ID, text: 'Hey sweetheart! Ready for our coffee meetup? ☕', timestamp: '10:05 AM' },
        { id: 'm2', senderId: DEMO_USER_B_ID, text: 'Yes! Heading towards Sweethearts Cafe now. ❤️', timestamp: '10:06 AM' },
      ]);
      return;
    }

    let cancelled = false;

    (async () => {
      const users = await loadDemoUsers();
      if (cancelled) return;

      if (!users) {
        addLog('Supabase connected but demo data missing — run supabase/seed.demo.sql in SQL Editor.', 'warn');
        setBackendReady(true);
        return;
      }

      setUserA(users.userA);
      setUserB(users.userB);
      setNotifications(await loadNotifications());
      setChatMessages(await loadChatMessages(getDemoPairKey(users.userA, users.userB)));
      setBackendReady(true);
      addLog('Loaded Alex & Taylor from Supabase.', 'success');
      addLog('Realtime subscription active on locations + chat.', 'info');
    })();

    const pairKey = getDemoPairKey(INITIAL_USER_A, INITIAL_USER_B);
    const channel = subscribeToRealtime(
      pairKey,
      (row) => {
        applyLocationRow(row);
        addLog(`Realtime location update: ${row.user_id.slice(0, 8)}…`, 'info');
      },
      (row) => applyProfileRow(row),
      (row) => {
        if (row.user_id === DEMO_USER_A_ID || row.user_id === DEMO_USER_B_ID) {
          setNotifications((prev) => [notificationRowToApp(row), ...prev]);
        }
      },
      (row) => setChatMessages((prev) => [...prev, chatRowToApp(row)])
    );

    return () => {
      cancelled = true;
      channel?.unsubscribe();
    };
  }, [addLog, applyLocationRow, applyProfileRow]);

  const handleUpdateUser = async (userId: 'alex' | 'taylor', updates: Partial<User>) => {
    const dbId = userIdFromSlot(userId);
    const apply = (prev: User) => ({ ...prev, ...updates, lastSeen: updates.latitude !== undefined ? 'Just now' : prev.lastSeen });

    if (userId === 'alex') setUserA(apply);
    else setUserB(apply);

    if (useSupabase) {
      await updateUserInDb(dbId, updates);
    }

    if (updates.latitude !== undefined && updates.longitude !== undefined) {
      const name = userId === 'alex' ? 'Alex' : 'Taylor';
      addLog(`[${name}] Lat: ${updates.latitude.toFixed(5)}, Lon: ${updates.longitude.toFixed(5)}`, 'info');
    }
  };

  const handlePair = async (code: string): Promise<boolean> => {
    addLog(`Pairing attempt with code: "${code}"`, 'info');
    if (code === DEMO_PAIRING_CODES.alex || code === DEMO_PAIRING_CODES.taylor) {
      if (useSupabase) await pairUsersInDb(DEMO_USER_A_ID, DEMO_USER_B_ID);
      setUserA((p) => ({ ...p, partnerId: DEMO_USER_B_ID }));
      setUserB((p) => ({ ...p, partnerId: DEMO_USER_A_ID }));
      const notiA: AppNotification = {
        id: `noti-${Date.now()}-a`,
        userId: DEMO_USER_A_ID,
        title: 'Partner Connected!',
        message: 'Your pairing bond is synced on Supabase Realtime.',
        type: 'pair_accepted',
        timestamp: 'Just now',
        read: false,
      };
      const notiB: AppNotification = {
        id: `noti-${Date.now()}-b`,
        userId: DEMO_USER_B_ID,
        title: 'Partner Connected!',
        message: 'Your pairing bond is synced on Supabase Realtime.',
        type: 'pair_accepted',
        timestamp: 'Just now',
        read: false,
      };
      if (useSupabase) {
        await addNotificationInDb(DEMO_USER_A_ID, notiA.title, notiA.message, notiA.type);
        await addNotificationInDb(DEMO_USER_B_ID, notiB.title, notiB.message, notiB.type);
      } else {
        setNotifications((prev) => [notiA, notiB, ...prev]);
      }
      addLog('Love-Link pairing succeeded.', 'success');
      return true;
    }
    addLog(`Pairing failed — invalid code "${code}".`, 'warn');
    return false;
  };

  const handleUnpair = async () => {
    if (useSupabase) await unpairUsersInDb(DEMO_USER_A_ID, DEMO_USER_B_ID);
    setUserA((p) => ({ ...p, partnerId: null }));
    setUserB((p) => ({ ...p, partnerId: null }));
    addLog('Partnership disconnected.', 'warn');
  };

  const handleAddNotification = async (
    userId: 'alex' | 'taylor',
    title: string,
    msg: string,
    type: AppNotification['type']
  ) => {
    const targetId = userIdFromSlot(userId);
    if (useSupabase) {
      const row = await addNotificationInDb(targetId, title, msg, type);
      if (row) setNotifications((prev) => [row, ...prev]);
    } else {
      setNotifications((prev) => [
        { id: `noti-${Date.now()}`, userId: targetId, title, message: msg, type, timestamp: 'Just now', read: false },
        ...prev,
      ]);
    }
    addLog(`Notification: ${userId} — ${title}`, type === 'emergency' ? 'alert' : 'info');

    if (type === 'emergency' || type === 'geofence' || type === 'sharing_stop' || type === 'sharing_start') {
      const partnerId = userId === 'alex' ? userB.partnerId : userA.partnerId;
      await recordPartnerAlertEvent(type, title, msg, partnerId);
    }
  };

  const handleClearNotifications = async () => {
    if (useSupabase) await clearNotificationsInDb();
    setNotifications([]);
    addLog('Notifications cleared.', 'info');
  };

  const handleDeleteAccount = async () => {
    await handleUnpair();
    addLog('Account disconnect simulated.', 'alert');
  };

  const handleSendChatMessage = async (text: string) => {
    const senderId = userIdFromSlot(activeControl);
    const pairKey = getDemoPairKey(userA, userB);
    if (useSupabase) {
      const msg = await sendChatMessageInDb(pairKey, senderId, text);
      if (msg) setChatMessages((prev) => [...prev, msg]);
    } else {
      setChatMessages((prev) => [
        ...prev,
        { id: `msg-${Date.now()}`, senderId, text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
    }
    addLog(`Chat [${activeControl}]: "${text}"`, 'info');
  };

  const triggerLowBatteryScenario = () => {
    handleUpdateUser('taylor', { batteryPercentage: 9, isCharging: false });
    handleAddNotification('alex', 'Partner Low Battery Warning!', 'Taylor is at 9% battery!', 'emergency');
    addLog('Triggered: Low Battery scenario.', 'warn');
  };

  const triggerCommuteWalk = () => {
    addLog('Starting commute simulation for Alex...', 'info');
    handleUpdateUser('alex', { status: 'moving' });
    let steps = 0;
    const interval = setInterval(() => {
      if (steps >= 4) {
        clearInterval(interval);
        handleUpdateUser('alex', { latitude: 37.7749, longitude: -122.4194, status: 'online' });
        handleAddNotification('taylor', 'Arrived at Cozy Cafe', 'Alex arrived at Sweethearts Cafe.', 'geofence');
        return;
      }
      const latDelta = (37.7749 - 37.7694) / 4;
      const lonDelta = (-122.4194 - -122.4214) / 4;
      handleUpdateUser('alex', {
        latitude: 37.7694 + latDelta * (steps + 1),
        longitude: -122.4214 + lonDelta * (steps + 1),
      });
      steps++;
    }, 2000);
  };

  const triggerResetEverything = async () => {
    if (useSupabase) {
      const users = await loadDemoUsers();
      if (users) {
        setUserA(users.userA);
        setUserB(users.userB);
      }
      setChatMessages(await loadChatMessages(getDemoPairKey(userA, userB)));
      setNotifications(await loadNotifications());
    } else {
      setUserA(INITIAL_USER_A);
      setUserB(INITIAL_USER_B);
      setChatMessages([]);
    }
    addLog('States reset.', 'success');
  };

  return {
    userA,
    userB,
    activeControl,
    setActiveControl,
    notifications,
    chatMessages,
    logs,
    backendReady,
    useSupabase,
    handleUpdateUser,
    handlePair,
    handleUnpair,
    handleAddNotification,
    handleClearNotifications,
    handleDeleteAccount,
    handleSendChatMessage,
    triggerLowBatteryScenario,
    triggerCommuteWalk,
    triggerResetEverything,
  };
}
