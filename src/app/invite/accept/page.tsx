"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { GlobalLoader } from "@/components/global-loader";
import { CheckCircle2, AlertCircle, Mail, LogIn, ArrowRight } from "lucide-react";

function InviteProcessor() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status, update } = useSession();
  
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    // If we have no session or are already processing/attempted, do nothing
    if (status !== "authenticated" || !token || hasAttempted) return;

    setHasAttempted(true);
    setLoading(true);
    setError(null);

    const acceptInvitation = async () => {
      try {
        const res = await fetch("/api/invite/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || "Failed to accept invite.");
        } else {
          setSuccess(true);
          await update(); // Force update the session so the new role is propagated
          // Redirect them to supervisor dashboard after 2.5 secs
          setTimeout(() => {
            router.replace("/supervisor/dashboard");
          }, 2500);
        }
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    acceptInvitation();
  }, [status, token, router, update, hasAttempted]);

  if (status === "loading" || loading) {
    return <GlobalLoader message={loading ? "Verifying and accepting invitation..." : "Loading..."} />;
  }

  // Missing token
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-zinc-200/80 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Invalid Invitation Link</h2>
          <p className="text-sm text-zinc-600 mb-6">
            This invitation link is missing a valid token. Please ensure you clicked the complete link in your email.
          </p>
          <button
            onClick={() => router.replace("/")}
            className="w-full py-2.5 px-4 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Not signed in
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-zinc-200/80 p-8 text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto">
            <Mail className="w-7 h-7 text-blue-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
              Supervisor Invitation
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              You have been invited to monitor a trainee&apos;s Daily Time Record (DTR). Please sign in with Google using your supervisor email to accept.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => signIn("google", { callbackUrl: window.location.href })}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-900 font-semibold py-3 px-5 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3L37 10.1C33.6 7 28.9 5 24 5 12.9 5 4 13.9 4 25s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.2-2.7-.1-5z" />
                <path fill="#FF3D00" d="M6.3 15.5l6.6 4.8C14.5 16.1 18.9 13 24 13c3 0 5.8 1.1 7.9 3L37 10.1C33.6 7 28.9 5 24 5 16.3 5 9.7 9.3 6.3 15.5z" />
                <path fill="#4CAF50" d="M24 45c4.9 0 9.4-1.8 12.8-4.8l-6-4.9C29 37.2 26.6 38 24 38c-5.2 0-9.6-2.9-11.3-7l-6.5 5C9.6 41 16.3 45 24 45z" />
                <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.4-2.5 4.4-4.8 5.7l6 4.9C40.6 35.2 44 30.5 44 25c0-1.3-.2-2.7-.4-5z" />
              </svg>
              <span>Sign In with Google to Accept</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error state (e.g. email mismatch)
  if (error) {
    const isEmailMismatch = error.toLowerCase().includes("mismatch");

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-zinc-200/80 p-8 text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-zinc-900">Invitation Error</h2>
            <p className="text-sm text-zinc-600 leading-relaxed">{error}</p>
          </div>

          <div className="space-y-3 pt-2">
            {isEmailMismatch && (
              <button
                onClick={() => signOut({ callbackUrl: window.location.href })}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                <LogIn size={16} />
                <span>Switch Google Account</span>
              </button>
            )}
            <button
              onClick={() => router.replace("/")}
              className="w-full py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-zinc-200/80 p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-zinc-900">Invitation Accepted!</h2>
            <p className="text-sm text-zinc-600">
              You are now registered as an OJT Supervisor. Redirecting to your dashboard...
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-blue-600 font-medium pt-2">
            <span>Taking you to Supervisor Dashboard</span>
            <ArrowRight size={14} className="animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<GlobalLoader />}>
      <InviteProcessor />
    </Suspense>
  );
}