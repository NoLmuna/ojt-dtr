"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  FileText,
  Clock,
  Download,
  MapPin,
  Users,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  LogIn,
  LogOut as LogOutIcon,
  Sparkles,
  Building2
} from "lucide-react";
import { GlobalLoader } from "@/components/global-loader";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [liveTime, setLiveTime] = useState<string>("");

  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.role === "SUPERVISOR") {
        router.replace("/supervisor/dashboard");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [status, session, router]);

  // Live ticking clock for hero preview
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (status === "loading") {
    return <GlobalLoader />;
  }

  if (status === "authenticated") {
    return <GlobalLoader message="Redirecting to your dashboard..." />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image
              src="/icons/DTR-ICON.png"
              alt="OJT DTR Logo"
              width={36}
              height={36}
              className="rounded-xl shadow-xs object-cover"
              priority
            />
            <div>
              <span className="font-bold text-base text-slate-900 tracking-tight">
                OJT<span className="text-blue-600">.DTR</span>
              </span>
            </div>
          </div>

          <button
            onClick={() => signIn("google")}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold py-2 px-4 rounded-xl shadow-xs transition-all duration-150 cursor-pointer active:scale-98"
          >
            <span>Sign In</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 px-4 sm:px-6 overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold shadow-xs">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              <span>Civil Service Form 48 Compliant</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.15]">
              Track Your OJT Hours with <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Precision & Confidence
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              The complete digital attendance platform for trainees and supervisors. Geolocation-verified punch-in, automated hour computation, and instant Philippine Civil Service Form 48 PDF exports.
            </p>

            {/* Google Sign In Action */}
            <div className="pt-2 max-w-md mx-auto space-y-3">
              <button
                onClick={() => signIn("google")}
                className="w-full group flex items-center justify-center gap-3 bg-white border border-slate-300 hover:border-slate-400 text-slate-800 font-semibold py-3.5 px-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer active:scale-98"
              >
                <svg width="22" height="22" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3L37 10.1C33.6 7 28.9 5 24 5 12.9 5 4 13.9 4 25s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.2-2.7-.1-5z" />
                  <path fill="#FF3D00" d="M6.3 15.5l6.6 4.8C14.5 16.1 18.9 13 24 13c3 0 5.8 1.1 7.9 3L37 10.1C33.6 7 28.9 5 24 5 16.3 5 9.7 9.3 6.3 15.5z" />
                  <path fill="#4CAF50" d="M24 45c4.9 0 9.4-1.8 12.8-4.8l-6-4.9C29 37.2 26.6 38 24 38c-5.2 0-9.6-2.9-11.3-7l-6.5 5C9.6 41 16.3 45 24 45z" />
                  <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.4-2.5 4.4-4.8 5.7l6 4.9C40.6 35.2 44 30.5 44 25c0-1.3-.2-2.7-.4-5z" />
                </svg>
                <span>Continue with Google</span>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="flex items-center justify-center gap-6 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  GPS Geofence Verified
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  CSC Form 48 PDF
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Zero Setup Fees
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Hero Showcase Widget — Styled like the Dashboard Station */}
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800/80 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Station Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
                    <Clock size={20} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300 block">
                      Live Attendance Station Preview
                    </span>
                    <span className="text-sm font-semibold text-white">
                      Subic Bay Metropolitan Authority (Pinned Location)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1 rounded-full">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    100m Geofence Active
                  </span>
                </div>
              </div>

              {/* Station Body */}
              <div className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                    System Time
                  </span>
                  <div className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono text-white">
                    {liveTime || "08:00:00 AM"}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Verified arrival & departure logs sync directly with PostgreSQL database.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-blue-600 text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-xs">
                    <LogIn size={15} />
                    <span>Time In (AM/PM)</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs py-2.5 px-4 rounded-xl">
                    <LogOutIcon size={15} />
                    <span>Time Out (AM/PM)</span>
                  </div>
                </div>
              </div>

              {/* Station Progress Footer */}
              <div className="pt-4 border-t border-slate-800/80 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">Internship Completion Goal</span>
                  <span className="text-blue-400 font-mono">348.5 / 500.0 Hours (69.7%)</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2.5 rounded-full"
                    style={{ width: "69.7%" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Capabilities */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white border-t border-slate-200/80">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="max-w-2xl mx-auto text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Built for Institutional Attendance Standards
              </h2>
              <p className="text-sm sm:text-base text-slate-500">
                Eliminate paper logbooks and manual hour calculations with automated compliance features.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Feature 1 */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all space-y-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <MapPin size={20} />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Location-Verified Punch</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Enforce on-site presence by verifying GPS coordinates within 100 meters of your registered workplace.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all space-y-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Clock size={20} />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Automatic Calculations</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Automated computation of exact daily work hours with mandatory 1-hour lunch break deductions.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 hover:border-purple-300 hover:shadow-md transition-all space-y-3">
                <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Download size={20} />
                </div>
                <h3 className="font-bold text-slate-900 text-base">CSC Form 48 Export</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Generate print-ready, double-column Civil Service Form 48 daily time records with official certification clauses.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all space-y-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Users size={20} />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Supervisor Oversight</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Direct supervisor invitation links for live monitoring, time verification, and monthly status sign-offs.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Process Flow */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 bg-slate-50 border-t border-slate-200/80">
          <div className="max-w-5xl mx-auto space-y-10">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Simple 3-Step Workflow
              </h2>
              <p className="text-sm text-slate-500">
                Designed to save time every single workday.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                <div className="text-blue-600 font-extrabold text-2xl font-mono">01</div>
                <h4 className="font-bold text-slate-900 text-base">Google Sign In</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Authenticate instantly using your Google account. Set your target hours and company coordinates once.
                </p>
              </div>

              <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                <div className="text-blue-600 font-extrabold text-2xl font-mono">02</div>
                <h4 className="font-bold text-slate-900 text-base">Daily Punch In / Out</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  One tap to record morning arrival, lunch departure, and afternoon dismissal with GPS verification.
                </p>
              </div>

              <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                <div className="text-blue-600 font-extrabold text-2xl font-mono">03</div>
                <h4 className="font-bold text-slate-900 text-base">Download Form 48</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  At month-end, export the standardized Civil Service Form 48 PDF document ready for supervisor signature.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="py-14 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white px-4 sm:px-6">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-bold">Ready to streamline your internship records?</h3>
              <p className="text-xs sm:text-sm text-blue-100">
                Join interns logging attendance accurately and error-free.
              </p>
            </div>
            <button
              onClick={() => signIn("google")}
              className="whitespace-nowrap px-6 py-3 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm shadow-md transition-all cursor-pointer active:scale-98"
            >
              Get Started with Google
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
