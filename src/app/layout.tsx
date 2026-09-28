import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";
import { RegisterSW } from "@/components/pwa/register-sw";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { SecureFetchSetup } from "@/components/secure-fetch-setup";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OJT Daily Time Record",
  description: "Web-based OJT DTR recording system",
  applicationName: "OJT DTR",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/DTR-ICON.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/DTR-ICON.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "OJT DTR",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <SecureFetchSetup />
      </head>
      <body className={`${geistSans.variable} antialiased flex flex-col min-h-screen bg-slate-50 text-slate-900`}>
        <SessionProvider>
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <RegisterSW />
          <InstallPrompt />
          <footer className="border-t border-gray-200/70 bg-white/90 backdrop-blur-md py-5 px-4 sm:px-8 mt-auto">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-2.5 text-center sm:text-left">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  NJ
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-xs">OJT Daily Time Record System</p>
                  <p className="text-[11px] text-gray-400">
                    Created by <span className="text-blue-600 font-medium">Noel John Mateo</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-gray-400">
                <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Supabase Powered
                </span>
                <span>•</span>
                <span>Next.js 16</span>
                <span>•</span>
                <span>&copy; {new Date().getFullYear()} Noel John Mateo</span>
              </div>
            </div>
          </footer>
          <Toaster />
          <Analytics />
        </SessionProvider>
      </body>
    </html>
  );
}
