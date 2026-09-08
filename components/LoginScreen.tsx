"use client";

import React, { useState } from "react";
import AppLogo from "@/components/AppLogo";
import { auth, googleProvider, signInWithPopup } from "@/lib/firebase";
import { ShieldCheck, HeartHandshake, MapPin } from "lucide-react";

export default function LoginScreen() {
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Lỗi đăng nhập Google:", err);
      setError(err?.message || "Đăng nhập thất bại, vui lòng thử lại.");
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-orange-50 via-white to-blue-50 select-none overflow-y-auto">
      <div className="absolute w-72 h-72 rounded-full bg-orange-400/10 blur-3xl -z-10" />

      <AppLogo size="2xl" />

      <div className="text-center mt-5 mb-7 space-y-1.5">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-xl font-black text-navy-900 tracking-tight">Robot Y Tế</h1>
          <span className="px-2 py-0.5 rounded-lg bg-medical-blue text-white text-xs font-black shadow-sm">AN</span>
        </div>
        <p className="text-xs text-slate-500 font-medium max-w-[240px]">
          Đăng nhập để thiết lập & giám sát người thân của bạn
        </p>
      </div>

      <div className="w-full max-w-xs space-y-2.5 mb-7">
        <div className="flex items-center gap-2.5 p-2.5 bg-white/80 rounded-xl border border-slate-200 text-left">
          <div className="p-1.5 rounded-lg bg-blue-50 text-medical-blue flex-shrink-0">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <p className="text-[11px] font-semibold text-slate-700">Định vị & theo dõi an toàn thời gian thực</p>
        </div>
        <div className="flex items-center gap-2.5 p-2.5 bg-white/80 rounded-xl border border-slate-200 text-left">
          <div className="p-1.5 rounded-lg bg-red-50 text-red-500 flex-shrink-0">
            <HeartHandshake className="w-3.5 h-3.5" />
          </div>
          <p className="text-[11px] font-semibold text-slate-700">Sổ y bạ, nhắc thuốc & cảnh báo khẩn cấp</p>
        </div>
        <div className="flex items-center gap-2.5 p-2.5 bg-white/80 rounded-xl border border-slate-200 text-left">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 flex-shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <p className="text-[11px] font-semibold text-slate-700">Dữ liệu riêng tư, chỉ người giám hộ mới xem được</p>
        </div>
      </div>

      {error && (
        <div className="w-full max-w-xs mb-3 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-[11px] font-semibold text-center">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={signingIn}
        className="w-full max-w-xs inline-flex items-center justify-center space-x-2.5 px-4 py-3 rounded-2xl bg-white hover:bg-orange-50 border-2 border-slate-200 text-navy-900 font-bold text-sm shadow-md transition-all hover:border-medical-blue active:scale-95 disabled:opacity-60"
      >
        {signingIn ? (
          <span>Đang đăng nhập...</span>
        ) : (
          <>
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Đăng nhập bằng Google</span>
          </>
        )}
      </button>

      <a
        href="/landing"
        className="mt-6 text-xs text-slate-500 hover:text-navy-900 font-semibold inline-flex items-center gap-1.5 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100"
      >
        <span>Tìm hiểu về Robot An & Quét mã QR tải App</span>
        <span className="text-medical-blue">→</span>
      </a>
    </div>
  );
}
