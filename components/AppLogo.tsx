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
      {/* Container Logo kèm hiệu ứng ánh sáng đèn râu kiến */}
      <div className="relative flex items-center justify-center flex-shrink-0">
        {/* Vòng hào quang phát sáng xoay tròn khi Loading (màu cam hổ phách + xanh dương) */}
        {isLoading && (
          <>
            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-amber-400 via-medical-blue to-orange-500 opacity-80 blur-sm animate-spin" />
            <div className="absolute -inset-2.5 rounded-full border-2 border-amber-400/50 border-t-transparent animate-spin" />
          </>
        )}

        {/* Khung Logo bo góc mềm mại */}
        <div
          className={`relative overflow-hidden shadow-md border-2 border-amber-200/60 bg-beige-100 flex items-center justify-center transition-transform ${
            sizeMap[size]
          } ${isLoading ? "animate-pulse scale-105" : "hover:scale-105"}`}
        >
          <img
            src="/logo.jpg"
            alt="Robot y tế - An (Chú Kiến Y Tế FPT)"
            width={imgPxMap[size]}
            height={imgPxMap[size]}
            className="w-full h-full object-cover rounded-inherit"
          />

          {/* Tia sáng quét ngang khi Loading */}
          {isLoading && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
          )}
        </div>
      </div>

      {/* Tên Thương Hiệu Kèm Phụ Đề Kiến Y Tế */}
      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center space-x-1.5 leading-none">
            <span className="text-xs md:text-sm font-black text-navy-900 tracking-tight">
              Robot Y Tế
            </span>
            <span className="px-1.5 py-0.2 rounded-md bg-medical-blue text-white text-[10px] md:text-xs font-black tracking-wide shadow-sm">
              AN
            </span>
            <span className="text-[10px]" title="Cảm hứng từ Kiến Sáng FPT Education">
              🐜
            </span>
          </div>
          <span className="text-[9px] md:text-[10px] text-amber-700 font-bold tracking-wide mt-0.5">
            Chú Kiến Giám Hộ Kép AI
          </span>
        </div>
      )}
    </div>
  );
}
