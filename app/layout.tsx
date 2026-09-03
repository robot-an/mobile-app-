import type { Metadata, Viewport } from "next";
import "./globals.css";
import MobileHeader from "@/components/MobileHeader";
import BottomNav from "@/components/BottomNav";
import ReminderAlarm from "@/components/ReminderAlarm";
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
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#2563EB",
};

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
      <body className="bg-slate-950 h-full flex justify-center text-slate-900 antialiased selection:bg-medical-blue selection:text-white overflow-hidden select-none">
        {/* Khung App Điện Thoại Di Động Cố Định (Fixed 100dvh Viewport) */}
        <div className="w-full max-w-md h-[100dvh] max-h-[100dvh] bg-slate-50 shadow-2xl relative flex flex-col border-x border-slate-200 overflow-hidden">
          <HeaderActionProvider>
            {/* Header Cố Định Ở Đầu */}
            <MobileHeader />

            {/* Container Nội Dung Chính Không Bị Cuộn Khung Ngoại */}
            <main className="flex-1 overflow-hidden relative flex flex-col">
              {children}
            </main>
          </HeaderActionProvider>

          {/* Thanh Điều Hướng Đáy Cố Định */}
          <BottomNav />

          {/* Báo thức nhắc thuốc - chạy nền toàn app, không phụ thuộc trang đang mở */}
          <ReminderAlarm />
        </div>
      </body>
    </html>
  );
}
