"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GlobalLoader } from "@/components/global-loader";
import { ChevronRight, FileText, Users, ArrowLeft, LogOut } from "lucide-react";

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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800">
        <h1 className="text-2xl font-bold text-red-600 mb-4">{error}</h1>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Supervisor Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <Link href="/supervisor/profile" className="text-sm font-medium text-blue-600 hover:underline">
              My Profile
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline flex items-center gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 rounded-t-xl">
            <h2 className="text-lg font-medium text-gray-900">Your Trainees</h2>
            <p className="mt-1 text-sm text-gray-500">Monitor and view DTR records of students assigned to you.</p>
          </div>
          
          <ul className="divide-y divide-gray-200">
            {trainees.length === 0 ? (
              <li className="px-6 py-12 text-center text-gray-500">
                <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                No trainees are currently linked to your account. <br/>
                They need to send you an invite from their profile page.
              </li>
            ) : (
              trainees.map((trainee) => {
                const totalCompleted = trainee.dtrRecords.reduce((acc, r) => acc + r.totalHours, 0);
                return (
                <li key={trainee.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        {trainee.name || "Unnamed Trainee"}
                      </h3>
                      <p className="text-sm text-gray-500">{trainee.email}</p>
                    </div>
                    {trainee.targetHours && trainee.targetHours > 0 && (
                      <div className="sm:text-right w-full sm:w-64">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs font-semibold text-blue-900">OJT Hours Progress</span>
                          <span className="text-xs font-bold text-blue-700">
                            {totalCompleted.toFixed(1)} / {trainee.targetHours} hrs
                          </span>
                        </div>
                        <div className="w-full bg-blue-100 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.max(0, (totalCompleted / trainee.targetHours) * 100))}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                      Recent DTR Records
                    </h4>
                    {trainee.dtrRecords.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No DTR records generated yet.</p>
                    ) : (
                      <div className="flex gap-4 overflow-x-auto pb-2">
                        {[...trainee.dtrRecords]
                          .sort((a, b) => b.year - a.year || b.month - a.month)
                          .map((dtr) => (
                          <div key={dtr.id} className="flex-shrink-0 min-w-48 bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition">
                             <div className="flex justify-between items-center">
                                <span className="font-medium text-sm text-gray-800">
                                   {new Date(dtr.year, dtr.month - 1).toLocaleString('default', { month: 'long', year: 'numeric'})}
                                </span>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  dtr.status === 'submitted' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {dtr.status}
                                </span>
                             </div>
                             <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                               <span>{dtr.totalHours.toFixed(1)} hrs</span>
                               {/* Link points to the general DTR print view since Supervisors might want to review it. 
                                   Modify the DTR page to allow supervisors read access if needed. */}
                               <Link
                                 href={`/dtr/${dtr.id}`}
                                 className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
                               >
                                 View Record
                                 <ChevronRight className="h-3 w-3 ml-1" />
                               </Link>
                             </div>
                          </div>
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