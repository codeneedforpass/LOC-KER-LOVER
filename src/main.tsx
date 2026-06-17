import { ClerkProvider } from '@clerk/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ClerkSetupGate from './components/ClerkSetupGate.tsx';
import './index.css';
import { env } from './lib/env';

const publishableKey = env.clerk.publishableKey;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkSetupGate publishableKey={publishableKey}>
      {(key) => (
        <ClerkProvider publishableKey={key} afterSignOutUrl="/">
          <App />
        </ClerkProvider>
      )}
    </ClerkSetupGate>
  </StrictMode>
);
