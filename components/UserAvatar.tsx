"use client";

import React, { useState } from "react";
import { User, ShieldCheck } from "lucide-react";
import { User as FirebaseUser } from "@/lib/firebase";

interface Props {
  user?: FirebaseUser | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  fallbackName?: string;
  type?: "caregiver" | "patient";
  patientType?: "elderly" | "child";
}

export default function UserAvatar({
  user,
  size = "md",
  className = "",
  fallbackName,
  type = "caregiver",
  patientType = "elderly"
}: Props) {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl"
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;

  // Nếu là Avatar của Người Được Giám Hộ (Bệnh nhân / Cụ ông / Em bé)
  if (type === "patient") {
    const isElderly = patientType === "elderly";
    return (
      <div className={`relative rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm ${currentSizeClass} ${
        isElderly ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-sky-100 text-sky-900 border border-sky-300"
      } ${className}`}>
        <span className="text-lg select-none">
          {isElderly ? "🧓" : "🧒"}
        </span>
      </div>
    );
  }

  // Nếu có ảnh Google Photo URL và chưa bị lỗi tải
  const photoUrl = user?.photoURL;
  if (photoUrl && !imgError) {
    return (
      <div className={`relative rounded-2xl overflow-hidden flex-shrink-0 border-2 border-medical-blue/40 shadow-sm ${currentSizeClass} ${className}`}>
        <img
          src={photoUrl}
          alt={user?.displayName || "User Avatar"}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Tên hiển thị để lấy chữ cái đầu
  const displayName = user?.displayName || fallbackName || user?.email?.split("@")[0] || "Giám Hộ";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className={`relative rounded-2xl bg-gradient-to-tr from-medical-blue to-blue-500 text-white font-black flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm border border-blue-300 ${currentSizeClass} ${className}`}>
      {user ? (
        <span>{initial}</span>
      ) : (
        <User className="w-1/2 h-1/2 text-white opacity-90" />
      )}
    </div>
  );
}
