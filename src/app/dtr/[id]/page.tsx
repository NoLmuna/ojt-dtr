"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  Download,
  Save,
  Clock,
  FileText,
  User,
  GraduationCap,
  Building2,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { MONTHS, calculateHours, getDaysInMonth, formatHoursMinutes } from "@/lib/utils";
import { generateDTRPdf } from "@/lib/pdf";
import { GlobalLoader } from "@/components/global-loader";
import { toast } from "@/components/ui/toaster";

interface DTREntry {
  id?: string;
  day: number;
  amArrival: string;
  amDeparture: string;
  pmArrival: string;
  pmDeparture: string;
  hoursWorked: number;
  includeBreak?: boolean;
  remarks: string;
}

interface DTRRecord {
  id: string;
  userId: string;
  month: number;
  year: number;
  periodFrom: string;
  periodTo: string;
  totalHours: number;
  status: string;
  entries: DTREntry[];
  user: {
    name: string | null;
    email: string | null;
    course: string | null;
    school: string | null;
    company: string | null;
    supervisor: string | null;
    allowWeekends?: boolean;
  };
}

export default function DTREditorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [record, setRecord] = useState<DTRRecord | null>(null);
  const [entries, setEntries] = useState<Map<number, DTREntry>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  const fetchRecord = useCallback(async () => {
    const res = await fetch(`/api/dtr/${id}`, { cache: "no-store" });
    if (!res.ok) {
      router.replace("/dashboard");
      return;
    }
    const data: DTRRecord = await res.json();
    setRecord(data);

    const map = new Map<number, DTREntry>();
    data.entries.forEach((e) => {
      map.set(e.day, {
        ...e,
        amArrival: e.amArrival ?? "",
        amDeparture: e.amDeparture ?? "",
        pmArrival: e.pmArrival ?? "",
        pmDeparture: e.pmDeparture ?? "",
        includeBreak: e.includeBreak ?? true,
        remarks: e.remarks ?? "",
      });
    });
    setEntries(map);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchRecord();
    }
  }, [status, fetchRecord]);

  const updateEntry = <K extends keyof DTREntry>(day: number, field: K, value: DTREntry[K]) => {
    setEntries((prev) => {
      const updated = new Map(prev);
      const existing = updated.get(day) ?? {
        day,
        amArrival: "",
        amDeparture: "",
        pmArrival: "",
        pmDeparture: "",
        hoursWorked: 0,
        includeBreak: true,
        remarks: "",
      };
      const newEntry = { ...existing, [field]: value };
      newEntry.hoursWorked = calculateHours(
        newEntry.amArrival || null,
        newEntry.amDeparture || null,
        newEntry.pmArrival || null,
        newEntry.pmDeparture || null,
        newEntry.includeBreak !== undefined ? newEntry.includeBreak : true
      );
      updated.set(day, newEntry);
      return updated;
    });
  };

  const saveAll = async () => {
    setSaving(true);

    const entriesArray = Array.from(entries.values()).map((entry) => ({
      day: entry.day,
      amArrival: entry.amArrival || null,
      amDeparture: entry.amDeparture || null,
      pmArrival: entry.pmArrival || null,
      pmDeparture: entry.pmDeparture || null,
      includeBreak: entry.includeBreak !== undefined ? entry.includeBreak : true,
      remarks: entry.remarks || null,
    }));

    const saveResponse = await fetch(`/api/dtr/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: entriesArray }),
    });

    if (!saveResponse.ok) {
      const error = await saveResponse.json().catch(() => ({ error: "Failed to save record." }));
      setSaving(false);
      toast(error.error || "Failed to save record.", "error");
      return;
    }

    const res = await fetch(`/api/dtr/${id}`, { cache: "no-store" });
    const data = await res.json();
    setRecord((prev) => (prev ? { ...prev, totalHours: data.totalHours } : prev));

    setSaving(false);
    setSaved(true);
    toast("DTR record saved successfully.", "success");
    setTimeout(() => setSaved(false), 2000);
  };

  const exportPDF = () => {
    if (!record) return;
    const exportData = {
      ...record,
      totalHours: totalHours,
      entries: Array.from(entries.values()).map((e) => ({
        ...e,
        amArrival: e.amArrival || null,
        amDeparture: e.amDeparture || null,
        pmArrival: e.pmArrival || null,
        pmDeparture: e.pmDeparture || null,
        includeBreak: e.includeBreak !== undefined ? e.includeBreak : true,
        remarks: e.remarks || null,
      })),
    };
    generateDTRPdf(exportData);
    toast("Generating official CSC Form 48 PDF...", "success");
  };

  if (loading || !record) {
    return <GlobalLoader />;
  }

  const isOwner = session?.user?.id === record.userId;
  const isSupervisor = session?.user?.role === "SUPERVISOR";

  const daysInMonth = getDaysInMonth(record.month, record.year);
  const totalHours = Array.from(entries.values()).reduce(
    (sum, e) => sum + e.hoursWorked,
    0
  );

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

  const displayCompany = record.user.company
    ? record.user.company.length > 35
      ? `${record.user.company.slice(0, 32)}...`
      : record.user.company
    : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pb-20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href={isSupervisor ? "/supervisor/dashboard" : "/dashboard"}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition-all"
            >
              <ChevronLeft size={16} />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Link>

            <span className="text-slate-300">/</span>

            <div className="flex items-center gap-2">
              <Image
                src="/icons/DTR-ICON.png"
                alt="OJT DTR Logo"
                width={32}
                height={32}
                className="rounded-xl shadow-xs object-cover"
                priority
              />
              <div>
                <span className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                  {MONTHS[record.month - 1]} {record.year}
                </span>
                <span
                  className={`ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadge(
                    record.status
                  )}`}
                >
                  {record.status}
                </span>
              </div>
            </div>
          </div>

          {/* Action Area */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200/80 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-700 font-mono">
              <Clock size={14} className="text-blue-600" />
              <span>{formatHoursMinutes(totalHours)}</span>
            </div>

            <button
              onClick={exportPDF}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-3 sm:px-4 rounded-xl shadow-xs transition-all cursor-pointer active:scale-98"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Export Form 48 PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>

            {isOwner && (
              <button
                onClick={saveAll}
                disabled={saving}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold py-2 px-3 sm:px-4 rounded-xl shadow-xs transition-all cursor-pointer active:scale-98"
              >
                <Save size={14} />
                <span>{saving ? "Saving..." : "Save"}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Info Banner Card */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <User size={13} className="text-blue-600" />
                Trainee Name
              </span>
              <p className="font-bold text-sm text-slate-800 truncate">
                {record.user.name || <span className="text-slate-400 font-normal italic">Not set</span>}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <GraduationCap size={13} className="text-indigo-600" />
                Course / Program
              </span>
              <p className="font-bold text-sm text-slate-800 truncate">
                {record.user.course || <span className="text-slate-400 font-normal italic">Not set</span>}
              </p>
            </div>

            <div className="space-y-1" title={record.user.company || ""}>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Building2 size={13} className="text-emerald-600" />
                Agency / Workplace
              </span>
              <p className="font-bold text-sm text-slate-800 truncate">
                {displayCompany || <span className="text-slate-400 font-normal italic">Not set</span>}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-violet-600" />
                Supervisor
              </span>
              <p className="font-bold text-sm text-slate-800 truncate">
                {record.user.supervisor ? (
                  <span className="text-emerald-700 font-semibold">{record.user.supervisor}</span>
                ) : (
                  <span className="text-slate-400 font-normal italic">Unassigned</span>
                )}
              </p>
            </div>
          </div>

          {(!record.user.name || !record.user.company) && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-xl">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} />
                <span>Some profile fields are incomplete for this record.</span>
              </div>
              <Link href="/profile" className="font-bold underline hover:text-amber-900">
                Update Profile &rarr;
              </Link>
            </div>
          )}
        </div>

        {/* DTR Table Sheet Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">Attendance Sheet Entries</h2>
              <p className="text-xs text-slate-500">
                Record morning and afternoon arrivals and departures. Changes are computed in real time.
              </p>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Month total: <span className="font-bold text-blue-700 font-mono">{formatHoursMinutes(totalHours)}</span>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 text-center w-14">Day</th>
                  <th className="py-3 px-2 text-center" colSpan={2}>
                    Morning (A.M.)
                  </th>
                  <th className="py-3 px-2 text-center" colSpan={2}>
                    Afternoon (P.M.)
                  </th>
                  <th className="py-3 px-3 text-center w-24">Rendered</th>
                  <th className="py-3 px-3 text-center w-20">1-hr Break</th>
                  <th className="py-3 px-3 text-left min-w-[140px]">Remarks</th>
                </tr>
                <tr className="bg-slate-100/60 border-b border-slate-200/70 text-[10px] text-slate-400 font-semibold uppercase">
                  <th />
                  <th className="py-1 px-2 text-center">Arrival</th>
                  <th className="py-1 px-2 text-center">Departure</th>
                  <th className="py-1 px-2 text-center">Arrival</th>
                  <th className="py-1 px-2 text-center">Departure</th>
                  <th />
                  <th />
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const date = new Date(record.year, record.month - 1, day);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const allowWeekends = record.user.allowWeekends ?? false;
                  const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
                  const entry = entries.get(day);

                  return (
                    <tr
                      key={day}
                      className={`transition-colors ${
                        isWeekend && !allowWeekends
                          ? "bg-slate-50/70 text-slate-400"
                          : isWeekend && allowWeekends
                          ? "bg-amber-50/30 hover:bg-amber-50/60"
                          : "hover:bg-blue-50/30"
                      }`}
                    >
                      {/* Day Column */}
                      <td className="py-2.5 px-3 text-center font-bold">
                        <div className="flex flex-col items-center">
                          <span className={`text-xs ${isWeekend ? "text-slate-400" : "text-slate-900"}`}>{day}</span>
                          <span className={`text-[10px] uppercase font-semibold ${isWeekend ? "text-rose-400" : "text-slate-400"}`}>
                            {dayName}
                          </span>
                        </div>
                      </td>

                      {/* Weekend Skipped or Time Inputs */}
                      {isWeekend && !allowWeekends ? (
                        <td colSpan={7} className="py-2.5 px-3 text-center text-slate-400 text-xs italic bg-slate-50/50">
                          Weekend
                        </td>
                      ) : (
                        <>
                          {(["amArrival", "amDeparture", "pmArrival", "pmDeparture"] as const).map((field) => {
                            const defaultTimes: Record<typeof field, string> = {
                              amArrival: "08:00",
                              amDeparture: "12:00",
                              pmArrival: "13:00",
                              pmDeparture: "17:00",
                            };
                            return (
                              <td key={field} className="py-1.5 px-1.5">
                                <input
                                  disabled={!isOwner}
                                  type="time"
                                  value={entry?.[field] ?? ""}
                                  onFocus={() => {
                                    if (!entry?.[field] && isOwner) {
                                      updateEntry(day, field, defaultTimes[field]);
                                    }
                                  }}
                                  onChange={(e) => updateEntry(day, field, e.target.value)}
                                  className="w-full min-w-[76px] border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs"
                                />
                              </td>
                            );
                          })}

                          {/* Hours Rendered */}
                          <td className="py-2 px-3 text-center font-mono font-bold text-xs text-blue-700">
                            {entry && entry.hoursWorked > 0 ? formatHoursMinutes(entry.hoursWorked) : "—"}
                          </td>

                          {/* 1-Hr Break Checkbox */}
                          <td className="py-2 px-3 text-center">
                            <input
                              disabled={!isOwner}
                              type="checkbox"
                              checked={entry?.includeBreak ?? true}
                              onChange={(e) => updateEntry(day, "includeBreak", e.target.checked)}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                          </td>

                          {/* Remarks */}
                          <td className="py-1.5 px-2">
                            <input
                              disabled={!isSupervisor}
                              type="text"
                              value={entry?.remarks ?? ""}
                              onChange={(e) => updateEntry(day, "remarks", e.target.value)}
                              placeholder={isSupervisor ? "Add supervisor note" : "Optional"}
                              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs"
                            />
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200/90 font-bold text-slate-800 text-xs">
                  <td colSpan={5} className="py-3 px-4 text-right uppercase tracking-wider">
                    Total Hours Rendered:
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-sm text-blue-700">
                    {formatHoursMinutes(totalHours)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Bottom Floating Save Action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-xs text-slate-500">
            Export generates an official double-column Civil Service Form 48 ready for printing and signatures.
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={exportPDF}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-98"
            >
              <Download size={15} />
              <span>Export Form 48 PDF</span>
            </button>

            {isOwner && (
              <button
                onClick={saveAll}
                disabled={saving}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-md transition-all cursor-pointer active:scale-98"
              >
                <Save size={15} />
                <span>{saving ? "Saving..." : saved ? "✓ Saved" : "Save All Changes"}</span>
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
