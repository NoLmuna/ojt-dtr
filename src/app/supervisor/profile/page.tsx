"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Save, User, ChevronLeft, LogOut } from "lucide-react";
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/supervisor/dashboard"
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
            >
              <ChevronLeft size={20} />
            </Link>
            <span className="font-semibold text-gray-800">My Profile</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center text-sm font-medium gap-1.5 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-2xl mx-auto px-4 py-8 w-full">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 text-blue-600 p-3 rounded-full">
                <User size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Supervisor Profile</h1>
                <p className="text-sm text-gray-500">{session?.user?.email}</p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="e.g. Engr. Maria Santos"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company / Organization
              </label>
              <input
                type="text"
                value={profile.company}
                onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                placeholder="Company Name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              {success ? (
                <span className="text-green-600 text-sm font-medium">✓ Profile saved successfully</span>
              ) : (
                <span className="hidden sm:block" />
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex w-full sm:w-auto items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-5 rounded-lg transition-colors text-sm"
              >
                <Save size={15} />
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}