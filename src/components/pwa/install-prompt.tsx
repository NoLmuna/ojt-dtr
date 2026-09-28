"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "ojt-dtr-install-dismissed";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  const isStandalone = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (typeof navigator !== "undefined" &&
        "standalone" in navigator &&
        Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
    );
  }, []);

  useEffect(() => {
    // If running inside the installed PWA app, do not show the banner
    if (isStandalone) {
      return;
    }

    // Check if dismissed in localStorage (allow override with ?install=1 for testing)
    const isTesting = typeof window !== "undefined" && window.location.search.includes("install=1");
    if (localStorage.getItem(DISMISS_KEY) === "1" && !isTesting) {
      return;
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();

      if (localStorage.getItem(DISMISS_KEY) === "1" && !isTesting) {
        return;
      }

      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const onAppInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
      localStorage.removeItem(DISMISS_KEY);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, [isStandalone]);

  const installApp = async () => {
    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    setVisible(false);
    setDeferredPrompt(null);

    if (choice.outcome === "dismissed") {
      localStorage.setItem(DISMISS_KEY, "1");
    }
  };

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  if (!visible || !deferredPrompt) {
    return null;
  }

  return (
    <aside
      role="dialog"
      aria-label="Install application banner"
      className="fixed inset-x-4 bottom-5 z-50 mx-auto max-w-md rounded-2xl border border-zinc-200/90 bg-white/95 p-4 shadow-xl backdrop-blur-md animate-fade-in text-zinc-900"
    >
      <div className="flex items-start gap-3.5">
        <Image
          src="/icons/DTR-ICON.png"
          alt="OJT DTR Logo"
          width={44}
          height={44}
          className="rounded-xl shrink-0 object-cover ring-1 ring-zinc-200"
        />

        <div className="flex-1 pr-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900">Install OJT DTR</h3>
            <button
              onClick={dismiss}
              aria-label="Dismiss banner"
              className="text-zinc-400 hover:text-zinc-600 transition-colors -mr-1 -mt-1 p-1 rounded-lg cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500 leading-relaxed">
            Add this app to your home screen for faster access, offline capability, and daily attendance logging.
          </p>

          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={dismiss}
              className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 cursor-pointer"
            >
              Not now
            </button>
            <button
              type="button"
              onClick={installApp}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-zinc-800 cursor-pointer active:scale-98"
            >
              <Download size={13} />
              <span>Install</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
