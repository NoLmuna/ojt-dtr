import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
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
  themeColor: "#ffffff",
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
      <body className={`${geistSans.variable} antialiased flex flex-col min-h-screen bg-slate-50 text-zinc-900 selection:bg-zinc-200 selection:text-zinc-900`}>
        <SessionProvider>
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <RegisterSW />
          <InstallPrompt />
          <footer className="border-t border-zinc-200/80 bg-white/90 backdrop-blur-md py-4 px-4 sm:px-8 mt-auto text-xs text-zinc-500">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-800">OJT Daily Time Record</span>
                <span className="text-zinc-300">•</span>
                <span className="text-zinc-500">Civil Service Form 48 Compliant</span>
              </div>
              <p className="text-zinc-400">
                &copy; {new Date().getFullYear()} OJT DTR System. All rights reserved.
              </p>
            </div>
          </footer>
          <Toaster />
          <Analytics />
        </SessionProvider>
      </body>
    </html>
  );
}
