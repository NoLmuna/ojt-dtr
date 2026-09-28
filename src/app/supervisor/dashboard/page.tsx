"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { GlobalLoader } from "@/components/global-loader";
import { ChevronRight, Users, LogOut, User } from "lucide-react";
import { formatHoursMinutes } from "@/lib/utils";

interface Trainee {
  id: string;
  name: string;
  email: string;
  targetHours?: number | null;
  dtrRecords: {
    id: string;
    month: number;
    year: number;
    status: string;
    totalHours: number;
  }[];
}

export default function SupervisorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/supervisor/trainees")
        .then((res) => {
          if (!res.ok) {
            if (res.status === 403) throw new Error("Access Denied: You are not a supervisor.");
            throw new Error("Failed to load trainees.");
          }
          return res.json();
        })
        .then((data) => {
          setTrainees(data.trainees || []);
        })
        .catch((err) => {
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [status]);

  if (loading || status === "loading") {
    return <GlobalLoader />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-zinc-900 p-4">
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <h1 className="text-xl font-bold text-rose-600">{error}</h1>
          <p className="text-xs text-zinc-500">
            Please make sure your account is registered as a supervisor or sign in with an authorized account.
          </p>
          <button
            onClick={() => router.back()}
            className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-900 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 w-full border-b border-zinc-200/80 bg-white/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/supervisor/dashboard" className="flex items-center gap-2.5">
              <Image
                src="/icons/DTR-ICON.png"
                alt="OJT DTR Logo"
                width={34}
                height={34}
                className="rounded-xl object-cover ring-1 ring-zinc-200"
                priority
              />
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-zinc-900 tracking-tight">
                  OJT<span className="text-blue-600">.DTR</span>
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Supervisor
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/supervisor/profile"
              className="flex items-center gap-2 text-xs font-medium text-zinc-700 hover:text-zinc-900 bg-white hover:bg-zinc-50 border border-zinc-200/90 px-3 py-1.5 rounded-xl shadow-2xs transition-all"
            >
              <User size={14} className="text-zinc-400" />
              <span>{session?.user?.name || "My Profile"}</span>
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              title="Sign Out"
              className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Assigned Trainees</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Review and inspect monthly attendance records of students assigned to you.
              </p>
            </div>
            <span className="text-xs font-semibold bg-zinc-100 text-zinc-600 px-2.5 py-0.5 rounded-full border border-zinc-200">
              {trainees.length} {trainees.length === 1 ? "Trainee" : "Trainees"}
            </span>
          </div>

          <ul className="divide-y divide-zinc-100">
            {trainees.length === 0 ? (
              <li className="p-12 text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                  <Users size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-zinc-800">No trainees linked yet</h3>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    Trainees can send you an invite to link their account directly from their profile page.
                  </p>
                </div>
              </li>
            ) : (
              trainees.map((trainee) => {
                const totalCompleted = trainee.dtrRecords.reduce((acc, r) => acc + r.totalHours, 0);
                const percentage = trainee.targetHours && trainee.targetHours > 0
                  ? Math.min(100, Math.max(0, (totalCompleted / trainee.targetHours) * 100))
                  : 0;

                return (
                  <li key={trainee.id} className="p-5 sm:p-6 hover:bg-zinc-50/80 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base font-bold text-zinc-900">
                          {trainee.name || "Unnamed Trainee"}
                        </h3>
                        <p className="text-xs text-zinc-500">{trainee.email}</p>
                      </div>

                      {trainee.targetHours && trainee.targetHours > 0 && (
                        <div className="w-full sm:w-60 space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-500 font-medium">Progress</span>
                            <span className="font-bold text-blue-700 font-mono">
                              {totalCompleted.toFixed(1)} / {trainee.targetHours} hrs ({percentage.toFixed(0)}%)
                            </span>
                          </div>
                          <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-zinc-100">
                      <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">
                        Monthly DTR Sheets
                      </h4>

                      {trainee.dtrRecords.length === 0 ? (
                        <p className="text-xs text-zinc-400 italic">No DTR records generated yet.</p>
                      ) : (
                        <div className="flex gap-3 overflow-x-auto pb-1">
                          {[...trainee.dtrRecords]
                            .sort((a, b) => b.year - a.year || b.month - a.month)
                            .map((dtr) => (
                              <Link
                                key={dtr.id}
                                href={`/dtr/${dtr.id}`}
                                className="group shrink-0 min-w-44 bg-zinc-50/70 border border-zinc-200/80 hover:border-blue-300 rounded-xl p-3 shadow-2xs hover:shadow-xs transition-all"
                              >
                                <div className="flex justify-between items-center gap-2">
                                  <span className="font-medium text-xs text-zinc-800">
                                    {new Date(dtr.year, dtr.month - 1).toLocaleString("default", {
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </span>
                                  <span
                                    className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                                      dtr.status.toLowerCase() === "approved"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-zinc-100 text-zinc-600 border-zinc-200"
                                    }`}
                                  >
                                    {dtr.status}
                                  </span>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                                  <span className="font-mono text-zinc-800 font-medium">
                                    {formatHoursMinutes(dtr.totalHours)}
                                  </span>
                                  <span className="text-blue-600 group-hover:text-blue-700 flex items-center gap-0.5 text-[11px] font-medium">
                                    View <ChevronRight size={12} />
                                  </span>
                                </div>
                              </Link>
                            ))}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </main>
    </div>
  );
}