import { Bell, BellOff } from 'lucide-react';
import OneSignalIntegrationDialog from './OneSignalIntegrationDialog';
import { useUser } from '@clerk/react';
import { useOneSignal } from '../hooks/useOneSignal';

interface PushNotificationControlsProps {
  partnerId?: string | null;
}

export default function PushNotificationControls({ partnerId }: PushNotificationControlsProps) {
  const { isSignedIn, user } = useUser();
  const { configured, ready, subscribed, showIntegrationDialog, completeIntegration } = useOneSignal(
    isSignedIn ? user?.id : null,
    partnerId
  );

  if (!configured) return null;

  return (
    <>
      {ready && subscribed ? (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
          <Bell className="w-3.5 h-3.5" />
          Push on
        </span>
      ) : ready ? (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#FFCCD5] bg-white text-[#8D99AE] text-[10px] font-black uppercase tracking-wider">
          <BellOff className="w-3.5 h-3.5" />
          Push pending
        </span>
      ) : null}

      <OneSignalIntegrationDialog
        open={showIntegrationDialog}
        onConfirm={completeIntegration}
      />
    </>
  );
}
