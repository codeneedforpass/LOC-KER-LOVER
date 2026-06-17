import { Heart } from 'lucide-react';
import type { ReactNode } from 'react';

interface ClerkSetupGateProps {
  publishableKey?: string;
  children: (publishableKey: string) => ReactNode;
}

export default function ClerkSetupGate({ publishableKey, children }: ClerkSetupGateProps) {
  if (!publishableKey) {
    return (
      <div className="min-h-screen bg-[#FFF5F7] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#FFCCD5] shadow-lg p-8 text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-[#FF4D6D] flex items-center justify-center">
            <Heart className="w-7 h-7 text-white fill-white" />
          </div>
          <h1 className="text-xl font-bold text-[#2B2D42] mb-2">Clerk not configured</h1>
          <p className="text-sm text-[#8D99AE] mb-4">
            Add your Clerk publishable key to <code className="text-[#C9184A]">.env.local</code>:
          </p>
          <pre className="text-left text-xs bg-[#FFF0F3] border border-[#FFCCD5] rounded-xl p-4 overflow-x-auto text-[#2B2D42]">
            {`VITE_CLERK_PUBLISHABLE_KEY=pk_test_...\n\n# Clerk app: app_3FGuAAJPDSrZ89ctFuyPYH9SbuN\n# Dashboard → API Keys → Publishable key`}
          </pre>
        </div>
      </div>
    );
  }

  return <>{children(publishableKey)}</>;
}
