interface OneSignalIntegrationDialogProps {
  open: boolean;
  onConfirm: () => void | Promise<void>;
}

export default function OneSignalIntegrationDialog({ open, onConfirm }: OneSignalIntegrationDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onesignal-integration-title"
        className="max-w-md w-full bg-white rounded-3xl border border-[#FFCCD5] shadow-2xl p-8 text-center"
      >
        <h2 id="onesignal-integration-title" className="text-xl font-bold text-[#2B2D42] mb-3">
          Your OneSignal SDK integration is complete!
        </h2>
        <p className="text-sm text-[#8D99AE] mb-8 leading-relaxed">
          You can now send Push Notifications &amp; In-App Messages through OneSignal. Tap below to enable push notifications.
        </p>
        <button
          type="button"
          onClick={() => onConfirm()}
          className="w-full px-6 py-3 rounded-2xl bg-[#FF4D6D] text-white font-bold text-sm hover:bg-[#C9184A] transition-colors shadow-sm"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
