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
  MoreVertical
} from "lucide-react";
import AppLogo from "@/components/AppLogo";
import { APP_DOWNLOAD_CONFIG } from "@/lib/downloadConfig";

export default function AndroidDownloadPage() {
  const searchParams = useSearchParams();
  const [redirecting, setRedirecting] = useState(true);
  const [targetUrl, setTargetUrl] = useState<string>("");

  useEffect(() => {
    const isPreview = searchParams.get("preview") === "true";
    const customTarget = searchParams.get("target");
    const downloadApk = searchParams.get("apk") === "true";

    const url = customTarget || (downloadApk ? APP_DOWNLOAD_CONFIG.android.directApkUrl : APP_DOWNLOAD_CONFIG.android.playStoreUrl);
    setTargetUrl(url);

    if (isPreview) {
      setRedirecting(false);
      return;
    }

    // Tự động chuyển hướng hoặc tải APK sau 400ms
    const timer = setTimeout(() => {
      if (url) {
        if (url.endsWith(".apk")) {
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", "");
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          window.location.href = url;
        }
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchParams]);

  const handleManualDownload = () => {
    if (!targetUrl) return;
    if (targetUrl.endsWith(".apk")) {
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
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-300/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[250px] bg-orange-200/20 rounded-full blur-[90px]" />
      </div>

      {/* Top Header Link */}
      <div className="w-full max-w-lg flex items-center justify-between py-2">
        <Link 
          href="/landing" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về trang chủ Landing Page</span>
        </Link>
        <span className="text-[11px] font-mono text-emerald-600 font-bold">
          roboaian.com
        </span>
      </div>

      {/* Center Download Card */}
      <div className="max-w-lg w-full p-6 sm:p-8 rounded-3xl bg-white/95 border-2 border-emerald-100 backdrop-blur-xl shadow-2xl shadow-emerald-500/10 space-y-6 text-center my-auto">
        
        {/* Animated Brand Header */}
        <div className="flex flex-col items-center">
          <div className="relative mb-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 fill-emerald-600" viewBox="0 0 24 24">
                  <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0003s.4482-1.0003.9993-1.0003c.5517 0 .9999.4486.9999 1.0003.0001.5517-.4482 1.0003-.9999 1.0003m-11.046 0c-.5511 0-.9993-.4486-.9993-1.0003s.4482-1.0003.9993-1.0003c.5516 0 .9999.4486.9999 1.0003 0 .5517-.4483 1.0003-.9999 1.0003m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5898 8.4116 13.8483 8.1 12 8.1c-1.8485 0-3.5902.3116-5.1367.8497L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3435-4.1021-2.6892-7.5743-6.1185-9.4396"/>
                </svg>
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white" />
            </span>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
            Tải Ứng Dụng Cho Android
          </span>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 tracking-tight">
            Robot Y Tế An - Android
          </h1>
          
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            {redirecting ? (
              <span className="text-emerald-600 font-semibold flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Đang tự động mở Google Play / tải ứng dụng...
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
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all transform active:scale-95"
          >
            <Download className="w-5 h-5 animate-bounce" />
            <span>Bấm Vào Đây Để Tải Xuống Ngay</span>
          </button>

          <p className="text-[11px] text-slate-400">
            Nếu màn hình không tự động chuyển, vui lòng bấm nút xanh ở trên.
          </p>
        </div>

        {/* Options & Fallbacks */}
        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 text-left space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              Các lựa chọn cài đặt Android:
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
              Android 10+
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 text-xs">
            {/* Option 1: Google Play */}
            <a
              href={APP_DOWNLOAD_CONFIG.android.playStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-white hover:bg-emerald-50/50 border border-emerald-100 flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                  ▶
                </span>
                <div>
                  <p className="font-bold text-slate-800 group-hover:text-emerald-600">
                    Google Play Store
                  </p>
                  <p className="text-[10px] text-slate-400">Tải chính thức từ kho ứng dụng Google Play</p>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
            </a>

            {/* Option 2: Direct APK */}
            <a
              href={APP_DOWNLOAD_CONFIG.android.directApkUrl}
              download
              className="p-2.5 rounded-xl bg-white hover:bg-emerald-50/50 border border-emerald-100 flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center text-xs font-bold">
                  APK
                </span>
                <div>
                  <p className="font-bold text-slate-800 group-hover:text-emerald-600">
                    Tải File Cài Đặt Trực Tiếp (APK)
                  </p>
                  <p className="text-[10px] text-slate-400">Cài đặt trực tiếp file .apk cho mọi máy Android</p>
                </div>
              </div>
              <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
            </a>
          </div>

          {/* Quick Chrome PWA tip */}
          <div className="pt-2 border-t border-emerald-200/50 text-[11px] text-slate-500 space-y-1">
            <p className="font-bold text-slate-700 flex items-center gap-1">
              <MoreVertical className="w-3.5 h-3.5 text-emerald-600" />
              Hoặc cài trực tiếp từ trình duyệt Chrome:
            </p>
            <p>
              Bấm menu <strong>3 chấm (⋮)</strong> góc trên phải &rarr; Chọn <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào MH chính"</strong>.
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
