import type { ReactNode } from 'react';
import { Show, SignInButton, SignUpButton } from '@clerk/react';
import { Heart, Shield } from 'lucide-react';

export default function SignedOutLanding() {
  return (
    <div className="min-h-screen bg-[#FFF5F7] flex flex-col items-center justify-center p-6">
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#FF4D6D]" />
      <div className="max-w-lg w-full bg-white/80 backdrop-blur-md rounded-3xl border border-[#FFCCD5] shadow-lg p-10 text-center">
        <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-[#FF4D6D] flex items-center justify-center shadow-md shadow-[#FF4D6D]/20">
          <Heart className="w-8 h-8 text-white fill-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-[#FF4D6D] italic font-serif mb-2">Loc-Ker Lover</h1>
        <p className="text-sm text-[#8D99AE] mb-8">
          Sign in to access your private couple location space. Secured by Clerk + Supabase.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <SignInButton mode="modal">
            <button className="px-6 py-3 rounded-2xl border border-[#FFCCD5] bg-white text-[#C9184A] font-bold text-sm hover:bg-[#FFF0F3] transition-colors">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="px-6 py-3 rounded-2xl bg-[#FF4D6D] text-white font-bold text-sm hover:bg-[#C9184A] transition-colors shadow-sm">
              Create account
            </button>
          </SignUpButton>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-[#8D99AE]">
          <Shield className="w-4 h-4 text-[#C9184A]" />
          <span>Mutual consent · End-to-end encrypted location sharing</span>
        </div>
      </div>
    </div>
  );
}

export function SignedInShell({ children }: { children: ReactNode }) {
  return <Show when="signed-in">{children}</Show>;
}

export function SignedOutShell() {
  return (
    <Show when="signed-out">
      <SignedOutLanding />
    </Show>
  );
}
