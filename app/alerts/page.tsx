"use client";

import React, { useState, useEffect } from "react";
import { 
  Bell, 
  AlertTriangle, 
  RotateCcw,
  Clock,
  ShieldCheck,
  Filter,
  CheckCircle2
} from "lucide-react";
import { AlertLog, db, collection, query, orderBy, limit, onSnapshot } from "@/lib/firebase";

export default function MobileAlertsPage() {
  const robotId = "an_robot_01";
  const [logs, setLogs] = useState<AlertLog[]>([]);
  const [filter, setFilter] = useState<"ALL" | "CRITICAL" | "INFO">("ALL");
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    try {
      const q = query(
        collection(db, "logs"),
        orderBy("timestamp", "desc"),
        limit(30)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedLogs: AlertLog[] = [];
        snapshot.forEach((doc) => {
          fetchedLogs.push({ id: doc.id, ...doc.data() } as AlertLog);
        });
        setLogs(fetchedLogs);
      });

      return () => unsubscribe();
    } catch (err) {}
  }, [robotId]);

  // Polling fallback
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const res = await fetch(`${backendUrl}/api/logs?robot_id=${robotId}`);
        const data = await res.json();
        if (data.success && data.data) {
          setLogs(data.data);
        }
      } catch (e) {}
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 4000);
    return () => clearInterval(interval);
  }, [robotId]);

  const handleResetSOS = async () => {
    setResetting(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      await fetch(`${backendUrl}/api/reset-sos?robot_id=${robotId}`, { method: "POST" });
    } catch (err) {} finally {
      setResetting(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === "CRITICAL") return log.severity === "CRITICAL";
    if (filter === "INFO") return log.severity === "INFO" || log.severity === "WARNING";
    return true;
  });

  const formatTime = (isoString?: string) => {
    if (!isoString) return "Vừa xong";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) + 
             " (" + d.toLocaleDateString("vi-VN") + ")";
    } catch {
      return isoString;
    }
  };

  const getEventTypeName = (rawType: string) => {
    switch (rawType) {
      case "FALL_DETECTED":
        return "Phát hiện té ngã";
      case "SYSTEM_START":
        return "Robot khởi động";
      case "VOICE_EMERGENCY":
        return "Cảnh báo giọng nói";
      case "DATABASE_SEEDED":
        return "Đồng bộ dữ liệu";
      case "MODE_CHANGED":
        return "Đổi chế độ hoạt động";
      default:
        return "Thông báo an toàn";
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-3 select-none">

      {/* Bộ Lọc Filter */}
      <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
        <button
          onClick={() => setFilter("ALL")}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
            filter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Tất cả ({logs.length})
        </button>
        <button
          onClick={() => setFilter("CRITICAL")}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
            filter === "CRITICAL" ? "bg-white text-red-700 shadow-xs" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          🚨 Nguy hiểm
        </button>
        <button
          onClick={() => setFilter("INFO")}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
            filter === "INFO" ? "bg-white text-medical-blue shadow-xs" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          ℹ️ Thông tin
        </button>
      </div>

      {/* Danh Sách Log Sự Kiện */}
      <div className="space-y-2">
        {filteredLogs.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center text-slate-400 space-y-1.5">
            <ShieldCheck className="w-8 h-8 mx-auto text-emerald-500 opacity-60" />
            <p className="text-xs font-bold text-slate-800">Mọi thứ đều an toàn</p>
            <p className="text-[11px] text-slate-500">Chưa ghi nhận sự cố bất thường nào gần đây.</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isCrit = log.severity === "CRITICAL";
            return (
              <div
                key={log.id || Math.random().toString()}
                className={`p-3.5 rounded-2xl border transition-all shadow-card ${
                  isCrit
                    ? "bg-red-50/70 border-red-200"
                    : log.severity === "WARNING"
                    ? "bg-amber-50/70 border-amber-200"
                    : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center space-x-1.5">
                    {isCrit ? (
                      <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[9px] font-bold uppercase flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Nguy hiểm
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 text-medical-blue text-[9px] font-bold uppercase">
                        Thông tin
                      </span>
                    )}
                    <span className="text-xs font-bold text-slate-900">
                      {getEventTypeName(log.event_type)}
                    </span>
                  </div>

                  <span className="text-[10px] font-medium text-slate-400">
                    {formatTime(log.timestamp)}
                  </span>
                </div>

                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  {log.message}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
