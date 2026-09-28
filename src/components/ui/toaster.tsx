"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

let addToastFn: ((message: string, type?: Toast["type"]) => void) | null = null;

export function toast(message: string, type: Toast["type"] = "info") {
  if (addToastFn) addToastFn(message, type);
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    addToastFn = (message, type = "info") => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };
    return () => {
      addToastFn = null;
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center justify-between gap-3 bg-white/95 border border-zinc-200 text-zinc-900 px-4 py-3 rounded-xl shadow-lg text-xs font-medium backdrop-blur-md animate-fade-in"
        >
          <div className="flex items-center gap-2.5">
            {t.type === "success" && (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            )}
            {t.type === "error" && (
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
            )}
            {t.type === "info" && (
              <Info size={16} className="text-blue-600 shrink-0" />
            )}
            <span>{t.message}</span>
          </div>

          <button
            onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
            className="text-zinc-400 hover:text-zinc-600 transition-colors p-0.5"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
