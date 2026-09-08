"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  User as UserIcon,
  Droplets,
  Heart,
  ShieldAlert,
  Activity,
  Phone,
  Building,
  AlertTriangle,
  Loader2,
  PartyPopper,
  ClipboardList,
  Link2,
  FileCheck2
} from "lucide-react";
import {
  db,
  doc,
  setDoc,
  collection,
  addDoc,
  MedicalRecord,
  LabTestResult,
  User as FirebaseUser
} from "@/lib/firebase";
import AppLogo from "@/components/AppLogo";
import ImportLabLinkModal, { ParsedLabImport } from "@/components/ImportLabLinkModal";

function mapLabResultsToBiometrics(results: ParsedLabImport["results"]) {
  const biometrics: Record<string, number> = {};
  const patterns: Array<[RegExp, string]> = [
    [/cholesterol.*(toàn phần|total)/i, "cholesterol_total"],
    [/ldl/i, "cholesterol_ldl"],
    [/(glucose|đường huyết)/i, "blood_glucose_mmol"],
    [/(nhịp tim|heart rate)/i, "heart_rate_bpm"],
    [/spo2|sp02|bão hòa oxy/i, "spo2_percent"]
  ];
  for (const r of results || []) {
    for (const [pattern, field] of patterns) {
      if (pattern.test(r.name || "")) {
        const num = parseFloat((r.value || "").replace(",", "."));
        if (!isNaN(num)) biometrics[field] = num;
      }
    }
  }
  return biometrics;
}

interface SetupWizardProps {
  robotId: string;
  user: FirebaseUser;
  onComplete: () => void;
}

const STEP_LABELS = ["Chào mừng", "Cá nhân", "Bệnh lý", "Sinh hiệu", "Liên hệ", "Xác nhận"];

export default function SetupWizard({ robotId, user, onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [pendingLabImport, setPendingLabImport] = useState<ParsedLabImport | null>(null);

  const [formData, setFormData] = useState<Partial<MedicalRecord>>({
    robot_id: robotId,
    target_type: "elderly",
    full_name: "",
    age: 0,
    gender: "male",
    blood_type: "A+",
    medical_history: "",
    allergies: "",
    chronic_conditions: [],
    emergency_contact: "",
    baseline_biometrics: {
      blood_pressure_systolic: 120,
      blood_pressure_diastolic: 80,
      heart_rate_bpm: 75,
      spo2_percent: 98
    },
    primary_doctor: { name: "", hospital: "", phone: "", specialty: "" },
    notes: ""
  });

  const updateField = (field: keyof MedicalRecord, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateBiometric = (field: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      baseline_biometrics: { ...(prev.baseline_biometrics as any), [field]: value }
    }));
  };

  const updateDoctor = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      primary_doctor: {
        name: "",
        hospital: "",
        phone: "",
        specialty: "",
        ...(prev.primary_doctor as any),
        [field]: value
      }
    }));
  };

  const handleImported = (parsed: ParsedLabImport) => {
    const currentYear = new Date().getFullYear();
    const mappedBiometrics = mapLabResultsToBiometrics(parsed.results);

    setFormData((prev) => ({
      ...prev,
      full_name: parsed.full_name || prev.full_name,
      gender: parsed.gender || prev.gender,
      age: parsed.birth_year ? currentYear - parsed.birth_year : prev.age,
      phone: parsed.phone || prev.phone,
      diagnosis: parsed.diagnosis || prev.diagnosis,
      health_classification: parsed.health_classification || prev.health_classification,
      medical_history: prev.medical_history || parsed.diagnosis || "",
      notes: parsed.recommendations || prev.notes,
      primary_doctor: {
        name: parsed.ordering_doctor || prev.primary_doctor?.name || "",
        hospital: parsed.facility || prev.primary_doctor?.hospital || "",
        phone: prev.primary_doctor?.phone || "",
        specialty: prev.primary_doctor?.specialty || ""
      },
      baseline_biometrics: {
        ...(prev.baseline_biometrics as any),
        ...mappedBiometrics
      }
    }));

    setPendingLabImport(parsed);
    setShowImportModal(false);
    setStep(5);
  };

  const isPersonalValid = (formData.full_name || "").trim().length > 0 && (formData.age || 0) > 0;
  const isContactValid = (formData.emergency_contact || "").trim().length > 0;

  const canGoNext = () => {
    if (step === 1) return isPersonalValid;
    if (step === 4) return isContactValid;
    return true;
  };

  const handleNext = () => {
    if (!canGoNext()) return;
    setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleFinish = async () => {
    if (!isPersonalValid || !isContactValid) return;
    setSaving(true);
    setError(null);

    try {
      const payload: MedicalRecord = {
        ...(formData as MedicalRecord),
        robot_id: robotId,
        owner_uid: user.uid,
        setup_completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await setDoc(doc(db, "medical_records", robotId), payload, { merge: true });

      if (pendingLabImport) {
        const importPayload = {
          source: "medlatec",
          test_code: pendingLabImport.test_code || null,
          test_date: pendingLabImport.test_date || null,
          facility: pendingLabImport.facility || null,
          ordering_doctor: pendingLabImport.ordering_doctor || null,
          status: pendingLabImport.status || null,
          diagnosis: pendingLabImport.diagnosis || null,
          health_classification: pendingLabImport.health_classification || null,
          recommendations: pendingLabImport.recommendations || null,
          results: pendingLabImport.results || [],
          imported_at: new Date().toISOString(),
          imported_by: user.uid
        };
        await addDoc(collection(db, "medical_records", robotId, "lab_imports"), importPayload).catch((err) =>
          console.warn("Lưu lịch sử phiếu xét nghiệm thất bại:", err)
        );
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://robot-an-backend.onrender.com";
      await fetch(`${backendUrl}/api/medical-records?robot_id=${robotId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).catch((err) => console.warn("Backend sync note:", err));

      onComplete();
    } catch (err: any) {
      console.error("Lỗi lưu thiết lập ban đầu:", err);
      setError(
        err?.code === "permission-denied"
          ? "Không có quyền ghi Firestore (permission-denied) - dữ liệu CHƯA được lưu lên Cloud."
          : `Lưu thất bại: ${err?.message || "Lỗi không xác định"}`
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-50 select-none">
      {/* Thanh tiến trình (ẩn ở màn hình chào mừng) */}
      {step > 0 && (
        <div className="flex-shrink-0 px-4 pt-4 pb-2 bg-white border-b border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Bước {step}/{STEP_LABELS.length - 1}
            </span>
            <span className="text-[10px] font-bold text-medical-blue">{STEP_LABELS[step]}</span>
          </div>
          <div className="flex gap-1">
            {STEP_LABELS.slice(1).map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  idx + 1 <= step ? "bg-medical-blue" : "bg-slate-200"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 pb-4">
        {/* BƯỚC 0: CHÀO MỪNG */}
        {step === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-5 py-6">
            <AppLogo size="xl" />
            <div className="space-y-2">
              <h2 className="text-lg font-black text-navy-900">Chào mừng, {user.displayName?.split(" ").pop() || "Người giám hộ"}!</h2>
              <p className="text-xs text-slate-500 font-medium max-w-[260px] mx-auto leading-relaxed">
                Trước khi sử dụng, hãy dành ~2 phút thiết lập Sổ Y Bạ cho người thân để Robot An
                theo dõi sức khỏe và cảnh báo chính xác.
              </p>
            </div>
            <div className="w-full max-w-[260px] p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center gap-2.5 text-left">
              <ClipboardList className="w-4 h-4 text-medical-blue flex-shrink-0" />
              <p className="text-[11px] font-semibold text-slate-700">
                Thông tin cá nhân → Bệnh lý → Sinh hiệu → Liên hệ khẩn cấp
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-medical-blue hover:text-medical-hover underline underline-offset-2"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Hoặc dán link phiếu xét nghiệm để điền tự động</span>
            </button>
          </div>
        )}

        {/* BƯỚC 1: CÁ NHÂN */}
        {step === 1 && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Đối Tượng</label>
                <select
                  value={formData.target_type}
                  onChange={(e) => updateField("target_type", e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 text-xs focus:border-medical-blue focus:ring-0"
                >
                  <option value="elderly">🧓 Người lớn / Cụ</option>
                  <option value="child">🧒 Trẻ em tập nói</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Giới Tính</label>
                <select
                  value={formData.gender}
                  onChange={(e) => updateField("gender", e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 text-xs focus:border-medical-blue focus:ring-0"
                >
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <UserIcon className="w-3 h-3 text-medical-blue" />
                <span>Họ và Tên *</span>
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => updateField("full_name", e.target.value)}
                placeholder="VD: Nguyễn Văn A"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 bg-white focus:border-medical-blue focus:ring-0"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Tuổi *</label>
                <input
                  type="number"
                  value={formData.age || ""}
                  onChange={(e) => updateField("age", parseInt(e.target.value) || 0)}
                  min={1}
                  max={120}
                  placeholder="VD: 65"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 bg-white focus:border-medical-blue focus:ring-0"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1 flex items-center gap-0.5">
                  <Droplets className="w-3 h-3 text-red-500" />
                  <span>Nhóm Máu</span>
                </label>
                <select
                  value={formData.blood_type}
                  onChange={(e) => updateField("blood_type", e.target.value)}
                  className="w-full px-2.5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 text-xs focus:border-medical-blue focus:ring-0"
                >
                  <option value="A+">A+</option>
                  <option value="O+">O+</option>
                  <option value="B+">B+</option>
                  <option value="AB+">AB+</option>
                  <option value="A-">A-</option>
                  <option value="O-">O-</option>
                  <option value="B-">B-</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>

            {!isPersonalValid && (
              <p className="text-[10px] text-slate-400 font-medium">* Vui lòng nhập Họ tên và Tuổi để tiếp tục.</p>
            )}
          </div>
        )}

        {/* BƯỚC 2: BỆNH LÝ */}
        {step === 2 && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Heart className="w-3 h-3 text-red-500" />
                <span>Tiền Sử Bệnh Lý Nền & Phẫu Thuật</span>
              </label>
              <textarea
                rows={4}
                value={formData.medical_history}
                onChange={(e) => updateField("medical_history", e.target.value)}
                placeholder="VD: Tăng huyết áp, tiểu đường type 2... (có thể bỏ trống nếu chưa rõ)"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-white focus:border-medical-blue focus:ring-0 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-amber-500" />
                <span>Dị Ứng Thực Phẩm & Thuốc</span>
              </label>
              <input
                type="text"
                value={formData.allergies}
                onChange={(e) => updateField("allergies", e.target.value)}
                placeholder="VD: Dị ứng hải sản, dị ứng Penicillin... (nếu có)"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:border-medical-blue focus:ring-0"
              />
            </div>

            <p className="text-[10px] text-slate-400 font-medium">
              Bạn có thể bổ sung chi tiết bệnh mãn tính & chống chỉ định sau trong trang Sổ Y Bạ.
            </p>
          </div>
        )}

        {/* BƯỚC 3: SINH HIỆU */}
        {step === 3 && (
          <div className="space-y-3">
            <div className="p-2.5 bg-blue-50/80 rounded-xl flex items-center space-x-2 text-xs text-slate-800 font-medium">
              <Activity className="w-4 h-4 text-medical-blue flex-shrink-0" />
              <span>Chỉ số sinh hiệu nền để Robot đối chiếu khi đo đạc thực tế.</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1">
                <label className="block text-[9px] font-bold uppercase text-slate-500">Huyết Áp Tâm Thu</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={formData.baseline_biometrics?.blood_pressure_systolic ?? 120}
                    onChange={(e) => updateBiometric("blood_pressure_systolic", parseInt(e.target.value) || 120)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-bold text-sm text-slate-900 bg-slate-50"
                  />
                  <span className="text-[10px] text-slate-500 font-medium">mmHg</span>
                </div>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1">
                <label className="block text-[9px] font-bold uppercase text-slate-500">Huyết Áp Tâm Trương</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={formData.baseline_biometrics?.blood_pressure_diastolic ?? 80}
                    onChange={(e) => updateBiometric("blood_pressure_diastolic", parseInt(e.target.value) || 80)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-bold text-sm text-slate-900 bg-slate-50"
                  />
                  <span className="text-[10px] text-slate-500 font-medium">mmHg</span>
                </div>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1">
                <label className="block text-[9px] font-bold uppercase text-slate-500">Nhịp Tim</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={formData.baseline_biometrics?.heart_rate_bpm ?? 75}
                    onChange={(e) => updateBiometric("heart_rate_bpm", parseInt(e.target.value) || 75)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-bold text-sm text-slate-900 bg-slate-50"
                  />
                  <span className="text-[10px] text-slate-500 font-medium">BPM</span>
                </div>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1">
                <label className="block text-[9px] font-bold uppercase text-slate-500">SpO2</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={formData.baseline_biometrics?.spo2_percent ?? 98}
                    onChange={(e) => updateBiometric("spo2_percent", parseInt(e.target.value) || 98)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-bold text-sm text-slate-900 bg-slate-50"
                  />
                  <span className="text-[10px] text-slate-500 font-medium">%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1">
                <label className="block text-[9px] font-bold uppercase text-slate-500">Cân Nặng</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={formData.baseline_biometrics?.weight_kg ?? ""}
                    onChange={(e) => updateBiometric("weight_kg", parseFloat(e.target.value) || 0)}
                    placeholder="VD: 60"
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-bold text-sm text-slate-900 bg-slate-50"
                  />
                  <span className="text-[10px] text-slate-500 font-medium">kg</span>
                </div>
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1">
                <label className="block text-[9px] font-bold uppercase text-slate-500">Chiều Cao</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={formData.baseline_biometrics?.height_cm ?? ""}
                    onChange={(e) => updateBiometric("height_cm", parseInt(e.target.value) || 0)}
                    placeholder="VD: 160"
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-bold text-sm text-slate-900 bg-slate-50"
                  />
                  <span className="text-[10px] text-slate-500 font-medium">cm</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BƯỚC 4: LIÊN HỆ */}
        {step === 4 && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-600" />
                <span>Người Liên Hệ Khẩn Cấp (SOS) *</span>
              </label>
              <input
                type="text"
                value={formData.emergency_contact}
                onChange={(e) => updateField("emergency_contact", e.target.value)}
                placeholder="VD: 0912.345.678 (Con trai)"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 bg-white focus:border-medical-blue focus:ring-0"
              />
              {!isContactValid && (
                <p className="text-[10px] text-slate-400 font-medium mt-1">* Bắt buộc để Robot gọi trợ giúp khi khẩn cấp.</p>
              )}
            </div>

            <div className="p-2.5 bg-slate-100/70 rounded-xl space-y-2.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Bác Sĩ Điều Trị (Không bắt buộc)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={formData.primary_doctor?.name || ""}
                  onChange={(e) => updateDoctor("name", e.target.value)}
                  placeholder="Tên bác sĩ"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-900 bg-white focus:border-medical-blue focus:ring-0"
                />
                <input
                  type="text"
                  value={formData.primary_doctor?.phone || ""}
                  onChange={(e) => updateDoctor("phone", e.target.value)}
                  placeholder="SĐT phòng khám"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-700 bg-white focus:border-medical-blue focus:ring-0"
                />
                <div className="col-span-2">
                  <input
                    type="text"
                    value={formData.primary_doctor?.hospital || ""}
                    onChange={(e) => updateDoctor("hospital", e.target.value)}
                    placeholder="Bệnh viện / Phòng khám"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-900 bg-white focus:border-medical-blue focus:ring-0"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BƯỚC 5: XÁC NHẬN */}
        {step === 5 && (
          <div className="space-y-3">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5">
              <PartyPopper className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <p className="text-xs font-bold text-emerald-800">Sắp xong! Kiểm tra lại thông tin trước khi lưu.</p>
            </div>

            {pendingLabImport && (
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-medical-blue">
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Đã đọc từ phiếu xét nghiệm</span>
                </div>
                {formData.diagnosis && (
                  <p className="text-[11px] text-slate-700"><span className="font-bold">Chẩn đoán:</span> {formData.diagnosis}</p>
                )}
                {formData.health_classification && (
                  <p className="text-[11px] text-slate-700"><span className="font-bold">Phân loại sức khỏe:</span> {formData.health_classification}</p>
                )}
                <p className="text-[11px] text-slate-700">
                  <span className="font-bold">Số chỉ số xét nghiệm:</span> {pendingLabImport.results?.length || 0} mục — sẽ lưu vào lịch sử Sổ Y Bạ
                </p>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Họ tên</span>
                <span className="font-bold text-slate-900">{formData.full_name || "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Tuổi / Giới tính</span>
                <span className="font-bold text-slate-900">
                  {formData.age || "—"} • {formData.gender === "male" ? "Nam" : formData.gender === "female" ? "Nữ" : "Khác"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Nhóm máu</span>
                <span className="font-bold text-slate-900">{formData.blood_type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Dị ứng</span>
                <span className="font-bold text-slate-900 text-right">{formData.allergies || "Không có"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Liên hệ khẩn cấp</span>
                <span className="font-bold text-slate-900">{formData.emergency_contact || "—"}</span>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center space-x-2.5 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Thanh điều hướng dưới cùng */}
      <div className="flex-shrink-0 p-4 pt-3 border-t border-slate-200 bg-white flex items-center gap-2.5">
        {step > 0 && (
          <button
            type="button"
            onClick={handleBack}
            disabled={saving}
            className="p-3 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {step < STEP_LABELS.length - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canGoNext()}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-medical-blue hover:bg-medical-hover text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:active:scale-100"
          >
            <span>{step === 0 ? "Bắt đầu thiết lập" : "Tiếp theo"}</span>
            {step === 0 ? <Sparkles className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            disabled={saving || !isPersonalValid || !isContactValid}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:active:scale-100"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Hoàn tất & Lưu</span>
              </>
            )}
          </button>
        )}
      </div>

      {showImportModal && (
        <ImportLabLinkModal onClose={() => setShowImportModal(false)} onImported={handleImported} />
      )}
    </div>
  );
}
