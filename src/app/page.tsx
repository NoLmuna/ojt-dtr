"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  FileText,
  Clock,
  MapPin,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { GlobalLoader } from "@/components/global-loader";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.role === "SUPERVISOR") {
        router.replace("/supervisor/dashboard");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [status, session, router]);

  if (status === "loading") {
    return <GlobalLoader />;
  }

  if (status === "authenticated") {
    return <GlobalLoader message="Redirecting to your dashboard..." />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-zinc-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image
              src="/icons/DTR-ICON.png"
              alt="OJT DTR Logo"
              width={34}
              height={34}
              className="rounded-xl object-cover ring-1 ring-zinc-200"
              priority
            />
            <span className="font-bold text-base text-zinc-900 tracking-tight">
              OJT<span className="text-blue-600">.DTR</span>
            </span>
          </div>

          <button
            onClick={() => signIn("google")}
            className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs sm:text-sm font-semibold py-2 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <span>Sign In</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Content Hero */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-16 sm:py-24">
        <div className="max-w-xl w-full mx-auto text-center space-y-8">
          {/* Compliance Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium">
            <ShieldCheck size={14} className="text-blue-600" />
            <span>CSC Form 48 Compliant</span>
          </div>

          {/* Heading & Subtitle */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 leading-[1.15]">
              Daily Time Record <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Simplified & Verified
              </span>
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 max-w-md mx-auto leading-relaxed">
              Institutional attendance tracking with GPS geofence verification, automated calculations, and instant Form 48 PDF exports.
            </p>
          </div>

          {/* Auth Card */}
          <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 sm:p-8 shadow-sm max-w-md mx-auto space-y-4">
            <button
              onClick={() => signIn("google")}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-50 border border-zinc-300 hover:border-zinc-400 text-zinc-900 font-semibold py-3 px-5 rounded-xl shadow-2xs transition-all cursor-pointer active:scale-98"
            >
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3L37 10.1C33.6 7 28.9 5 24 5 12.9 5 4 13.9 4 25s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.2-2.7-.1-5z" />
                <path fill="#FF3D00" d="M6.3 15.5l6.6 4.8C14.5 16.1 18.9 13 24 13c3 0 5.8 1.1 7.9 3L37 10.1C33.6 7 28.9 5 24 5 16.3 5 9.7 9.3 6.3 15.5z" />
                <path fill="#4CAF50" d="M24 45c4.9 0 9.4-1.8 12.8-4.8l-6-4.9C29 37.2 26.6 38 24 38c-5.2 0-9.6-2.9-11.3-7l-6.5 5C9.6 41 16.3 45 24 45z" />
                <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.4-2.5 4.4-4.8 5.7l6 4.9C40.6 35.2 44 30.5 44 25c0-1.3-.2-2.7-.4-5z" />
              </svg>
              <span className="text-sm">Continue with Google</span>
            </button>

            <p className="text-[11px] text-zinc-500">
              Sign in with your authorized school or personal Google account.
            </p>
          </div>

          {/* Clean 3-Feature Summary */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <div className="bg-white border border-zinc-200/90 rounded-xl p-4 space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 text-zinc-900 font-semibold text-xs">
                <MapPin size={15} className="text-blue-600" />
                <span>GPS Geofencing</span>
              </div>
              <p className="text-[11px] text-zinc-600 leading-normal">
                Verifies check-in within registered workplace perimeter.
              </p>
            </div>

            <div className="bg-white border border-zinc-200/90 rounded-xl p-4 space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 text-zinc-900 font-semibold text-xs">
                <Clock size={15} className="text-blue-600" />
                <span>Auto Computation</span>
              </div>
              <p className="text-[11px] text-zinc-600 leading-normal">
                Computes exact rendered hours and lunch deductions.
              </p>
            </div>

            <div className="bg-white border border-zinc-200/90 rounded-xl p-4 space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 text-zinc-900 font-semibold text-xs">
                <FileText size={15} className="text-blue-600" />
                <span>Form 48 Export</span>
              </div>
              <p className="text-[11px] text-zinc-600 leading-normal">
                One-click standard Civil Service Form 48 PDF generation.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
