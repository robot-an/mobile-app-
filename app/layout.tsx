import type { Metadata, Viewport } from "next";
import "./globals.css";
import MobileHeader from "@/components/MobileHeader";
import BottomNav from "@/components/BottomNav";
import ReminderAlarm from "@/components/ReminderAlarm";
import AuthGate from "@/components/AuthGate";
import { HeaderActionProvider } from "@/lib/header-action-context";

export const metadata: Metadata = {
  title: "Robot y tế - An | App Giám Hộ Di Động",
  description: "Ứng dụng di động giám hộ kép: Người cao tuổi & Trẻ em - Tích hợp AI Gemini & IoT ESP32",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Robot An",
  },
  icons: {
    icon: "/logo-an-mark.svg",
    apple: "/logo-an-mark.svg",
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#173A56",
};

import AppShell from "@/components/AppShell";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
      </head>
      <body className="min-h-screen w-full bg-slate-950 flex justify-center text-slate-900 antialiased selection:bg-medical-blue selection:text-white">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
