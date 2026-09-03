"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Heart, 
  Activity, 
  ChevronRight, 
  AlertTriangle,
  RotateCcw,
  Pill
} from "lucide-react";
import { 
  RobotStatus, 
  MedicalRecord, 
  CareSchedule,
  db, 
  doc, 
  onSnapshot, 
  auth, 
  onAuthStateChanged, 
  User as FirebaseUser,
  collection,
  query,
  where
} from "@/lib/firebase";
import UserAvatar from "@/components/UserAvatar";
import LiveGoogleMap from "@/components/LiveGoogleMap";
import EmergencySirenSound from "@/components/EmergencySirenSound";

export default function MobileDashboard() {
  const robotId = "an_robot_01";

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [patientRecord, setPatientRecord] = useState<MedicalRecord | null>(null);
  const [schedules, setSchedules] = useState<CareSchedule[]>([]);
  const [completedSchedules, setCompletedSchedules] = useState<string[]>(["sch_01"]);

  const [status, setStatus] = useState<RobotStatus>({
    robot_id: robotId,
    battery: 88,
    latitude: 21.028511,
    longitude: 105.854167,
    address: "79 Phố Đinh Tiên Hoàng, Phường Hoàn Kiếm, Hà Nội, Việt Nam",
    is_online: true,
    fall_detected: false,
    mode: "companion",
    heart_rate: 74,
    body_temp: 36.6,
    fall_risk_score: 12,
    sos_alert: false
  });

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    try {
      const unsubPatient = onSnapshot(doc(db, "medical_records", robotId), (snap) => {
        if (snap.exists()) {
          setPatientRecord(snap.data() as MedicalRecord);
        }
      });
      return () => unsubPatient();
    } catch (e) {}
  }, [robotId]);

  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, "status", robotId), (docSnap) => {
        if (docSnap.exists()) {
          setStatus((prev) => ({ ...prev, ...(docSnap.data() as RobotStatus) }));
        }
      });
      return () => unsub();
    } catch (e) {}
  }, [robotId]);

  // Lắng nghe lịch nhắc hôm nay
  useEffect(() => {
    try {
      const q = query(
        collection(db, "care_schedules"),
        where("robot_id", "==", robotId),
        where("is_active", "==", true)
      );
      const unsub = onSnapshot(q, (snapshot) => {
        const list: CareSchedule[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as CareSchedule);
        });
        if (list.length > 0) setSchedules(list);
      });
      return () => unsub();
    } catch (e) {}
  }, [robotId]);

  const handleResetSOS = async () => {
    setStatus((prev) => ({ ...prev, fall_detected: false, sos_alert: false }));
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      await fetch(`${backendUrl}/api/reset-sos?robot_id=${robotId}`, { method: "POST" });
    } catch (err) {}
  };

  const isCritical = Boolean(status.fall_detected || status.sos_alert);

  return (
    <div className="flex-1 flex flex-col p-3 pb-20 overflow-hidden space-y-2.5 select-none h-full">
      {/* Còi báo động ngã */}
      <EmergencySirenSound isActive={isCritical} />

      {/* 1. BANNER KHẨN CẤP (NẾU CÓ SỰ CỐ TÉ NGÃ) */}
      {isCritical && (
        <div className="p-3 rounded-2xl bg-red-600 text-white shadow-md flex items-center justify-between animate-bounce flex-shrink-0">
          <div className="flex items-center space-x-2 min-w-0">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-white" />
            <p className="text-xs font-bold truncate">Phát hiện sự cố ngã khẩn cấp!</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <a href="tel:115" className="px-2.5 py-1 bg-white text-red-600 text-xs font-bold rounded-lg shadow-xs">
              115
            </a>
            <button onClick={handleResetSOS} className="p-1 bg-red-800 text-white rounded-lg text-xs">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. KHỐI BẢN ĐỒ GOOGLE MAPS TỰ ĐỘNG MỞ RỘNG LẤP ĐẦY KHÔNG GIAN (Zero Gap) */}
      <div className="flex-1 w-full min-h-[220px] flex flex-col">
        <LiveGoogleMap
          latitude={status.latitude}
          longitude={status.longitude}
          address={status.address}
          robotId={status.robot_id}
          isOnline={status.is_online}
          fallDetected={isCritical}
          height="h-full min-h-[220px]"
        />
      </div>

      {/* 3. THẺ BÁC SĨ KỸ THUẬT SỐ & SINH HIỆU (Digital Doctor Card) */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-card space-y-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <UserAvatar
              type="patient"
              patientType={patientRecord?.target_type || "elderly"}
              size="sm"
              className="!rounded-lg w-8 h-8 flex-shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold text-slate-900 truncate">
                  {patientRecord?.full_name || "NGUYỄN HOÀNG HIỆP"}
                </h3>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-medical-blue font-bold flex-shrink-0">
                  {patientRecord?.age || 29} tuổi
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium truncate">
                Nhóm máu: <span className="font-bold text-slate-700">{patientRecord?.blood_type || "A+"}</span> • Mỡ máu & Cột sống cổ
              </p>
            </div>
          </div>

          <Link
            href="/medical-record"
            className="p-1 text-slate-400 hover:text-medical-blue transition-colors flex-shrink-0"
            title="Xem sổ y bạ"
          >
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 2 Ô Sinh Hiệu Gọn Gàng: Nhịp tim & Huyết áp */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[9px] text-slate-500 font-medium">Nhịp tim</span>
              <p className="text-sm font-extrabold text-slate-900 leading-none mt-0.5">
                {status.heart_rate || patientRecord?.baseline_biometrics?.heart_rate_bpm || 82} <span className="text-[9px] font-normal text-slate-400">BPM</span>
              </p>
            </div>
            <div className="p-1.5 rounded-lg bg-red-50 text-red-500">
              <Heart className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[9px] text-slate-500 font-medium">Huyết áp</span>
              <p className="text-sm font-extrabold text-slate-900 leading-none mt-0.5">
                {patientRecord?.baseline_biometrics?.blood_pressure_systolic || 120}/{patientRecord?.baseline_biometrics?.blood_pressure_diastolic || 70} <span className="text-[9px] font-normal text-slate-400">mmHg</span>
              </p>
            </div>
            <div className="p-1.5 rounded-lg bg-blue-50 text-medical-blue">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. THANH NHẮC LỊCH THUỐC CỬ KẾ TIẾP (Compact Schedule Pill) */}
      <Link
        href="/schedules"
        className="bg-white rounded-2xl p-2.5 px-3 border border-slate-200 shadow-card hover:border-slate-300 transition-all flex items-center justify-between flex-shrink-0 active:scale-[0.99]"
      >
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-medical-blue border border-blue-100 flex items-center justify-center font-bold flex-shrink-0">
            <Pill className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">
              Cữ kế tiếp: <span className="text-medical-blue">20:00 - Atorvastatin 20mg</span>
            </p>
            <p className="text-[10px] text-slate-500 font-medium truncate">
              Hôm nay: {completedSchedules.length}/{schedules.length || 3} cữ đã hoàn thành
            </p>
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
      </Link>

    </div>
  );
}
