"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Settings, 
  User, 
  Volume2, 
  ShieldAlert, 
  Save, 
  CheckCircle,
  LogOut,
  LogIn,
  HeartHandshake,
  Sparkles,
  Phone,
  Sliders,
  Cloud,
  Check,
  RefreshCw
} from "lucide-react";
import { 
  auth, 
  onAuthStateChanged, 
  User as FirebaseUser, 
  signOut, 
  signInWithPopup, 
  googleProvider,
  MedicalRecord,
  db,
  doc,
  onSnapshot,
  setDoc,
  getDoc
} from "@/lib/firebase";
import UserAvatar from "@/components/UserAvatar";

export default function MobileSettingsPage() {
  const robotId = "an_robot_01";

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [mode, setMode] = useState<"companion" | "speech_learning">("companion");
  const [volume, setVolume] = useState<number>(85);
  const [voiceGender, setVoiceGender] = useState<"female" | "male">("female");
  const [speechSpeed, setSpeechSpeed] = useState<"slow" | "normal">("normal");
  const [autoSpeak, setAutoSpeak] = useState<boolean>(true);
  const [autoSos, setAutoSos] = useState<boolean>(true);
  const [fallSensitivity, setFallSensitivity] = useState<"low" | "medium" | "high">("medium");
  const [emergencyPhone, setEmergencyPhone] = useState<string>("0912.345.678");

  const [syncStatus, setSyncStatus] = useState<"synced" | "saving" | "idle">("synced");
  const isInitialLoad = useRef(true);
  const autosaveTimerRef = useRef<any>(null);

  // 1. Theo dõi trạng thái tài khoản
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubAuth();
  }, []);

  // 2. Tải và Lắng Nghe Toàn Bộ Cài Đặt Thời Gian Thực Từ Cloud Firestore
  useEffect(() => {
    // Khôi phục nhanh từ LocalStorage trong khi chờ Firestore
    try {
      const cached = localStorage.getItem(`robot_config_${robotId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.mode) setMode(parsed.mode);
        if (parsed.volume !== undefined) setVolume(parsed.volume);
        if (parsed.voice_gender) setVoiceGender(parsed.voice_gender);
        if (parsed.speech_speed) setSpeechSpeed(parsed.speech_speed);
        if (parsed.auto_speak !== undefined) setAutoSpeak(parsed.auto_speak);
        if (parsed.auto_sos !== undefined) setAutoSos(parsed.auto_sos);
        if (parsed.fall_sensitivity) setFallSensitivity(parsed.fall_sensitivity);
        if (parsed.emergency_phone) setEmergencyPhone(parsed.emergency_phone);
      }
    } catch (e) {}

    // Lắng nghe config collection
    const unsubConfig = onSnapshot(doc(db, "config", robotId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.mode) setMode(data.mode);
        if (data.volume !== undefined) setVolume(data.volume);
        if (data.voice_gender) setVoiceGender(data.voice_gender);
        if (data.speech_speed) setSpeechSpeed(data.speech_speed);
        if (data.auto_speak !== undefined) setAutoSpeak(data.auto_speak);
        if (data.auto_sos !== undefined) setAutoSos(data.auto_sos);
        if (data.fall_sensitivity) setFallSensitivity(data.fall_sensitivity);
      }
      setTimeout(() => {
        isInitialLoad.current = false;
      }, 500);
    });

    // Lắng nghe mode từ status
    const unsubStatus = onSnapshot(doc(db, "status", robotId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.mode) setMode(data.mode);
      }
    });

    // Lắng nghe sđt khẩn cấp từ medical_records
    const unsubPatient = onSnapshot(doc(db, "medical_records", robotId), (snap) => {
      if (snap.exists()) {
        const rec = snap.data() as MedicalRecord;
        if (rec.emergency_contact) {
          setEmergencyPhone(rec.emergency_contact);
        }
      }
    });

    return () => {
      unsubConfig();
      unsubStatus();
      unsubPatient();
    };
  }, [robotId]);

  // 3. Tự Động Lưu Lên Firebase Ngay Khi Thay Đổi (Auto-Save on Change)
  const triggerAutoSave = (newValues: {
    mode?: "companion" | "speech_learning";
    volume?: number;
    voiceGender?: "female" | "male";
    speechSpeed?: "slow" | "normal";
    autoSpeak?: boolean;
    autoSos?: boolean;
    fallSensitivity?: "low" | "medium" | "high";
    emergencyPhone?: string;
  }) => {
    if (isInitialLoad.current) return;

    const payload = {
      mode: newValues.mode ?? mode,
      volume: newValues.volume ?? volume,
      voice_gender: newValues.voiceGender ?? voiceGender,
      speech_speed: newValues.speechSpeed ?? speechSpeed,
      auto_speak: newValues.autoSpeak ?? autoSpeak,
      auto_sos: newValues.autoSos ?? autoSos,
      fall_sensitivity: newValues.fallSensitivity ?? fallSensitivity,
      emergency_phone: newValues.emergencyPhone ?? emergencyPhone
    };

    // Lưu ngay vào localStorage
    try {
      localStorage.setItem(`robot_config_${robotId}`, JSON.stringify(payload));
    } catch (e) {}

    setSyncStatus("saving");

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(async () => {
      try {
        // Lưu Firestore config
        await setDoc(doc(db, "config", robotId), {
          mode: payload.mode,
          volume: payload.volume,
          voice_gender: payload.voice_gender,
          speech_speed: payload.speech_speed,
          auto_speak: payload.auto_speak,
          auto_sos: payload.auto_sos,
          fall_sensitivity: payload.fall_sensitivity,
          updated_at: new Date().toISOString()
        }, { merge: true });

        // Lưu Firestore status
        await setDoc(doc(db, "status", robotId), {
          mode: payload.mode
        }, { merge: true });

        // Lưu Firestore SĐT khẩn cấp
        if (payload.emergency_phone) {
          await setDoc(doc(db, "medical_records", robotId), {
            emergency_contact: payload.emergency_phone
          }, { merge: true });
        }

        // Gửi Backend API
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        await fetch(`${backendUrl}/api/config?robot_id=${robotId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: payload.mode,
            volume: payload.volume,
            voice_gender: payload.voice_gender,
            auto_sos: payload.auto_sos
          })
        });

        setSyncStatus("synced");
      } catch (err) {
        setSyncStatus("synced");
      }
    }, 450);
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Lỗi đăng nhập Google:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-3 select-none">

      {/* 2. CÀI ĐẶT 1: CHẾ ĐỘ HOẠT ĐỘNG (Tự động lưu) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-card space-y-3">
        <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
          <HeartHandshake className="w-4 h-4 text-medical-blue" />
          <span>Chế Độ Chăm Sóc Của Robot</span>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setMode("companion");
              triggerAutoSave({ mode: "companion" });
            }}
            className={`p-3 rounded-xl border text-left transition-all ${
              mode === "companion"
                ? "bg-blue-50/70 border-medical-blue ring-1 ring-medical-blue"
                : "bg-slate-50 border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-base">🧓</span>
              {mode === "companion" && <span className="w-2 h-2 rounded-full bg-medical-blue" />}
            </div>
            <p className="text-xs font-bold text-slate-900">Đồng Hành</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Người cao tuổi</p>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("speech_learning");
              triggerAutoSave({ mode: "speech_learning" });
            }}
            className={`p-3 rounded-xl border text-left transition-all ${
              mode === "speech_learning"
                ? "bg-amber-50/70 border-amber-500 ring-1 ring-amber-500"
                : "bg-slate-50 border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-base">🧒</span>
              {mode === "speech_learning" && <span className="w-2 h-2 rounded-full bg-amber-600" />}
            </div>
            <p className="text-xs font-bold text-slate-900">Học Nói</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Trẻ em 2-5 tuổi</p>
          </button>
        </div>
      </div>

      {/* 3. CÀI ĐẶT 2: ÂM LƯỢNG & GIỌNG NÓI AI (Tự động lưu) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-card space-y-3.5">
        <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
          <Volume2 className="w-4 h-4 text-medical-blue" />
          <span>Âm Lượng & Giọng Nói AI</span>
        </label>

        {/* Thanh trượt âm lượng */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span>Âm lượng loa:</span>
            <span className="text-medical-blue font-mono font-bold">{volume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setVolume(val);
              triggerAutoSave({ volume: val });
            }}
            className="w-full accent-medical-blue h-1.5 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>

        {/* Tùy chọn giọng đọc & Tốc độ */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-1">
              Giọng Đọc AI
            </label>
            <select
              value={voiceGender}
              onChange={(e: any) => {
                const val = e.target.value;
                setVoiceGender(val);
                triggerAutoSave({ voiceGender: val });
              }}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:border-medical-blue"
            >
              <option value="female">Giọng Nữ (Ấm áp)</option>
              <option value="male">Giọng Nam (Dứt khoát)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-1">
              Tốc Độ Phát Âm
            </label>
            <select
              value={speechSpeed}
              onChange={(e: any) => {
                const val = e.target.value;
                setSpeechSpeed(val);
                triggerAutoSave({ speechSpeed: val });
              }}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:border-medical-blue"
            >
              <option value="normal">Chuẩn (Tự nhiên)</option>
              <option value="slow">Chậm (Cho người già)</option>
            </select>
          </div>
        </div>

        {/* Toggle Tự động đọc câu trả lời */}
        <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <p className="text-xs font-bold text-slate-900">Tự động đọc to câu trả lời</p>
            <p className="text-[10px] text-slate-500">Phát giọng nói ngay khi AI trả lời</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-2 flex-shrink-0">
            <input
              type="checkbox"
              checked={autoSpeak}
              onChange={(e) => {
                const val = e.target.checked;
                setAutoSpeak(val);
                triggerAutoSave({ autoSpeak: val });
              }}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-medical-blue"></div>
          </label>
        </div>
      </div>

      {/* 4. CÀI ĐẶT 3: CẢNH BÁO AN TOÀN & SOS (Tự động lưu) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-card space-y-3">
        <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-red-500" />
          <span>Báo Động & An Toàn Khẩn Cấp</span>
        </label>

        {/* Toggle Tự động hú còi */}
        <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <p className="text-xs font-bold text-slate-900">Tự động hú còi khi ngã</p>
            <p className="text-[10px] text-slate-500">Báo động to để gọi người trợ giúp</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-2 flex-shrink-0">
            <input
              type="checkbox"
              checked={autoSos}
              onChange={(e) => {
                const val = e.target.checked;
                setAutoSos(val);
                triggerAutoSave({ autoSos: val });
              }}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-medical-blue"></div>
          </label>
        </div>

        {/* Độ nhạy cảm biến ngã */}
        <div>
          <label className="block text-[10px] font-bold text-slate-600 mb-1">
            Độ Nhạy Cảm Biến Té Ngã
          </label>
          <select
            value={fallSensitivity}
            onChange={(e: any) => {
              const val = e.target.value;
              setFallSensitivity(val);
              triggerAutoSave({ fallSensitivity: val });
            }}
            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:border-medical-blue"
          >
            <option value="high">Cao (Cảnh báo cả va chạm nhẹ)</option>
            <option value="medium">Tiêu chuẩn (Khuyên dùng)</option>
            <option value="low">Thấp (Chỉ ngã lực mạnh)</option>
          </select>
        </div>

        {/* Số điện thoại SOS */}
        <div>
          <label className="block text-[10px] font-bold text-slate-600 mb-1 flex items-center gap-1">
            <Phone className="w-3 h-3 text-emerald-600" />
            Số Điện Thoại Khẩn Cấp Nhận Cuộc Gọi / SMS
          </label>
          <input
            type="text"
            value={emergencyPhone}
            onChange={(e) => {
              const val = e.target.value;
              setEmergencyPhone(val);
              triggerAutoSave({ emergencyPhone: val });
            }}
            placeholder="0912.345.678"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:border-medical-blue"
          />
        </div>
      </div>

      {/* 5. CÀI ĐẶT 4: TÀI KHOẢN NGƯỜI DÙNG */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-card space-y-2.5">
        <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
          <User className="w-4 h-4 text-medical-blue" />
          <span>Tài Khoản Liên Kết</span>
        </label>

        {user ? (
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-2 min-w-0">
              <UserAvatar user={user} size="sm" className="!rounded-lg" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user.displayName || "Người Giám Hộ"}
                </p>
                <p className="text-[10px] text-slate-500 truncate font-mono">
                  {user.email}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="p-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg font-bold flex items-center gap-1 flex-shrink-0 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border border-slate-200 transition-colors"
          >
            <LogIn className="w-4 h-4 text-medical-blue" />
            <span>Đăng Nhập Bằng Google</span>
          </button>
        )}
      </div>

    </div>
  );
}
