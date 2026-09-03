"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PhoneCall,
  ShieldAlert,
  Bell,
  FileText,
  CalendarCheck2,
  Sliders,
  Bot,
  Loader2
} from "lucide-react";
import { auth, onAuthStateChanged, User as FirebaseUser, db, doc, onSnapshot, RobotStatus } from "@/lib/firebase";
import UserAvatar from "@/components/UserAvatar";
import AppLogo from "@/components/AppLogo";
import { useHeaderActionContext } from "@/lib/header-action-context";

export default function MobileHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { action: headerAction } = useHeaderActionContext();

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [robotStatus, setRobotStatus] = useState<RobotStatus | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    try {
      const unsubStatus = onSnapshot(doc(db, "status", "an_robot_01"), (snap) => {
        if (snap.exists()) {
          setRobotStatus(snap.data() as RobotStatus);
        }
      });
      return () => unsubStatus();
    } catch (e) {}
  }, []);

  const isOnline = robotStatus?.is_online ?? true;
  const isCritical = robotStatus?.fall_detected || robotStatus?.sos_alert;
  const currentMode = robotStatus?.mode ?? "companion";

  const getPageInfo = () => {
    switch (pathname) {
      case "/medical-record":
        return {
          title: "Sổ Y Bạ & Sức Khỏe",
          subtitle: "Dữ liệu y tế gia đình",
          icon: FileText,
          iconColor: "text-medical-blue bg-blue-50 border-blue-100"
        };
      case "/chat":
        return {
          title: "Hội Thoại AI An",
          subtitle: currentMode === "companion" ? "Chế độ đồng hành" : "Chế độ học nói",
          icon: Bot,
          iconColor: "text-medical-blue bg-blue-50 border-blue-100"
        };
      case "/schedules":
        return {
          title: "Lịch Uống Thuốc",
          subtitle: "Nhắc nhở qua loa Robot",
          icon: CalendarCheck2,
          iconColor: "text-medical-blue bg-blue-50 border-blue-100"
        };
      case "/alerts":
        return {
          title: "Nhật Ký Cảnh Báo",
          subtitle: "Lịch sử an toàn & cứu hộ",
          icon: Bell,
          iconColor: "text-amber-600 bg-amber-50 border-amber-200"
        };
      case "/settings":
        return {
          title: "Cài Đặt Hệ Thống",
          subtitle: "Tùy chỉnh chế độ & âm thanh",
          icon: Sliders,
          iconColor: "text-medical-blue bg-blue-50 border-blue-100"
        };
      default:
        return {
          title: "Robot Y Tế - An",
          subtitle: currentMode === "companion" ? "Chế độ đồng hành" : "Chế độ học nói",
          icon: null,
          iconColor: ""
        };
    }
  };

  const pageInfo = getPageInfo();
  const PageIcon = pageInfo.icon;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs px-3.5 py-2.5 flex-shrink-0">
      <div className="flex items-center justify-between">
        {/* Left: Mascot Logo (Trang Chủ) HOẶC Icon Trang (Các trang khác) + Tiêu đề */}
        <div className="flex items-center space-x-2.5 min-w-0">
          {isHome ? (
            <Link href="/" className="hover:opacity-90 transition-opacity flex-shrink-0">
              <AppLogo size="sm" showText={false} />
            </Link>
          ) : (
            PageIcon && (
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 shadow-xs ${pageInfo.iconColor}`}>
                <PageIcon className="w-4 h-4" />
              </div>
            )
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs font-bold text-slate-900 leading-tight truncate">
                {pageInfo.title}
              </h1>
              {isHome && (
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  {isOnline && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? "bg-emerald-500" : "bg-slate-300"}`}></span>
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 font-medium truncate leading-none mt-0.5">
              {pageInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right Action Group: [Action trang hiện tại] + Bell + SOS 115 + Avatar */}
        <div className="flex items-center space-x-1.5 flex-shrink-0">
          {/* Nút Action riêng của trang (VD: Lưu Sổ Y Bạ) do trang tự đăng ký qua useHeaderAction */}
          {headerAction && (
            <button
              type="button"
              onClick={headerAction.onClick}
              disabled={headerAction.loading}
              title={headerAction.label}
              className="p-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white transition-all disabled:opacity-50"
            >
              {headerAction.loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <headerAction.icon className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Nút Thông Báo Bell */}
          <Link
            href="/alerts"
            className={`relative p-1.5 rounded-xl border transition-all ${
              pathname === "/alerts"
                ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                : isCritical
                ? "bg-red-50 text-red-600 border-red-200 animate-bounce"
                : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
            }`}
            title="Nhật ký cảnh báo"
          >
            <Bell className="w-4 h-4" />
            {isCritical && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-600 ring-2 ring-white animate-ping"></span>
            )}
          </Link>

          {/* Nút Gọi Cấp Cứu 115 */}
          <a
            href="tel:115"
            className="flex items-center space-x-1 py-1.5 px-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all"
            title="Gọi Cấp Cứu 115"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span className="font-mono text-xs">115</span>
          </a>

          {/* User Avatar */}
          <Link href="/settings" title="Cài đặt tài khoản">
            <UserAvatar user={user} size="sm" className="w-7 h-7 !rounded-lg border border-slate-200 text-[10px]" />
          </Link>
        </div>
      </div>
    </header>
  );
}
