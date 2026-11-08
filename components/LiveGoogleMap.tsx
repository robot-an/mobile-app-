"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  MapPinOff,
  Navigation,
  Layers,
  Maximize2,
  X,
  Plus,
  Minus,
  Compass
} from "lucide-react";

interface LiveGoogleMapProps {
  latitude: number;
  longitude: number;
  hasPosition?: boolean;
  hasSignal?: boolean;
  isOnline?: boolean;
  fallDetected?: boolean;
  height?: string;
}

// Bộ nhớ đệm địa chỉ để tăng tốc tải (0ms latency)
const addressCache: Record<string, string> = {};

// GPS dao động vài mét mỗi lần đo: chỉ dời ghim khi lệch khoảng 20 m, tránh bản đồ tải lại liên tục.
const MIN_MOVE_DEG = 0.0002;

export default function LiveGoogleMap({
  latitude = 21.028511,
  longitude = 105.854167,
  hasPosition = false,
  hasSignal = false,
  isOnline = true,
  fallDetected = false,
  height = "h-full min-h-[200px]"
}: LiveGoogleMapProps) {
  const [currentLat, setCurrentLat] = useState<number>(latitude);
  const [currentLng, setCurrentLng] = useState<number>(longitude);
  const [mapType, setMapType] = useState<"m" | "k">("m"); // m: roadmap, k: satellite
  const [zoom, setZoom] = useState<number>(16);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const [currentAddress, setCurrentAddress] = useState<string>("Đang tìm địa chỉ...");

  // Đồng bộ khi props từ bên ngoài thay đổi
  useEffect(() => {
    setCurrentLat((prev) => (Math.abs(prev - latitude) >= MIN_MOVE_DEG ? latitude : prev));
    setCurrentLng((prev) => (Math.abs(prev - longitude) >= MIN_MOVE_DEG ? longitude : prev));
  }, [latitude, longitude]);

  const coordKey = `${currentLat.toFixed(5)}_${currentLng.toFixed(5)}`;

  // Địa chỉ luôn tính từ tọa độ thật, không dùng địa chỉ mẫu lưu trong dữ liệu
  useEffect(() => {
    if (!hasPosition) return;

    if (addressCache[coordKey]) {
      setCurrentAddress(addressCache[coordKey]);
      return;
    }

    const fetchAddress = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${currentLat}&lon=${currentLng}&format=json&accept-language=vi`
        );
        const data = await res.json();
        if (data && data.display_name) {
          setCurrentAddress(data.display_name);
          addressCache[coordKey] = data.display_name;
        }
      } catch (err) {
        const fallback = `${currentLat.toFixed(5)}, ${currentLng.toFixed(5)} (Việt Nam)`;
        setCurrentAddress(fallback);
        addressCache[coordKey] = fallback;
      }
    };

    fetchAddress();
  }, [currentLat, currentLng, coordKey, hasPosition]);

  // Google Maps Universal Embed URL
  const embedUrl = useMemo(() => {
    return `https://maps.google.com/maps?q=${currentLat},${currentLng}&t=${mapType}&z=${zoom}&hl=vi&ie=UTF8&iwloc=&output=embed`;
  }, [currentLat, currentLng, mapType, zoom]);

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom((prev) => Math.min(prev + 1, 19));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom((prev) => Math.max(prev - 1, 12));
  };

  if (!hasPosition) {
    return (
      <div className={`relative w-full ${height} rounded-2xl border shadow-card bg-slate-100 flex flex-col items-center justify-center text-center p-5 select-none ${
        fallDetected ? "border-red-500 ring-2 ring-red-300" : "border-slate-200"
      }`}>
        <MapPinOff className="w-8 h-8 text-slate-400" />
        <p className="text-sm font-bold text-slate-900 mt-2">Robot chưa bắt được GPS</p>
        <p className="text-xs text-slate-500 mt-1">Đặt robot gần cửa sổ hoặc ngoài trời vài phút để có vị trí.</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${height} rounded-2xl overflow-hidden border transition-all shadow-card bg-slate-100 select-none flex flex-col ${
      fallDetected ? "border-red-500 ring-2 ring-red-300" : "border-slate-200"
    }`}>
      
      {/* 1. Top HUD Controls Tích Hợp Gọn Gàng Trực Tiếp Trên Bản Đồ */}
      <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between pointer-events-none gap-1.5">

        {/* Địa chỉ hiện tại (lấy từ tọa độ GPS cảm biến thật của robot) */}
        <div className="pointer-events-auto flex items-center gap-1 min-w-0 max-w-[75%]">
          <div className="bg-white/95 backdrop-blur-md px-2 py-1 rounded-xl border border-slate-200 shadow-xs min-w-0 flex items-center space-x-1">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
            <p className="text-[10px] font-bold text-slate-900 truncate leading-tight">
              {!hasSignal && <span className="text-amber-700">Vị trí cuối · </span>}
              {currentAddress}
            </p>
          </div>
        </div>

        {/* Action Buttons: 🛰️ Lớp | ⛶ Phóng to */}
        <div className="pointer-events-auto flex items-center space-x-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setMapType(mapType === "m" ? "k" : "m")}
            className="p-1.5 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 text-slate-700 hover:text-medical-blue shadow-xs text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all"
            title="Chuyển lớp Vệ tinh / Đường"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="p-1.5 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 text-slate-700 hover:text-medical-blue shadow-xs active:scale-95 transition-all"
            title="Mở toàn màn hình"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Iframe Google Maps Live Chiếm Trọn Khung */}
      <iframe
        src={embedUrl}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="eager"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        className="w-full h-full flex-1 filter saturate-[1.05]"
        title="Google Maps Live GPS"
      />

      {/* ========================================================================= */}
      {/* 3. MODAL TOÀN MÀN HÌNH CHUẨN RESPONSIVE                                   */}
      {/* ========================================================================= */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col p-3 sm:p-6 animate-fadeIn select-none">
          <div className="w-full max-w-3xl h-full mx-auto bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-slideUp">
            
            {/* Header Modal Toàn Màn Hình */}
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-medical-blue border border-blue-100 flex items-center justify-center flex-shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-900 truncate">
                    Bản Đồ Định Vị Robot An (Toàn Màn Hình)
                  </h3>
                  <p className="text-[10px] text-slate-500 truncate font-mono">
                    Tọa độ: {currentLat.toFixed(5)}, {currentLng.toFixed(5)} • Zoom: {zoom}x
                  </p>
                </div>
              </div>

              {/* Nút Đóng Modal */}
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-600 transition-colors flex items-center gap-1 text-xs font-bold"
                title="Đóng bản đồ"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Khung Bản Đồ Fullscreen */}
            <div className="relative flex-1 w-full bg-slate-100 min-h-0">
              <iframe
                src={embedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="eager"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full filter saturate-[1.05]"
                title="Google Maps Fullscreen"
              />

              {/* Cụm Nút Điều Khiển Nổi Góc Phải */}
              <div className="absolute right-3.5 top-3.5 z-20 flex flex-col space-y-1.5 shadow-md">
                <button
                  onClick={handleZoomIn}
                  className="w-9 h-9 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 text-slate-800 flex items-center justify-center font-bold shadow-xs active:scale-95 transition-transform"
                  title="Phóng to"
                >
                  <Plus className="w-4 h-4" />
                </button>

                <button
                  onClick={handleZoomOut}
                  className="w-9 h-9 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 text-slate-800 flex items-center justify-center font-bold shadow-xs active:scale-95 transition-transform"
                  title="Thu nhỏ"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setMapType(mapType === "m" ? "k" : "m")}
                  className="w-9 h-9 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 text-medical-blue flex items-center justify-center font-bold shadow-xs active:scale-95 transition-transform"
                  title="Đổi kiểu bản đồ Vệ tinh / Đường"
                >
                  <Layers className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Footer Modal Toàn Màn Hình */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between gap-3 flex-shrink-0">
              <div className="flex items-center space-x-1.5 min-w-0">
                <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs text-slate-800 font-medium truncate">
                  {currentAddress}
                </p>
              </div>

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${currentLat},${currentLng}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 bg-medical-blue hover:bg-medical-hover text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 active:scale-95 transition-all flex-shrink-0"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Chỉ đường Google Maps ↗</span>
              </a>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
