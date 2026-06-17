import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { useEffect, useRef } from 'react';

interface UseGeolocationOptions {
  enabled: boolean;
  onPosition: (latitude: number, longitude: number) => void;
  intervalMs?: number;
}

export function useGeolocation({ enabled, onPosition, intervalMs = 15000 }: UseGeolocationOptions) {
  const watchIdRef = useRef<string | null>(null);
  const browserWatchRef = useRef<number | null>(null);
  const onPositionRef = useRef(onPosition);
  onPositionRef.current = onPosition;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const report = (latitude: number, longitude: number) => {
      if (!cancelled) onPositionRef.current(latitude, longitude);
    };

    const startNative = async () => {
      const permission = await Geolocation.requestPermissions();
      if (permission.location !== 'granted' && permission.coarseLocation !== 'granted') return;

      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      report(position.coords.latitude, position.coords.longitude);

      watchIdRef.current = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 10000, maximumAge: intervalMs },
        (pos) => {
          if (pos) report(pos.coords.latitude, pos.coords.longitude);
        }
      );
    };

    const startBrowser = () => {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        (pos) => report(pos.coords.latitude, pos.coords.longitude),
        () => undefined,
        { enableHighAccuracy: true }
      );

      browserWatchRef.current = navigator.geolocation.watchPosition(
        (pos) => report(pos.coords.latitude, pos.coords.longitude),
        () => undefined,
        { enableHighAccuracy: true, maximumAge: intervalMs }
      );
    };

    if (Capacitor.isNativePlatform()) {
      startNative().catch(console.error);
    } else {
      startBrowser();
    }

    return () => {
      cancelled = true;
      if (watchIdRef.current) {
        Geolocation.clearWatch({ id: watchIdRef.current }).catch(() => undefined);
        watchIdRef.current = null;
      }
      if (browserWatchRef.current !== null) {
        navigator.geolocation.clearWatch(browserWatchRef.current);
        browserWatchRef.current = null;
      }
    };
  }, [enabled, intervalMs]);
}
