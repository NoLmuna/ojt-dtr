"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  MapPin,
  Save,
  User,
  Building2,
  GraduationCap,
  Clock,
  Mail,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Send,
  ShieldCheck
} from "lucide-react";
import { GlobalLoader } from "@/components/global-loader";
import { formatTime } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface ProfileData {
  name: string;
  course: string;
  school: string;
  company: string;
  companyLat: number | null;
  companyLng: number | null;
  supervisorId: string | null;
  supervisorEmail?: string;
  supervisorName?: string;
  targetHours: number | null;
  allowWeekends: boolean;
  workStartTime: string | null;
  workEndTime: string | null;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    course: "",
    school: "",
    company: "",
    companyLat: null,
    companyLng: null,
    supervisorId: null,
    targetHours: null,
    allowWeekends: false,
    workStartTime: "07:30",
    workEndTime: "16:30",
  });
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [inviteError, setInviteError] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const companyWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    } else if (status === "authenticated" && session?.user?.role === "SUPERVISOR") {
      router.replace("/supervisor/profile");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/user")
        .then((r) => r.json())
        .then((data) => {
          setProfile({
            name: data.name ?? "",
            course: data.course ?? "",
            school: data.school ?? "",
            company: data.company ?? "",
            companyLat: data.companyLat ?? null,
            companyLng: data.companyLng ?? null,
            supervisorId: data.supervisorId ?? null,
            supervisorEmail: data.supervisor?.email ?? "",
            supervisorName: data.supervisor?.name ?? "",
            targetHours: data.targetHours ?? null,
            allowWeekends: data.allowWeekends ?? false,
            workStartTime: data.workStartTime ?? "07:30",
            workEndTime: data.workEndTime ?? "16:30",
          });
          setLoading(false);
        });
    }
  }, [status]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (companyWrapperRef.current && !companyWrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCompanyChange = (value: string) => {
    setProfile((prev) => ({ ...prev, company: value, companyLat: null, companyLng: null }));
    setSuggestions([]);
    setShowSuggestions(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 3) return;

    debounceRef.current = setTimeout(async () => {
      setSuggestionLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(value)}`);
        const data: NominatimResult[] = await res.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestionLoading(false);
      }
    }, 500);
  };

  const handleSelectSuggestion = (result: NominatimResult) => {
    setProfile((prev) => ({
      ...prev,
      company: result.display_name,
      companyLat: parseFloat(result.lat),
      companyLng: parseFloat(result.lon),
    }));
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { supervisorEmail: _se, supervisorName: _sn, ...dataToSave } = profile;
    void _se;
    void _sn;

    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Failed to save profile." }));
        toast(errorData.error || "Failed to save profile.", "error");
        setSaving(false);
        return;
      }

      setSaving(false);
      setSuccess(true);
      toast("Profile updated successfully.", "success");
      setTimeout(() => setSuccess(false), 2500);
    } catch {
      toast("An error occurred while saving profile.", "error");
      setSaving(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    setInviteError("");
    setInviteSuccess("");
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supervisorEmail: inviteEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteSuccess(`Invitation sent to ${inviteEmail}!`);
        setInviteEmail("");
      } else {
        setInviteError(data.error || "Failed to send invitation.");
      }
    } catch {
      setInviteError("Network error sending invitation.");
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return <GlobalLoader />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-900 flex flex-col pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 w-full border-b border-zinc-200/80 bg-white/95 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-900 bg-white hover:bg-zinc-50 border border-zinc-200/90 px-3 py-1.5 rounded-xl shadow-2xs transition-all"
            >
              <ChevronLeft size={16} />
              <span>Back to Dashboard</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Image
                src="/icons/DTR-ICON.png"
                alt="OJT DTR Logo"
                width={32}
                height={32}
                className="rounded-xl object-cover ring-1 ring-zinc-200"
                priority
              />
              <span className="font-bold text-sm text-zinc-900 tracking-tight hidden sm:inline-block">
                OJT<span className="text-blue-600">.DTR</span>
              </span>
            </div>

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

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* User Card Header */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt="avatar"
                width={48}
                height={48}
                className="rounded-xl ring-1 ring-zinc-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                {profile.name ? profile.name.charAt(0) : "U"}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">
                  {profile.name || "Trainee Profile"}
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                  Trainee
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">{session?.user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {success && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                <CheckCircle2 size={14} />
                <span>Saved</span>
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold py-2 px-4 rounded-xl shadow-xs transition-colors cursor-pointer active:scale-98"
            >
              <Save size={14} />
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </div>

        {/* Section 1: Target Hours & Schedule Settings */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100">
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Clock size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-900">Internship Program & Hours</h2>
              <p className="text-xs text-zinc-500">Configure your required hours and work week policies.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Target Hours */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                Target OJT Hours
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={profile.targetHours ?? ""}
                  onChange={(e) =>
                    setProfile((prev) => ({
                       ...prev,
                      targetHours: e.target.value ? parseInt(e.target.value, 10) : null,
                    }))
                  }
                  placeholder="e.g. 500"
                  className="w-full border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400">
                  Hours
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Used to compute your completion progress on the dashboard.
              </p>
            </div>

            {/* Weekend Toggle */}
            <div className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
              <div className="space-y-0.5 pr-2">
                <span className="text-xs font-semibold text-zinc-800 block">Weekend Attendance</span>
                <span className="text-[11px] text-zinc-500 block">
                  Allow logging hours on Saturdays and Sundays.
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={profile.allowWeekends}
                onClick={() => setProfile((prev) => ({ ...prev, allowWeekends: !prev.allowWeekends }))}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  profile.allowWeekends ? "bg-blue-600" : "bg-zinc-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    profile.allowWeekends ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Regular Days Arrival and Departure */}
          <div className="pt-4 border-t border-zinc-100 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
                  Official Hours of Arrival &amp; Departure
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Set your daily schedule (Time In / Time Out) printed on Civil Service Form No. 48.
                </p>
              </div>
              {(profile.workStartTime || profile.workEndTime) && (
                <span className="self-start sm:self-auto inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                  Regular Days: {formatTime(profile.workStartTime || "07:30")} - {formatTime(profile.workEndTime || "16:30")}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                  Regular Arrival (Time In)
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={profile.workStartTime ?? "07:30"}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        workStartTime: e.target.value || null,
                      }))
                    }
                    className="w-full border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Default: 7:30 AM
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                  Regular Departure (Time Out)
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={profile.workEndTime ?? "16:30"}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        workEndTime: e.target.value || null,
                      }))
                    }
                    className="w-full border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Default: 4:30 PM
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Personal & Academic Information */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100">
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <GraduationCap size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-900">Academic & Trainee Information</h2>
              <p className="text-xs text-zinc-500">Details printed on official Civil Service Form 48 header.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Juan dela Cruz"
                className="w-full border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                Course / Program
              </label>
              <input
                type="text"
                value={profile.course}
                onChange={(e) => setProfile((prev) => ({ ...prev, course: e.target.value }))}
                placeholder="e.g. BS Information Technology"
                className="w-full border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                School / University
              </label>
              <input
                type="text"
                value={profile.school}
                onChange={(e) => setProfile((prev) => ({ ...prev, school: e.target.value }))}
                placeholder="e.g. University of the Philippines"
                className="w-full border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Training Organization & Geofence Coordinates */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100">
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Building2 size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-900">Training Agency & Location Geofence</h2>
              <p className="text-xs text-zinc-500">
                Punches are validated within a 100-meter radius of these coordinates.
              </p>
            </div>
          </div>

          <div ref={companyWrapperRef} className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
              Company / Agency Address
            </label>
            <div className="relative">
              <input
                type="text"
                value={profile.company}
                onChange={(e) => handleCompanyChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Search workplace address (e.g. Subic Bay, DOST, etc.)"
                autoComplete="off"
                className="w-full border border-zinc-300 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {suggestionLoading ? (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : profile.companyLat !== null ? (
                  <span className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 size={14} />
                  </span>
                ) : (
                  <MapPin size={16} className="text-zinc-400" />
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {showSuggestions && (
                <ul className="absolute z-50 mt-1.5 w-full bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-zinc-100">
                  {suggestions.map((s) => (
                    <li key={s.place_id}>
                      <button
                        type="button"
                        onMouseDown={() => handleSelectSuggestion(s)}
                        className="w-full text-left px-4 py-2.5 text-xs text-zinc-700 hover:bg-zinc-50 flex items-start gap-2.5 transition-colors cursor-pointer"
                      >
                        <MapPin size={14} className="mt-0.5 shrink-0 text-blue-600" />
                        <span className="line-clamp-2 leading-relaxed">{s.display_name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Geofence Status Badge */}
            {profile.companyLat !== null ? (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                <span>
                  Location pinned ({profile.companyLat.toFixed(4)}, {profile.companyLng?.toFixed(4)}) — Geofence punch enabled.
                </span>
              </div>
            ) : profile.company.trim().length > 0 ? (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                <AlertCircle size={14} className="shrink-0 text-amber-600" />
                <span>Select from the search dropdown suggestions to pin coordinates for GPS verification.</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Section 4: Supervisor Association */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100">
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <ShieldCheck size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-900">Designated Supervisor</h2>
              <p className="text-xs text-zinc-500">Supervisors can inspect attendance records and sign off monthly hours.</p>
            </div>
          </div>

          <div>
            {profile.supervisorId ? (
              <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <User size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                      Active Supervisor
                    </span>
                    <span className="text-sm font-semibold text-zinc-900">
                      {profile.supervisorName || profile.supervisorEmail}
                    </span>
                    {profile.supervisorEmail && profile.supervisorName && (
                      <span className="text-xs text-zinc-500 block">{profile.supervisorEmail}</span>
                    )}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-white border border-emerald-300 px-3 py-1 rounded-full shadow-2xs">
                  <CheckCircle2 size={13} />
                  Linked
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-zinc-500">
                  Send an email invitation. Once accepted, your supervisor will be automatically linked to review your logs.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <div className="relative flex-1 w-full">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="supervisor@agency.gov.ph"
                      className="w-full border border-zinc-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={!inviteEmail || inviting}
                    onClick={handleInvite}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-98"
                  >
                    <Send size={13} />
                    <span>{inviting ? "Sending..." : "Send Invite"}</span>
                  </button>
                </div>
                {inviteError && <p className="text-xs font-semibold text-rose-600 mt-1">{inviteError}</p>}
                {inviteSuccess && <p className="text-xs font-semibold text-emerald-600 mt-1">{inviteSuccess}</p>}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
