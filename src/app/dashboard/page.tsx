"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  FileText,
  LogOut,
  ChevronRight,
  Clock,
  User,
  Download,
  LogIn,
  LogOut as LogOutIcon,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  TrendingUp,
  Building2,
  Sparkles
} from "lucide-react";
import { MONTHS, formatHoursMinutes, haversineDistance } from "@/lib/utils";
import { GlobalLoader } from "@/components/global-loader";
import { toast } from "@/components/ui/toaster";

interface DTRRecord {
  id: string;
  month: number;
  year: number;
  totalHours: number;
  status: string;
  periodFrom: string;
  periodTo: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [records, setRecords] = useState<DTRRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newMonth, setNewMonth] = useState(new Date().getMonth() + 1);
  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [creating, setCreating] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [punching, setPunching] = useState(false);
  const [companyCoords, setCompanyCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [targetHours, setTargetHours] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    } else if (status === "authenticated" && session?.user?.role === "SUPERVISOR") {
      router.replace("/supervisor/dashboard");
    }
  }, [status, session, router]);

  // Live ticking clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
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

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/dtr", { cache: "no-store" })
        .then((r) => r.json())
        .then((data) => {
          setRecords(Array.isArray(data) ? data : []);
          setLoading(false);
        });

      fetch("/api/user")
        .then((r) => r.json())
        .then((data) => {
          if (data.companyLat != null && data.companyLng != null) {
            setCompanyCoords({ lat: data.companyLat, lng: data.companyLng });
          }
          if (data.company) {
            setCompanyName(data.company);
          }
          if (data.targetHours != null) {
            setTargetHours(data.targetHours);
          }
        });
    }
  }, [status]);

  const createRecord = async () => {
    setCreating(true);

    const res = await fetch("/api/dtr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        month: newMonth,
        year: newYear,
      }),
    });

    if (res.ok) {
      const record = await res.json();
      router.push(`/dtr/${record.id}`);
    } else {
      const err = await res.json();
      toast(err.error || "Failed to create record.", "error");
      setCreating(false);
    }
  };

  const toggleSelect = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRecords);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRecords(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedRecords.size === records.length) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(new Set(records.map((r) => r.id)));
    }
  };

  const handlePunch = async (action: "timeIn" | "timeOut") => {
    setPunching(true);
    try {
      if (!companyCoords) {
        toast("Please set your Company location in Profile Settings first.", "error");
        return;
      }

      let position: GeolocationPosition;
      try {
        position = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          })
        );
      } catch (geoErr) {
        const denied = geoErr instanceof GeolocationPositionError && geoErr.code === 1;
        toast(
          denied
            ? "Location access denied. Please allow location permissions in your browser."
            : "Could not determine location. Please try again.",
          "error"
        );
        return;
      }

      const { latitude, longitude } = position.coords;
      const distance = haversineDistance(latitude, longitude, companyCoords.lat, companyCoords.lng);

      if (distance > 100) {
        toast(
          `You are ${Math.round(distance)}m away from workplace. You must be within 100m to punch.`,
          "error"
        );
        return;
      }

      const res = await fetch("/api/dtr/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, localDate: new Date().toISOString(), latitude, longitude }),
      });

      const data = await res.json();
      if (res.ok) {
        toast(`Successfully recorded ${action === "timeIn" ? "Time In" : "Time Out"}.`, "success");
        const updatedRecords = await fetch("/api/dtr", { cache: "no-store" }).then((r) => r.json());
        setRecords(Array.isArray(updatedRecords) ? updatedRecords : []);
      } else {
        toast(data.error || "Failed to record time.", "error");
      }
    } catch (err) {
      console.error(err);
      toast("An unexpected error occurred.", "error");
    } finally {
      setPunching(false);
    }
  };

  const exportSelected = async () => {
    if (selectedRecords.size === 0) return;
    setExporting(true);

    try {
      const recordsToExport = [];
      for (const id of selectedRecords) {
        const res = await fetch(`/api/dtr/${id}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          data.entries.sort((a: { day: number }, b: { day: number }) => a.day - b.day);
          recordsToExport.push(data);
        }
      }

      recordsToExport.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });

      const { generateMultiMonthPdf } = await import("@/lib/pdf");
      generateMultiMonthPdf(recordsToExport);
      toast(`Exported ${selectedRecords.size} record(s) to PDF.`, "success");
    } catch (err) {
      console.error(err);
      toast("Failed to export selected records.", "error");
    } finally {
      setExporting(false);
    }
  };

  if (status === "loading" || loading) {
    return <GlobalLoader />;
  }

  const totalRenderedHours = records.reduce((acc, r) => acc + r.totalHours, 0);
  const completionPercentage = targetHours && targetHours > 0
    ? Math.min(100, Math.max(0, (totalRenderedHours / targetHours) * 100))
    : 0;

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
      case "submitted":
        return "bg-blue-50 text-blue-700 border-blue-200/80";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200/80";
    }
  };

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date());

  // Truncate long company address for clean display
  const displayCompany = companyName ? (companyName.length > 40 ? `${companyName.slice(0, 38)}...` : companyName) : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <Image
                src="/icons/DTR-ICON.png"
                alt="OJT DTR Logo"
                width={36}
                height={36}
                className="rounded-xl shadow-xs object-cover"
                priority
              />
              <div>
                <span className="font-bold text-base text-slate-900 tracking-tight">OJT<span className="text-blue-600">.DTR</span></span>
                <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Trainee
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {(session?.user?.role === "SUPERVISOR" || session?.user?.role === "ADMIN") && (
              <Link
                href="/supervisor/dashboard"
                className="text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                Supervisor Panel
              </Link>
            )}

            <Link
              href="/profile"
              className="flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition-all"
            >
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt="avatar"
                  width={22}
                  height={22}
                  className="rounded-full ring-1 ring-slate-300"
                />
              ) : (
                <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px]">
                  {session?.user?.name ? session.user.name.charAt(0) : "U"}
                </div>
              )}
              <span className="font-semibold text-slate-800 hidden sm:inline-block max-w-[130px] truncate">
                {session?.user?.name || "Profile"}
              </span>
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Welcome back, {session?.user?.name?.split(" ")[0] || "Trainee"}
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-1.5">
              <Calendar size={13} className="text-slate-400" />
              <span>{formattedDate}</span>
            </p>
          </div>

          {/* Location Badge */}
          {companyName ? (
            <div
              title={companyName}
              className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-xl self-start md:self-center"
            >
              <Building2 size={15} className="text-blue-600 shrink-0" />
              <span className="font-medium text-slate-800">{displayCompany}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            </div>
          ) : (
            <Link
              href="/profile"
              className="flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3.5 py-2 rounded-xl transition-colors self-start md:self-center"
            >
              <AlertCircle size={14} />
              <span>Set Company Location in Profile &rarr;</span>
            </Link>
          )}
        </div>

        {/* Hero Attendance Station */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 sm:p-7 shadow-md relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-blue-300">
                  Daily Attendance Station
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {companyCoords ? "Geofence Ready" : "Location Required"}
                </span>
              </div>

              <div className="flex items-baseline gap-3">
                <div className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono text-white">
                  {currentTime || "--:--:-- --"}
                </div>
              </div>

              <p className="text-xs text-slate-300 max-w-md">
                {companyCoords
                  ? "Punches are verified within 100m radius of your registered agency."
                  : "Please configure your company coordinates in Profile to enable verified punches."}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <button
                onClick={() => handlePunch("timeIn")}
                disabled={punching}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm py-3 px-6 rounded-xl shadow-md transition-all duration-150 cursor-pointer active:scale-98"
              >
                <LogIn size={16} />
                <span>{punching ? "Verifying..." : "Time In (AM/PM)"}</span>
              </button>

              <button
                onClick={() => handlePunch("timeOut")}
                disabled={punching}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-slate-800/90 hover:bg-slate-700/90 hover:text-rose-300 disabled:opacity-50 text-slate-200 border border-slate-700 font-semibold text-sm py-3 px-6 rounded-xl transition-all duration-150 cursor-pointer active:scale-98"
              >
                <LogOutIcon size={16} />
                <span>{punching ? "Verifying..." : "Time Out (AM/PM)"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Total Rendered Hours */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Rendered Hours
              </span>
              <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Clock size={16} />
              </div>
            </div>

            <div>
              <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
                {formatHoursMinutes(totalRenderedHours)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Accumulated across {records.length} monthly DTR {records.length === 1 ? "sheet" : "sheets"}
              </p>
            </div>
          </div>

          {/* Card 2: Internship Target Hours */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Target Completion
              </span>
              {targetHours ? (
                <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-mono">
                  {completionPercentage.toFixed(1)}%
                </span>
              ) : null}
            </div>

            {targetHours && targetHours > 0 ? (
              <div className="space-y-2">
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span className="font-semibold text-slate-900">{totalRenderedHours.toFixed(1)} / {targetHours} hrs</span>
                  <span className="text-slate-500">
                    {targetHours - totalRenderedHours > 0
                      ? `${(targetHours - totalRenderedHours).toFixed(1)} hrs remaining`
                      : "Goal Completed"}
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-500 mb-2">No required target hours defined.</p>
                <Link
                  href="/profile"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Configure target in Profile &rarr;
                </Link>
              </div>
            )}
          </div>

          {/* Card 3: Form 48 Compliance */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Institutional Export
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <FileCheck size={16} />
              </div>
            </div>

            <div>
              <div className="text-base font-bold text-slate-900">
                CSC Form 48 Ready
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Official two-column civil service layout with signature sections.
              </p>
            </div>
          </div>
        </div>

        {/* Monthly DTR Records Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Section Header */}
          <div className="p-5 sm:p-6 border-b border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Monthly DTR Records
              </h2>
              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
                {records.length}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {records.length > 0 && (
                <button
                  onClick={toggleSelectAll}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  {selectedRecords.size === records.length ? "Deselect All" : "Select All"}
                </button>
              )}

              {selectedRecords.size > 0 && (
                <button
                  onClick={exportSelected}
                  disabled={exporting}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  {exporting ? (
                    <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
                  <span>Export PDF ({selectedRecords.size})</span>
                </button>
              )}

              <button
                onClick={() => setShowNewModal(true)}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <Plus size={15} />
                <span>New DTR Period</span>
              </button>
            </div>
          </div>

          {/* Records List */}
          {records.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Calendar size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800">No DTR records created yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Create your first monthly record to begin logging AM/PM attendance and tracking hours.
                </p>
              </div>
              <button
                onClick={() => setShowNewModal(true)}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                <Plus size={15} />
                <span>Create First Record</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {records.map((record) => {
                const isSelected = selectedRecords.has(record.id);

                return (
                  <div
                    key={record.id}
                    className={`flex items-center transition-colors group ${
                      isSelected ? "bg-blue-50/40" : "hover:bg-slate-50/70"
                    }`}
                  >
                    <label className="flex items-center justify-center pl-5 pr-3 py-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelect(record.id, e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </label>

                    <Link
                      href={`/dtr/${record.id}`}
                      className="flex-1 flex items-center justify-between py-4 pr-5 pl-2"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                          <Calendar size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm sm:text-base text-slate-900">
                              {MONTHS[record.month - 1]} {record.year}
                            </span>
                            <span
                              className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                                record.status
                              )}`}
                            >
                              {record.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1 font-mono font-medium text-slate-700">
                              <Clock size={12} className="text-slate-400" />
                              {formatHoursMinutes(record.totalHours)}
                            </span>
                            <span>•</span>
                            <span>
                              {new Date(record.periodFrom).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {new Date(record.periodTo).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 group-hover:text-blue-700 transition-colors">
                        <span className="hidden sm:inline">Open DTR</span>
                        <ChevronRight size={16} />
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* New DTR Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Create Monthly DTR</h2>
              <p className="text-xs text-slate-500 mt-1">
                Select the target month and year for your attendance sheet.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Month
                </label>
                <select
                  value={newMonth}
                  onChange={(e) => setNewMonth(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Year
                </label>
                <select
                  value={newYear}
                  onChange={(e) => setNewYear(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={createRecord}
                disabled={creating}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                {creating ? "Creating..." : "Create Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
