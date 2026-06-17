import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ClerkSetupGate from './components/ClerkSetupGate.tsx';
import './index.css';
import { env } from './lib/env';

const publishableKey = env.clerk.publishableKey;

function NativeShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    StatusBar.setStyle({ style: Style.Dark }).catch(() => undefined);
    StatusBar.setBackgroundColor({ color: '#090d16' }).catch(() => undefined);
  }, []);
  return children;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkSetupGate publishableKey={publishableKey}>
      {(key) => (
        <ClerkProvider publishableKey={key} afterSignOutUrl="/">
          <NativeShell>
            <App />
          </NativeShell>
        </ClerkProvider>
      )}
    </ClerkSetupGate>
  </StrictMode>
);
