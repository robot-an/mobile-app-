"use client";

import React from "react";
import { usePathname } from "next/navigation";
import MobileHeader from "@/components/MobileHeader";
import BottomNav from "@/components/BottomNav";
import ReminderAlarm from "@/components/ReminderAlarm";
import AuthGate from "@/components/AuthGate";
import { HeaderActionProvider } from "@/lib/header-action-context";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Các route độc lập toàn màn hình (Landing page, trang tải app công khai)
  const isPublicLanding = 
    pathname === "/landing" || 
    pathname === "/download" ||
    pathname === "/ios" ||
    pathname === "/android";

  if (isPublicLanding) {
    return (
      <div className="w-full h-screen max-h-screen bg-white text-slate-900 overflow-hidden flex flex-col items-center">
        {children}
      </div>
    );
  }

  // Giao diện khung Mobile Companion App (bảo mật qua AuthGate & Sổ y bạ)
  return (
    <div className="w-full max-w-md h-[100dvh] max-h-[100dvh] bg-slate-50 shadow-2xl relative flex flex-col border-x border-slate-200 overflow-hidden">
      <AuthGate>
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

        {/* Báo thức nhắc thuốc - chạy nền toàn app */}
        <ReminderAlarm />
      </AuthGate>
    </div>
  );
}
