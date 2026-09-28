"use client";

import Image from "next/image";
import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-slate-900">
      <div className="max-w-md w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg space-y-5 animate-fade-in">
        <div className="relative mx-auto w-16 h-16">
          <Image
            src="/icons/DTR-ICON.png"
            alt="OJT DTR Logo"
            width={64}
            height={64}
            className="rounded-2xl shadow-sm object-cover"
          />
          <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-rose-100 text-rose-600 border border-rose-200">
            <WifiOff size={14} />
          </div>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            You Are Currently Offline
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Internet connection is currently unavailable. You can still view previously cached sheets, then reload once your network is restored.
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-5 py-2.5 shadow-sm transition-all cursor-pointer active:scale-98"
        >
          <RefreshCw size={14} />
          <span>Retry Connection</span>
        </button>
      </div>
    </div>
  );
}
