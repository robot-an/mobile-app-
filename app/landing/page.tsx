"use client";

import React from "react";
import Link from "next/link";
import { 
  Activity, 
  ArrowRight, 
  Sparkles,
  ShieldCheck,
  Heart,
  MapPin
} from "lucide-react";
import AppLogo from "@/components/AppLogo";
import QRCodeCard from "@/components/landing/QRCodeCard";
import { APP_DOWNLOAD_CONFIG, getIosTargetUrl } from "@/lib/downloadConfig";

export default function LandingPage() {
  const iosQrUrl = APP_DOWNLOAD_CONFIG.ios.directQrToStore
    ? getIosTargetUrl()
    : "https://www.roboaian.com/ios";

  const androidQrUrl = "https://www.roboaian.com/android";

  return (
    <div className="h-screen max-h-screen w-full bg-gradient-to-br from-orange-50/90 via-white to-amber-50/60 text-slate-800 flex flex-col justify-between font-sans antialiased selection:bg-orange-500 selection:text-white overflow-hidden select-none">
      
      {/* Background Soft Orange Ambient Lights */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-orange-300/30 via-amber-200/20 to-transparent rounded-full blur-[110px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-orange-200/25 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[250px] bg-amber-200/20 rounded-full blur-[90px]" />
      </div>

      {/* Top Header Bar - Tràn 2 viền */}
      <header className="w-full backdrop-blur-md bg-white/80 border-b border-orange-100 flex-shrink-0 z-50">
        <div className="w-full px-4 sm:px-8 lg:px-12 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-3 group">
            <AppLogo size="sm" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-slate-900 text-sm sm:text-base tracking-tight">
                  ROBOT Y TẾ
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black tracking-wider shadow-sm">
                  AN
                </span>
              </div>
              <p className="text-[10px] font-mono text-orange-600 font-bold tracking-wider">
                https://www.roboaian.com/
              </p>
            </div>
          </Link>

          {/* Quick link to Dashboard */}
          <Link
            href="/"
            className="py-1.5 sm:py-2 px-3.5 sm:px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-orange-500/20 active:scale-95"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Vào Web Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Single Screen Content - Không lướt & Tràn 2 viền */}
      <main className="flex-1 w-full px-4 sm:px-8 lg:px-12 flex flex-col justify-center items-center py-2 sm:py-4">
        
        {/* Title & Introduction - Thiết kế tỉ mỉ, cân đối & liên kết trực tiếp với 2 thẻ QR */}
        <div className="text-center max-w-4xl mb-3 sm:mb-4 flex flex-col items-center">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/95 border border-orange-200 text-orange-700 text-[11px] sm:text-xs font-bold mb-2 shadow-xs backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
            </span>
            <span>Hệ Thống Giám Hộ Y Tế & Sức Khỏe Thông Minh</span>
            <span className="text-slate-300 font-normal">•</span>
            <span className="text-orange-600 font-mono font-bold">roboaian.com</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-2xl sm:text-3xl lg:text-[36px] font-black text-slate-900 tracking-tight leading-tight mb-1.5">
            Tải Ứng Dụng Giám Hộ{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500">
              Robot An
            </span>
          </h1>

          {/* Subtitle - Giữ câu từ liền mạch, giới thiệu rõ ràng 2 nền tảng bên dưới */}
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed mb-2.5">
            Quét mã QR tương ứng bên dưới để cài đặt ứng dụng cho thiết bị iOS hoặc Android của bạn.
          </p>

          {/* 3 Core Trust Badges in Unified Glass Capsule - Đồng bộ màu và viền với 2 thẻ QR */}
          <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 p-1 rounded-2xl bg-orange-100/50 border border-orange-200/70 backdrop-blur-sm shadow-xs">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white text-slate-700 text-[11px] font-semibold shadow-xs border border-orange-100">
              <Heart className="w-3.5 h-3.5 text-red-500 fill-red-100" />
              <span>Cảnh báo té ngã & SOS</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white text-slate-700 text-[11px] font-semibold shadow-xs border border-orange-100">
              <MapPin className="w-3.5 h-3.5 text-blue-500 fill-blue-100" />
              <span>Định vị GPS trực tiếp</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white text-slate-700 text-[11px] font-semibold shadow-xs border border-orange-100">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
              <span>Đồng bộ Sổ Y bạ 24/7</span>
            </div>
          </div>
        </div>

        {/* 2 Wide 3D QR Cards - Tràn rộng sang 2 bên màn hình */}
        <div className="w-full max-w-[1400px] grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-8">
          {/* Card 1: iOS */}
          <QRCodeCard
            platform="ios"
            title="Ứng Dụng Cho iOS"
            subtitle="iPhone & iPad (iOS 15.0+)"
            url={iosQrUrl}
            badgeLabel="Apple App Store"
            versionReq="iOS 15+"
            fallbackDirectDownloadUrl="/roboaian.mobileconfig"
            features={[
              "Chuông cảnh báo SOS âm lượng cao phá vỡ Im lặng",
              "Định vị vệ tinh GPS độ trễ cực thấp",
              "Nhắc uống thuốc và đồng bộ Sổ Y bạ tự động"
            ]}
          />

          {/* Card 2: Android */}
          <QRCodeCard
            platform="android"
            title="Ứng Dụng Cho Android"
            subtitle="Mọi thiết bị Android (Android 10+)"
            url={androidQrUrl}
            badgeLabel="Google Play / APK"
            versionReq="Android 10+"
            fallbackDirectDownloadUrl="/roboaian.apk"
            features={[
              "Còi hú cứu hộ tự kích hoạt khi té ngã",
              "Dịch vụ chạy nền tối ưu tiết kiệm pin",
              "Kết nối WiFi & Bluetooth BLE trực tiếp với Robot"
            ]}
          />
        </div>

        {/* Quick Tip */}
        <div className="mt-3 text-center">
          <p className="text-[11px] text-slate-500 font-medium">
            💡 <span className="font-bold text-slate-700">Mẹo:</span> Bạn có thể mở trực tiếp{" "}
            <code className="text-orange-600 bg-orange-100/70 px-1.5 py-0.5 rounded font-mono font-bold">
              https://www.roboaian.com/
            </code>{" "}
            trên trình duyệt điện thoại để lưu làm ứng dụng Web (PWA).
          </p>
        </div>

      </main>

      {/* Minimal Footer - Tràn 2 viền */}
      <footer className="w-full border-t border-orange-100 bg-white/90 py-2.5 text-xs text-slate-500 flex-shrink-0">
        <div className="w-full px-4 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AppLogo size="sm" />
            <span className="font-bold text-slate-800">Robot Y Tế An</span>
            <span>—</span>
            <span className="text-orange-600 font-mono font-semibold">roboaian.com</span>
          </div>

          <p className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} Robot Y Tế An. Bảo vệ sức khỏe & tính mạng người thân 24/7.
          </p>
        </div>
      </footer>
    </div>
  );
}
