/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import MobileApp from './components/MobileApp';
import SupabaseAuthBridge from './components/SupabaseAuthBridge';
import { SignedInShell, SignedOutShell } from './components/SignedOutLanding';
import { useClerkSupabaseSync } from './hooks/useClerkSupabaseSync';

function SignedInApp() {
  useClerkSupabaseSync();

  return (
    <>
      <SupabaseAuthBridge />
      <MobileApp />
    </>
  );
}

export default function App() {
  return (
    <>
      <SignedOutShell />
      <SignedInShell>
        <SignedInApp />
      </SignedInShell>
    </>
  );
}
