"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, 
  FileText, 
  Bot, 
  CalendarCheck2, 
  Settings,
  Mic
} from "lucide-react";
import SiriVoiceModal from "@/components/SiriVoiceModal";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const pressTimerRef = useRef<any>(null);
  const isLongPressRef = useRef<boolean>(false);

  const handlePointerDown = (e: React.PointerEvent | React.TouchEvent | React.MouseEvent) => {
    isLongPressRef.current = false;
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);

    // Kích hoạt chế độ Siri Voice Assistant sau 380ms giữ nút
    pressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setShowVoiceModal(true);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([40, 50, 40]);
      }
    }, 380);
  };

  const handlePointerUp = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }

    // Nếu chỉ là chạm nhanh (<380ms), mở trang chat bình thường
    if (!isLongPressRef.current) {
      router.push("/chat");
    }
  };

  const handlePointerLeave = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const navItems = [
    {
      label: "Tổng quan",
      href: "/",
      icon: Home,
    },
    {
      label: "Sổ Y Bạ",
      href: "/medical-record",
      icon: FileText,
    },
    {
      label: "AI An",
      href: "/chat",
      icon: Bot,
      isSpecial: true,
    },
    {
      label: "Lịch Nhắc",
      href: "/schedules",
      icon: CalendarCheck2,
    },
    {
      label: "Cài đặt",
      href: "/settings",
      icon: Settings,
    },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-elevated px-2 py-2 select-none">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            if (item.isSpecial) {
              return (
                <div
                  key={item.href}
                  onPointerDown={handlePointerDown}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerLeave}
                  onTouchStart={handlePointerDown}
                  onTouchEnd={handlePointerUp}
                  className="flex flex-col items-center -mt-5 group cursor-pointer"
                  title="Chạm để mở Chat • Giữ lâu để kích hoạt Trợ Lý Giọng Nói Siri"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-all transform active:scale-90 ${
                    isActive
                      ? "bg-medical-blue text-white ring-4 ring-blue-100 shadow-blue-500/30"
                      : "bg-slate-900 text-white group-hover:bg-medical-blue"
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-[10px] font-bold mt-1 ${
                    isActive ? "text-medical-blue" : "text-slate-700"
                  }`}>
                    {item.label}
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors duration-150 ${
                  isActive
                    ? "text-medical-blue font-bold"
                    : "text-slate-400 hover:text-slate-700 font-medium"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.25]" : "stroke-[1.75]"}`} />
                <span className="text-[10px] mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Modal Trợ Lý Giọng Nói Phong Cách Siri */}
      <SiriVoiceModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
      />
    </>
  );
}
