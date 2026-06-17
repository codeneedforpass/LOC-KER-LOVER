/**
 * Centralized OneSignal integration — all SDK calls go through this module.
 * @see https://documentation.onesignal.com/docs/react-js-setup
 */
import OneSignal from 'react-onesignal';
import { env } from './env';

const ONESIGNAL_APP_ID = env.oneSignalAppId;

let initialized = false;
let verificationDialogShown = false;
type SubscriptionListener = (subscriptionId: string | null | undefined) => void;

function isRegisteredSubscriptionId(subscriptionId: string | null | undefined): boolean {
  return Boolean(subscriptionId && subscriptionId.length > 0 && !subscriptionId.startsWith('local-'));
}

export function isOneSignalConfigured(): boolean {
  return Boolean(ONESIGNAL_APP_ID);
}

export async function initializeOneSignal(): Promise<boolean> {
  if (initialized || !ONESIGNAL_APP_ID) return false;

  OneSignal.Debug.setLogLevel(env.appEnv === 'development' ? 'warn' : 'error');

  await OneSignal.init({
    appId: ONESIGNAL_APP_ID,
    serviceWorkerPath: '/onesignal/OneSignalSDKWorker.js',
    serviceWorkerUpdaterPath: '/onesignal/OneSignalSDKUpdaterWorker.js',
    serviceWorkerParam: { scope: '/onesignal/' },
    allowLocalhostAsSecureOrigin: env.appEnv === 'development',
    autoResubscribe: true,
  });

  initialized = true;
  return true;
}

export function setupPushSubscriptionObserver(onRegistered: SubscriptionListener): void {
  if (!initialized) return;

  const evaluate = (subscriptionId: string | null | undefined) => {
    if (!isRegisteredSubscriptionId(subscriptionId) || verificationDialogShown) return;
    verificationDialogShown = true;
    onRegistered(subscriptionId);
  };

  OneSignal.User.PushSubscription.addEventListener('change', (event) => {
    evaluate(event.current.id);
  });

  evaluate(OneSignal.User.PushSubscription.id);
}

export async function requestPushPermission(): Promise<boolean> {
  if (!initialized) return false;
  return OneSignal.Notifications.requestPermission();
}

export async function loginOneSignalUser(
  externalUserId: string,
  tags: Record<string, string> = {}
): Promise<void> {
  if (!initialized) return;
  await OneSignal.login(externalUserId);
  if (Object.keys(tags).length > 0) {
    OneSignal.User.addTags(tags);
  }
}

export async function logoutOneSignalUser(): Promise<void> {
  if (!initialized) return;
  await OneSignal.logout();
}

export function getPushSubscriptionId(): string | null | undefined {
  if (!initialized) return undefined;
  return OneSignal.User.PushSubscription.id;
}

export function isPushOptedIn(): boolean {
  if (!initialized) return false;
  return Boolean(OneSignal.User.PushSubscription.optedIn);
}

export function recordPartnerAlertEvent(
  type: string,
  title: string,
  message: string,
  partnerUserId?: string | null
): void {
  if (!initialized) return;

  OneSignal.User.addTags({
    last_alert_type: type,
    last_alert_title: title.slice(0, 80),
    last_alert_at: new Date().toISOString(),
    ...(partnerUserId ? { partner_user_id: partnerUserId } : {}),
  });
}
