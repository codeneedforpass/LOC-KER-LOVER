import { UserButton } from '@clerk/react';
import PhoneApp from './PhoneApp';
import PushNotificationControls from './PushNotificationControls';
import { useProductionState } from '../hooks/useProductionState';
import { UNPAIRED_PARTNER } from '../lib/unpairedPartner';

export default function MobileApp() {
  const {
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
  } = useProductionState();

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#FFF5F7] flex items-center justify-center">
        <p className="text-[#FF4D6D] font-semibold">Loading your profile…</p>
      </div>
    );
  }

  if (!self) {
    return (
      <div className="min-h-screen bg-[#FFF5F7] flex flex-col items-center justify-center p-6 text-center gap-4">
        <p className="text-[#FF4D6D] font-semibold">Could not load your profile.</p>
        <p className="text-sm text-[#8D99AE] max-w-sm">
          Enable Clerk → Supabase integration and run <code className="text-xs">supabase/production.clerk-rls.sql</code> in the SQL Editor, then restart the app.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#090d16] flex flex-col">
      <div className="safe-top flex items-center justify-between px-4 py-2 bg-[#090d16] border-b border-slate-800 z-10">
        <span className="text-xs font-bold text-[#FF8FA3] uppercase tracking-widest">Loc-Ker Lover</span>
        <div className="flex items-center gap-2">
          <PushNotificationControls partnerId={self.partnerId} />
          <UserButton />
        </div>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full">
        <PhoneApp
          user={self}
          partner={partner.id ? partner : UNPAIRED_PARTNER}
          onUpdateSelf={handleUpdateSelf}
          onPair={handlePair}
          onUnpair={handleUnpair}
          onNotifyUser={handleNotifyUser}
          notifications={notifications}
          onClearNotifications={handleClearNotifications}
          onDeleteAccount={handleDeleteAccount}
          chatMessages={chatMessages}
          onSendChatMessage={handleSendChatMessage}
        />
      </div>
    </div>
  );
}
