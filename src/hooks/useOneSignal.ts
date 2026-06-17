import { useCallback, useEffect, useState } from 'react';
import {
  initializeOneSignal,
  isOneSignalConfigured,
  isPushOptedIn,
  loginOneSignalUser,
  logoutOneSignalUser,
  requestPushPermission,
  setupPushSubscriptionObserver,
} from '../lib/onesignal';

export function useOneSignal(
  externalUserId?: string | null,
  partnerId?: string | null
) {
  const [ready, setReady] = useState(false);
  const [showIntegrationDialog, setShowIntegrationDialog] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (!isOneSignalConfigured()) return;

    initializeOneSignal()
      .then((ok) => {
        if (!ok) return;
        setReady(true);
        setSubscribed(isPushOptedIn());

        setupPushSubscriptionObserver(() => {
          setShowIntegrationDialog(true);
        });
      })
      .catch((error) => console.error('OneSignal init failed:', error));
  }, []);

  useEffect(() => {
    if (!ready || !externalUserId) {
      if (ready && !externalUserId) {
        logoutOneSignalUser().catch(() => undefined);
      }
      return;
    }

    loginOneSignalUser(externalUserId, {
      app: 'loc-ker-lover',
      ...(partnerId ? { partner_id: partnerId } : {}),
    })
      .then(() => setSubscribed(isPushOptedIn()))
      .catch((error) => console.error('OneSignal login failed:', error));
  }, [ready, externalUserId, partnerId]);

  const completeIntegration = useCallback(async () => {
    const granted = await requestPushPermission();
    setSubscribed(isPushOptedIn());
    setShowIntegrationDialog(false);
    return granted;
  }, []);

  return {
    configured: isOneSignalConfigured(),
    ready,
    subscribed,
    showIntegrationDialog,
    completeIntegration,
  };
}
