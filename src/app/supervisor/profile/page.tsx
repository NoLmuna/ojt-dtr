"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Save, User, ChevronLeft, LogOut, CheckCircle2 } from "lucide-react";
import { GlobalLoader } from "@/components/global-loader";

interface SupervisorProfile {
  name: string;
  company: string;
}

export default function SupervisorProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<SupervisorProfile>({
    name: "",
    company: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    } else if (status === "authenticated" && session?.user?.role !== "SUPERVISOR" && session?.user?.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/user")
        .then((r) => r.json())
        .then((data) => {
          setProfile({
            name: data.name ?? "",
            company: data.company ?? "",
          });
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [status]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || status === "loading") {
    return <GlobalLoader />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-900 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 w-full border-b border-zinc-200/80 bg-white/95 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/supervisor/dashboard"
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

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 py-8 w-full space-y-6">
        <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                <User size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-zinc-900">Supervisor Profile</h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Supervisor
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">{session?.user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
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

          <div className="p-5 sm:p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="e.g. Engr. Maria Santos"
                className="w-full border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                Company / Agency Name
              </label>
              <input
                type="text"
                value={profile.company}
                onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                placeholder="Company or Agency Name"
                className="w-full border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}