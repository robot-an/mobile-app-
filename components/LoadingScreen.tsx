"use client";

import React, { useState, useEffect } from "react";
import AppLogo from "./AppLogo";
import { Lightbulb, Sparkles, Heart } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
}

const LOADING_STEPS = [
  "Chú Kiến Y Tế An đang thắp sáng 2 râu anten...",
  "Đang kết nối hệ thống vi điều khiển ESP32...",
  "Đang nạp Sổ Y Bạ & Chỉ số sinh hiệu nền...",
  "Kích hoạt RAG Vector Knowledge Base (text-embedding-004)...",
  "Khởi tạo trí tuệ nhân tạo Gemini 1.5 Pro sẵn sàng!"
];

export default function LoadingScreen({
  message = "Đang tải hệ thống Robot An...",
  subMessage = "Chú Kiến Y Tế Chăm Chỉ • Giám Hộ Kép"
}: LoadingScreenProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 1700);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-beige-100/95 backdrop-blur-md p-6">
      {/* Vòng sáng nền mờ ấm áp */}
      <div className="absolute w-80 h-80 rounded-full bg-amber-400/15 blur-3xl -z-10 animate-pulse" />

      {/* Logo 3D Chú Kiến An với hiệu ứng hào quang xoay */}
      <div className="mb-6 relative">
        <AppLogo size="xl" isLoading={true} />
        
        {/* Bóng đèn anten phát sáng lấp lánh */}
        <div className="absolute -top-1 -right-1 p-1.5 bg-amber-500 text-white rounded-full shadow-lg animate-bounce">
          <Lightbulb className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Tiêu đề ứng dụng */}
      <div className="text-center space-y-1 mb-6">
        <div className="flex items-center justify-center space-x-2">
          <h1 className="text-lg font-black text-navy-900 tracking-tight">
            Robot Y Tế
          </h1>
          <span className="px-2 py-0.5 rounded-lg bg-medical-blue text-white text-xs font-black shadow-sm">
            AN
          </span>
          <span className="text-sm">🐜</span>
        </div>
        <p className="text-xs text-amber-800 font-bold uppercase tracking-wider">
          {subMessage}
        </p>
      </div>

      {/* Sóng nhịp tim ECG Animation có điểm nhấn màu cam ấm */}
      <div className="w-52 h-8 flex items-center justify-center relative my-2 overflow-hidden">
        <svg
          className="w-full h-full text-medical-blue"
          viewBox="0 0 200 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 0 20 L 40 20 L 50 10 L 60 30 L 70 5 L 80 35 L 90 20 L 130 20 L 140 12 L 150 28 L 160 20 L 200 20"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-[dash_1.8s_linear_infinite]"
            strokeDasharray="200"
            strokeDashoffset="200"
          />
        </svg>
      </div>

      {/* Dòng trạng thái chuyển nhịp nhàng */}
      <div className="mt-4 p-3.5 rounded-2xl bg-white/90 border-2 border-amber-200 shadow-sm max-w-xs w-full text-center">
        <p className="text-xs font-bold text-navy-900 transition-all duration-500 animate-fadeIn">
          {LOADING_STEPS[stepIndex]}
        </p>
        <div className="w-full bg-beige-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 via-medical-blue to-orange-500 h-full rounded-full animate-[progress_1.8s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}
