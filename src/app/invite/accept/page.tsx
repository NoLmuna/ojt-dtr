"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { GlobalLoader } from "@/components/global-loader";

function InviteProcessor() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status, update } = useSession();
  
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace("/");
      return;
    }

    if (!token) {
      setError("No invitation token provided.");
      setLoading(false);
      return;
    }

    if (hasFetched) return;
    setHasFetched(true);

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
          // Redirect them to supervisor dashboard after 3 secs
          setTimeout(() => {
            router.replace("/supervisor/dashboard");
          }, 3000);
        }
      } catch (err) {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    acceptInvitation();

  }, [status, token, router, update, hasFetched]);

  if (loading || status === "loading") {
    return <GlobalLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 p-6 text-center">
        {error ? (
          <div>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Invitation Error</h2>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => router.replace("/")}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Go Home
            </button>
          </div>
        ) : success ? (
          <div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Invitation Accepted!</h2>
            <p className="text-gray-600 mb-4">You are now a supervisor. Redirecting you to your dashboard...</p>
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<GlobalLoader />}>
      <InviteProcessor />
    </Suspense>
  );
}