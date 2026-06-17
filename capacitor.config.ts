import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lockerlover.app',
  appName: 'Loc-Ker Lover',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#FFF5F7',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#090d16',
    },
  },
};

export default config;
