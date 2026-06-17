import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react';

export default function AuthControls() {
  return (
    <div className="flex items-center gap-2">
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-[#FFCCD5] bg-white text-[#C9184A] hover:bg-[#FFF0F3] transition-colors">
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-[#FF4D6D] text-white hover:bg-[#C9184A] transition-colors shadow-sm">
            Sign up
          </button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: 'h-9 w-9 ring-2 ring-[#FFCCD5]',
            },
          }}
        />
      </Show>
    </div>
  );
}
