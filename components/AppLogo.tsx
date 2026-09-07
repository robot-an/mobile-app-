"use client";

import React from "react";

interface AppLogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  showText?: boolean;
  isLoading?: boolean;
  className?: string;
}

export default function AppLogo({
  size = "md",
  showText = false,
  isLoading = false,
  className = ""
}: AppLogoProps) {
  const sizeMap = {
    sm: "w-8 h-8 rounded-xl",
    md: "w-10 h-10 rounded-2xl",
    lg: "w-14 h-14 rounded-2xl",
    xl: "w-20 h-20 rounded-3xl",
    "2xl": "w-28 h-28 rounded-3xl"
  };

  const imgPxMap = {
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
    "2xl": 112
  };

  return (
    <div className={`inline-flex items-center space-x-2.5 ${className}`}>
      {/* Container Logo kèm hiệu ứng hào quang khi Loading */}
      <div className="relative flex items-center justify-center flex-shrink-0">
        {/* Vòng hào quang phát sáng xoay tròn khi Loading (cam - xanh lá - navy, theo 3 màu logo) */}
        {isLoading && (
          <>
            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-orange-500 via-emerald-400 to-blue-600 opacity-80 blur-sm animate-spin" />
            <div className="absolute -inset-2.5 rounded-full border-2 border-orange-400/50 border-t-transparent animate-spin" />
          </>
        )}

        {/* Khung Logo bo góc mềm mại */}
        <div
          className={`relative overflow-hidden shadow-md border-2 border-slate-200 bg-white flex items-center justify-center transition-transform ${
            sizeMap[size]
          } ${isLoading ? "animate-pulse scale-105" : "hover:scale-105"}`}
        >
          <img
            src="/logo-an-mark.svg"
            alt="Robot An"
            width={imgPxMap[size]}
            height={imgPxMap[size]}
            className="w-[80%] h-[80%] object-contain rounded-inherit"
          />

          {/* Tia sáng quét ngang khi Loading */}
          {isLoading && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
          )}
        </div>
      </div>

      {/* Tên Thương Hiệu Kèm Phụ Đề */}
      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center space-x-1.5 leading-none">
            <span className="text-xs md:text-sm font-black text-navy-900 tracking-tight">
              Robot Y Tế
            </span>
            <span className="px-1.5 py-0.2 rounded-md bg-medical-blue text-white text-[10px] md:text-xs font-black tracking-wide shadow-sm">
              AN
            </span>
          </div>
          <span className="text-[9px] md:text-[10px] text-orange-700 font-bold tracking-wide mt-0.5">
            Giám Hộ Kép AI
          </span>
        </div>
      )}
    </div>
  );
}
