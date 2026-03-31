import { createContext, useCallback, useEffect, useMemo, useState } from "react";

type ToastType = "success" | "error" | "info";

type ToastState = {
  id: number;
  message: string;
  type: ToastType;
} | null;

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
};

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TOAST_TIMEOUT_MS = 6500;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now();
    setToast({ id, message, type });

    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, TOAST_TIMEOUT_MS);
  }, []);

  const value = useMemo(
    () => ({ showToast, hideToast }),
    [showToast, hideToast]
  );

  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message?: unknown) => {
      const text = typeof message === "string" ? message : String(message ?? "");
      showToast(text, "error");
    };
    return () => {
      window.alert = originalAlert;
    };
  }, [showToast]);

  const toastClassName =
    toast?.type === "success"
      ? "bg-emerald-500 text-white border-emerald-400"
      : toast?.type === "error"
        ? "bg-yellow-400 text-black border-yellow-300"
        : "bg-yellow-300 text-black border-yellow-200";

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-10000 px-4 pointer-events-none">
          <div
            className={`${toastClassName} rounded-xl shadow-lg px-4 py-3 text-sm border pointer-events-auto max-w-[90vw]`}
            role="status"
            aria-live="polite"
          >
            {toast.message}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
