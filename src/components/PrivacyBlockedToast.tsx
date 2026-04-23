import { useEffect, useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';

interface PrivacyToast {
  id: number;
  message: string;
  reason?: string;
}

/**
 * Global listener for privacy-blocked events dispatched from SocketContext.
 * Renders auto-dismissing toast notifications when a message/call is blocked.
 */
export default function PrivacyBlockedToast() {
  const [toasts, setToasts] = useState<PrivacyToast[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const toast: PrivacyToast = {
        id: Date.now(),
        message: detail?.message || 'Tin nhắn bị chặn do cài đặt quyền riêng tư.',
        reason: detail?.reason,
      };
      setToasts((prev) => [...prev, toast]);
      // Auto-dismiss after 5s
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 5000);
    };

    window.addEventListener('privacy-blocked', handler);
    return () => window.removeEventListener('privacy-blocked', handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-lg flex items-start gap-3 animate-slide-in"
          style={{
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-red-900 text-sm mb-0.5">Quyền riêng tư</p>
            <p className="text-red-700 text-sm leading-snug">{toast.message}</p>
          </div>
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="w-7 h-7 rounded-lg hover:bg-red-100 flex items-center justify-center shrink-0 transition-colors"
          >
            <X className="w-4 h-4 text-red-500" />
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
