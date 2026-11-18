"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type Toast = { id: number; tone: "ok" | "err"; text: string };

type ToastApi = {
  success: (text: string) => void;
  error: (text: string) => void;
};

const ToastContext = createContext<ToastApi>({
  success: () => undefined,
  error: () => undefined,
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((tone: Toast["tone"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, tone, text }]);
    setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3600);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (text) => push("ok", text),
      error: (text) => push("err", text),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(100%-2rem,22rem)] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-xl ${
              toast.tone === "ok"
                ? "border-emerald-400/30 bg-emerald-950/90 text-emerald-100"
                : "border-rose-400/30 bg-rose-950/90 text-rose-100"
            }`}
          >
            {toast.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
