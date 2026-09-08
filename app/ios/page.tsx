"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  ExternalLink, 
  Download, 
  Smartphone, 
  Sparkles,
  CheckCircle2,
  Share,
  PlusSquare,
  AlertCircle
} from "lucide-react";
import AppLogo from "@/components/AppLogo";
import { APP_DOWNLOAD_CONFIG, getIosTargetUrl } from "@/lib/downloadConfig";

export default function IOSDownloadPage() {
  const searchParams = useSearchParams();
  const [redirecting, setRedirecting] = useState(true);
  const [countdown, setCountdown] = useState(1);
  const [targetUrl, setTargetUrl] = useState<string>("");

  useEffect(() => {
    const methodParam = searchParams.get("method") || undefined;
    const isPreview = searchParams.get("preview") === "true";
    const customTarget = searchParams.get("target");

    const url = customTarget || getIosTargetUrl(methodParam);
    setTargetUrl(url);

    if (isPreview) {
      setRedirecting(false);
      return;
    }

    // Tự động kích hoạt tải xuống / chuyển hướng sau 300ms
    const timer = setTimeout(() => {
      if (url) {
        if (url.endsWith(".mobileconfig") || url.endsWith(".ipa")) {
          // Kích hoạt tải file trực tiếp cho iOS
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", "");
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          // Chuyển hướng trực tiếp vào App Store / TestFlight / OTA manifest
          window.location.href = url;
        }
      }
    }, 400);

    const countdownTimer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(countdownTimer);
    };
  }, [searchParams]);

  const handleManualDownload = () => {
    if (!targetUrl) return;
    if (targetUrl.endsWith(".mobileconfig") || targetUrl.endsWith(".ipa")) {
      const link = document.createElement("a");
      link.href = targetUrl;
      link.setAttribute("download", "");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.location.href = targetUrl;
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-orange-50/90 via-white to-amber-50/60 text-slate-800 flex flex-col justify-between items-center p-4 sm:p-6 select-none">
      
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-300/25 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[250px] bg-amber-200/20 rounded-full blur-[90px]" />
      </div>

      {/* Top Header Link */}
      <div className="w-full max-w-lg flex items-center justify-between py-2">
        <Link 
          href="/landing" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về trang chủ Landing Page</span>
        </Link>
        <span className="text-[11px] font-mono text-orange-600 font-bold">
          roboaian.com
        </span>
      </div>

      {/* Center Download Card */}
      <div className="max-w-lg w-full p-6 sm:p-8 rounded-3xl bg-white/95 border-2 border-orange-100 backdrop-blur-xl shadow-2xl shadow-orange-500/10 space-y-6 text-center my-auto">
        
        {/* Animated Brand Header */}
        <div className="flex flex-col items-center">
          <div className="relative mb-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 p-0.5 shadow-lg shadow-orange-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 fill-slate-900" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.4c.59-.72.99-1.72.88-2.72-.85.04-1.9.57-2.51 1.28-.54.62-.97 1.63-.85 2.61.96.07 1.92-.51 2.48-1.17z"/>
                </svg>
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500 border-2 border-white" />
            </span>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
            Tải Ứng Dụng Cho iPhone & iPad
          </span>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 tracking-tight">
            Robot Y Tế An - iOS
          </h1>
          
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            {redirecting ? (
              <span className="text-orange-600 font-semibold flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                Đang tự động kết nối & mở trình tải xuống...
              </span>
            ) : (
              "Ứng dụng giám sát sức khỏe & cảnh báo khẩn cấp thời gian thực."
            )}
          </p>
        </div>

        {/* Big Action Button */}
        <div className="space-y-3">
          <button
            onClick={handleManualDownload}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 transition-all transform active:scale-95"
          >
            <Download className="w-5 h-5 animate-bounce" />
            <span>Bấm Vào Đây Để Tải Xuống Ngay</span>
          </button>

          <p className="text-[11px] text-slate-400">
            Nếu màn hình không tự động chuyển, vui lòng bấm nút cam ở trên.
          </p>
        </div>

        {/* Options & Fallbacks */}
        <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200/80 text-left space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-orange-600" />
              Các cách cài đặt cho iOS:
            </span>
            <span className="text-[10px] font-semibold text-orange-600 bg-white px-2 py-0.5 rounded-md border border-orange-200">
              iOS 15.0+
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 text-xs">
            {/* Option 1: App Store */}
            <a
              href={APP_DOWNLOAD_CONFIG.ios.appStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-white hover:bg-orange-50/50 border border-orange-100 flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold p-1">
                  <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.4c.59-.72.99-1.72.88-2.72-.85.04-1.9.57-2.51 1.28-.54.62-.97 1.63-.85 2.61.96.07 1.92-.51 2.48-1.17z"/>
                  </svg>
                </span>
                <div>
                  <p className="font-bold text-slate-800 group-hover:text-orange-600">
                    Apple App Store
                  </p>
                  <p className="text-[10px] text-slate-400">Tải bản chính thức trên App Store</p>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-600" />
            </a>

            {/* Option 2: TestFlight */}
            {APP_DOWNLOAD_CONFIG.ios.testFlightUrl && (
              <a
                href={APP_DOWNLOAD_CONFIG.ios.testFlightUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-white hover:bg-orange-50/50 border border-orange-100 flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                    ✈
                  </span>
                  <div>
                    <p className="font-bold text-slate-800 group-hover:text-orange-600">
                      Apple TestFlight (Beta)
                    </p>
                    <p className="text-[10px] text-slate-400">Tham gia bản thử nghiệm nội bộ</p>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-600" />
              </a>
            )}

            {/* Option 3: Direct WebClip Profile */}
            <a
              href="/roboaian.mobileconfig"
              download
              className="p-2.5 rounded-xl bg-white hover:bg-orange-50/50 border border-orange-100 flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-orange-500 text-white flex items-center justify-center text-xs font-bold">
                  ⚙
                </span>
                <div>
                  <p className="font-bold text-slate-800 group-hover:text-orange-600">
                    Cài Đặt Trực Tiếp (Hồ Sơ Cấu Hình iOS)
                  </p>
                  <p className="text-[10px] text-slate-400">Ghim icon app lên màn hình chính không cần Store</p>
                </div>
              </div>
              <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-600" />
            </a>
          </div>

          {/* Quick Safari PWA tip */}
          <div className="pt-2 border-t border-orange-200/50 text-[11px] text-slate-500 space-y-1">
            <p className="font-bold text-slate-700 flex items-center gap-1">
              <Share className="w-3.5 h-3.5 text-orange-500" />
              Hoặc ghim nhanh qua Safari:
            </p>
            <p>
              Bấm biểu tượng <strong>Chia sẻ</strong> <Share className="w-3 h-3 inline text-slate-600" /> ở đáy Safari &rarr; Chọn <strong>"Thêm vào MH chính"</strong> <PlusSquare className="w-3 h-3 inline text-slate-600" /> &rarr; Bấm <strong>Thêm</strong>.
            </p>
          </div>
        </div>

        {/* Direct Web link */}
        <Link
          href="/"
          className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
        >
          <span>Mở Trực Tiếp Bản Web Dashboard</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Footer */}
      <div className="py-2 text-[11px] text-slate-400 text-center">
        © {new Date().getFullYear()} Robot Y Tế An. Bảo vệ sức khỏe &amp; an toàn người cao tuổi và trẻ em.
      </div>
    </div>
  );
}
