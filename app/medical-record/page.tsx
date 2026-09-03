"use client";

import React, { useState, useEffect } from "react";
import {
  Check,
  CheckCircle,
  Heart,
  Activity,
  AlertTriangle,
  Phone,
  User,
  Sparkles,
  Droplets,
  Plus,
  Trash2,
  Building,
  ShieldAlert
} from "lucide-react";
import {
  MedicalRecord,
  MedicationItem,
  db,
  doc,
  setDoc,
  onSnapshot
} from "@/lib/firebase";
import { useHeaderAction } from "@/lib/header-action-context";

export default function MobileMedicalRecordPage() {
  const robotId = "an_robot_01";
  
  const [activeTab, setActiveTab] = useState<"personal" | "medical" | "biometrics" | "medications" | "contraindications" | "contact">("personal");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [formData, setFormData] = useState<MedicalRecord>({
    robot_id: robotId,
    patient_id: "patient_01",
    medical_code: "220826-560007302212",
    insurance_code: "DN4010123456789",
    target_type: "elderly",
    full_name: "NGUYỄN HOÀNG HIỆP",
    age: 29,
    gender: "male",
    blood_type: "A+",
    medical_history: "Rối loạn lipid máu hỗn hợp (Cholesterol toàn phần 8.16 mmol/L, LDL-C 6.33 mmol/L). Block nhánh phải hoàn toàn (RBBB) trên điện tâm đồ. Thoái hóa cột sống cổ. Tiền sử viêm loét dạ dày, tiền sử phẫu thuật cắt trĩ. Tật khúc xạ mắt hai bên. Vi đạm niệu nhẹ (Microalbumin niệu 3 mg/dL).",
    chronic_conditions: [
      "Tăng cholesterol máu nguyên phát / Rối loạn lipid máu (ICD-10: E78.0)",
      "Block nhánh phải hoàn toàn (ICD-10: I45.1)",
      "Thoái hóa cột sống cổ (ICD-10: M47.8)",
      "Viêm loét dạ dày tá tràng (ICD-10: K27)",
      "Vi đạm niệu nhẹ / Microalbumin niệu (3 mg/dL)"
    ],
    allergies: "Dị ứng hành lá (mẩn ngứa da liễu cấp), mẫn cảm thức ăn chua cay kích ứng dạ dày",
    medication_schedule: "Atorvastatin 20mg (20:00 tối sau ăn), Esomeprazole 20mg (07:00 sáng trước ăn khi đau dạ dày)",
    medications_list: [
      {
        id: "med_01",
        name: "Atorvastatin (Lipitor)",
        dosage: "20mg",
        times: ["20:00"],
        instructions: "Uống 1 viên vào buổi tối sau ăn với nước lọc",
        purpose: "Hạ mỡ máu, giảm Cholesterol toàn phần và LDL-C",
        remaining_pills: 30,
        doctor_prescribed: "BS. PKĐK MEDLATEC"
      },
      {
        id: "med_02",
        name: "Esomeprazole (Nexium)",
        dosage: "20mg",
        times: ["07:00"],
        instructions: "Uống 1 viên vào buổi sáng trước ăn 30 phút khi đau tức dạ dày",
        purpose: "Giảm tiết axit dạ dày, phòng ngừa viêm loét tái phát",
        remaining_pills: 14,
        doctor_prescribed: "BS. PKĐK MEDLATEC"
      },
      {
        id: "med_03",
        name: "Glucosamine & Canxi Nano",
        dosage: "500mg",
        times: ["12:00"],
        instructions: "Uống 1 viên vào buổi trưa sau ăn no",
        purpose: "Bổ sung dưỡng chất sụn khớp, hỗ trợ thoái hóa cột sống cổ",
        remaining_pills: 60,
        doctor_prescribed: "BS. PKĐK MEDLATEC"
      }
    ],
    contraindications: [
      "Tuyệt đối kiêng thực phẩm chứa hành lá (tiền sử dị ứng mẩn ngứa da liễu cấp).",
      "Hạn chế tối đa mỡ động vật, nội tạng, đồ chiên rán, lòng đỏ trứng để kiểm soát mỡ máu LDL-C (6.33 mmol/L).",
      "Tránh sử dụng thuốc giảm đau kháng viêm NSAIDs (Ibuprofen, Diclofenac) do tiền sử viêm loét dạ dày.",
      "Tránh ngồi cúi gập cổ trong thời gian dài (bảo vệ cột sống cổ, tập vận động cổ sau mỗi 45 phút).",
      "Tránh vận động quá sức đột ngột khi chưa khởi động kỹ (theo dõi nhịp tim Block nhánh phải)."
    ],
    baseline_biometrics: {
      blood_pressure_systolic: 120,
      blood_pressure_diastolic: 70,
      heart_rate_bpm: 82,
      spo2_percent: 99,
      temperature_c: 36.6,
      blood_glucose_mmol: 4.34,
      cholesterol_total: 8.16,
      cholesterol_ldl: 6.33,
      weight_kg: 69,
      height_cm: 161
    },
    primary_doctor: {
      name: "Bác sĩ PKĐK MEDLATEC",
      hospital: "Phòng khám Đa khoa MEDLATEC Số 1 - Tây Hồ, Hà Nội",
      phone: "1900565656",
      specialty: "Nội tổng quát & Tim mạch"
    },
    emergency_contact: "0846.888.196 (Người thân khẩn cấp)",
    notes: "Mã hồ sơ xét nghiệm MEDLATEC: 220826-560007302212. Nhắc anh Hiệp kiêng ăn hành lá, hạn chế dầu mỡ và tập duỗi cổ định kỳ."
  });

  const [chronicInput, setChronicInput] = useState("");
  const [contraInput, setContraInput] = useState("");

  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, "medical_records", robotId), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as MedicalRecord;
          setFormData((prev) => ({ ...prev, ...data }));
        }
      });
      return () => unsub();
    } catch (err) {
      console.warn("Firestore onSnapshot error:", err);
    }
  }, [robotId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "age" ? parseInt(value) || 0 : value
    }));
  };

  const handleDoctorChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      primary_doctor: {
        name: prev.primary_doctor?.name || "",
        hospital: prev.primary_doctor?.hospital || "",
        phone: prev.primary_doctor?.phone || "",
        specialty: prev.primary_doctor?.specialty || "",
        ...prev.primary_doctor,
        [field]: value
      }
    }));
  };

  const handleBiometricChange = (field: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      baseline_biometrics: {
        blood_pressure_systolic: 120,
        blood_pressure_diastolic: 70,
        heart_rate_bpm: 80,
        spo2_percent: 98,
        ...prev.baseline_biometrics,
        [field]: value
      }
    }));
  };

  const addChronicCondition = () => {
    if (!chronicInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      chronic_conditions: [...(prev.chronic_conditions || []), chronicInput.trim()]
    }));
    setChronicInput("");
  };

  const removeChronicCondition = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      chronic_conditions: prev.chronic_conditions?.filter((_, i) => i !== index)
    }));
  };

  const addContraindication = () => {
    if (!contraInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      contraindications: [...(prev.contraindications || []), contraInput.trim()]
    }));
    setContraInput("");
  };

  const removeContraindication = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      contraindications: prev.contraindications?.filter((_, i) => i !== index)
    }));
  };

  const handleMedChange = (index: number, field: keyof MedicationItem, value: any) => {
    setFormData((prev) => {
      const list = [...(prev.medications_list || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, medications_list: list };
    });
  };

  const addMedication = () => {
    const newMed: MedicationItem = {
      id: `med_${Date.now()}`,
      name: "Thuốc mới",
      dosage: "1 viên",
      times: ["08:00"],
      instructions: "Uống sau ăn với nước ấm",
      purpose: "Điều trị bệnh",
      remaining_pills: 30,
      doctor_prescribed: formData.primary_doctor?.name || "Bác sĩ điều trị"
    };
    setFormData((prev) => ({
      ...prev,
      medications_list: [...(prev.medications_list || []), newMed]
    }));
  };

  const removeMedication = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      medications_list: prev.medications_list?.filter((_, i) => i !== index)
    }));
  };

  const weight = formData.baseline_biometrics?.weight_kg || 69;
  const heightM = (formData.baseline_biometrics?.height_cm || 161) / 100;
  const bmi = heightM > 0 ? (weight / (heightM * heightM)).toFixed(1) : "26.6";

  const saveRecord = async () => {
    setSaving(true);
    setSuccess(false);
    setSaveError(null);

    try {
      const payload: MedicalRecord = {
        ...formData,
        updated_at: new Date().toISOString()
      };

      await setDoc(doc(db, "medical_records", robotId), payload, { merge: true });

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      await fetch(`${backendUrl}/api/medical-records?robot_id=${robotId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).catch((err) => console.warn("Backend sync note:", err));

      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      // Khong duoc gia vo thanh cong khi Firestore tu choi ghi (VD: permission-denied) -
      // truoc day o day gia lap setSuccess(true) khien loi quyen bi che mat hoan toan.
      console.error("Lỗi lưu sổ y bạ:", err);
      setSaveError(err?.code === "permission-denied"
        ? "Không có quyền ghi Firestore (permission-denied) - dữ liệu CHƯA được lưu lên Cloud."
        : `Lưu thất bại: ${err?.message || "Lỗi không xác định"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveRecord();
  };

  // Dang ky nut Luu dang icon tick tren navbar chung, thay vi nut day o cuoi form
  useHeaderAction(Check, saveRecord, { loading: saving, label: "Lưu Sổ Y Bạ" });

  return (
    <div className="flex-1 flex flex-col p-3.5 pb-24 overflow-y-auto space-y-3 select-none h-full bg-slate-50/50">
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center space-x-2.5 text-xs font-bold animate-fadeIn flex-shrink-0 shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Đã lưu & đồng bộ toàn bộ Sổ Y Bạ thành công lên Cloud & AI!</span>
        </div>
      )}

      {saveError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center space-x-2.5 text-xs font-bold animate-fadeIn flex-shrink-0 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Tabs: moi tab chi hien thi dung 1 nhom du lieu, khong can cuon nhieu */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/70 rounded-xl flex-shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("personal")}
          className={`py-2 px-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
            activeTab === "personal" ? "bg-white text-medical-blue shadow-xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>👤 Cá Nhân</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("medical")}
          className={`py-2 px-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
            activeTab === "medical" ? "bg-white text-medical-blue shadow-xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>🩺 Bệnh Lý</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("biometrics")}
          className={`py-2 px-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
            activeTab === "biometrics" ? "bg-white text-medical-blue shadow-xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>💓 Sinh Hiệu</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("medications")}
          className={`py-2 px-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
            activeTab === "medications" ? "bg-white text-medical-blue shadow-xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>💊 Thuốc ({formData.medications_list?.length || 0})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("contraindications")}
          className={`py-2 px-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
            activeTab === "contraindications" ? "bg-white text-red-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>⚠️ Lưu Ý</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("contact")}
          className={`py-2 px-1 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
            activeTab === "contact" ? "bg-white text-medical-blue shadow-xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>📞 Liên Hệ</span>
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 bg-white rounded-2xl p-4 shadow-card flex flex-col justify-between space-y-4">
        
        {/* TAB 1: CA NHAN - chi thong tin dinh danh, khong lien quan benh ly */}
        {activeTab === "personal" && (
          <div className="space-y-3.5 flex-1">
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Đối Tượng
                </label>
                <select
                  name="target_type"
                  value={formData.target_type}
                  onChange={handleChange}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 text-xs focus:border-medical-blue focus:ring-0"
                >
                  <option value="elderly">🧓 Người lớn / Cụ</option>
                  <option value="child">🧒 Trẻ em tập nói</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Giới Tính
                </label>
                <select
                  name="gender"
                  value={formData.gender || "male"}
                  onChange={handleChange}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 text-xs focus:border-medical-blue focus:ring-0"
                >
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1 flex items-center gap-0.5">
                  <Droplets className="w-3 h-3 text-red-500" />
                  <span>Nhóm Máu</span>
                </label>
                <select
                  name="blood_type"
                  value={formData.blood_type || "A+"}
                  onChange={handleChange}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 text-xs focus:border-medical-blue focus:ring-0"
                >
                  <option value="A+">A+ (Chuẩn)</option>
                  <option value="O+">O+</option>
                  <option value="B+">B+</option>
                  <option value="AB+">AB+</option>
                  <option value="A-">A-</option>
                  <option value="O-">O- (Hiếm)</option>
                  <option value="B-">B-</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-2.5">
              <div className="col-span-9">
                <label className="block text-[10px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-medical-blue" />
                  <span>Họ và Tên</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="NGUYỄN HOÀNG HIỆP"
                  required
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:border-medical-blue focus:ring-0"
                />
              </div>

              <div className="col-span-3">
                <label className="block text-[10px] font-bold text-slate-600 mb-1 text-center">
                  Tuổi
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  min={1}
                  max={120}
                  required
                  className="w-full px-1.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:border-medical-blue focus:ring-0 text-center"
                />
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl space-y-2.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Mã Định Danh Hồ Sơ
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Mã BN nội bộ</label>
                  <input
                    type="text"
                    name="patient_id"
                    value={formData.patient_id || ""}
                    onChange={handleChange}
                    placeholder="patient_01"
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-700 bg-white focus:border-medical-blue focus:ring-0"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Mã hồ sơ XN</label>
                  <input
                    type="text"
                    name="medical_code"
                    value={formData.medical_code || ""}
                    onChange={handleChange}
                    placeholder="220826-560007302212"
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-700 bg-white focus:border-medical-blue focus:ring-0"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Số thẻ BHYT</label>
                  <input
                    type="text"
                    name="insurance_code"
                    value={formData.insurance_code || ""}
                    onChange={handleChange}
                    placeholder="DN4010123456789"
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-700 bg-white focus:border-medical-blue focus:ring-0"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BENH LY - tien su, benh man tinh, di ung - tach rieng khoi ca nhan */}
        {activeTab === "medical" && (
          <div className="space-y-3.5 flex-1">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Heart className="w-3 h-3 text-red-500" />
                <span>Tiền Sử Bệnh Lý Nền & Phẫu Thuật</span>
              </label>
              <textarea
                name="medical_history"
                rows={3}
                value={formData.medical_history}
                onChange={handleChange}
                placeholder="VD: Rối loạn lipid máu, Block nhánh phải, Thoái hóa cột sống cổ, Viêm loét dạ dày..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-slate-50 focus:border-medical-blue focus:ring-0 leading-relaxed"
              />
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                <span>Danh Mục Bệnh Mãn Tính (ICD-10)</span>
                <span className="text-[9px] text-medical-blue font-bold lowercase">({formData.chronic_conditions?.length || 0} bệnh)</span>
              </label>

              <div className="flex flex-wrap gap-1.5">
                {formData.chronic_conditions?.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-1 px-2 py-1 bg-white rounded-lg text-[10px] font-bold text-slate-800 shadow-2xs">
                    <span>• {item}</span>
                    <button
                      type="button"
                      onClick={() => removeChronicCondition(idx)}
                      className="text-slate-400 hover:text-red-500 p-0.5"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  value={chronicInput}
                  onChange={(e) => setChronicInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addChronicCondition())}
                  placeholder="Nhập thêm bệnh mãn tính / mã ICD-10..."
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium bg-white focus:border-medical-blue focus:ring-0"
                />
                <button
                  type="button"
                  onClick={addChronicCondition}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Thêm
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-amber-500" />
                <span>Dị Ứng Thực Phẩm & Thuốc</span>
              </label>
              <input
                type="text"
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                placeholder="VD: Dị ứng hành lá, dị ứng Penicillin..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:border-medical-blue focus:ring-0"
              />
            </div>
          </div>
        )}

        {/* TAB 3: SINH HIỆU */}
        {activeTab === "biometrics" && (
          <div className="space-y-3 flex-1">
            <div className="p-2.5 bg-blue-50/80 rounded-xl flex items-center space-x-2 text-xs text-slate-800 font-medium">
              <Activity className="w-4 h-4 text-medical-blue flex-shrink-0" />
              <span>Chỉ số sinh hiệu nền đối chiếu khi Robot phân tích sức khỏe và đo đạc.</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                <label className="block text-[9px] font-bold uppercase text-slate-500">
                  Huyết Áp Tâm Thu (Tối đa)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={formData.baseline_biometrics?.blood_pressure_systolic || 120}
                    onChange={(e) => handleBiometricChange("blood_pressure_systolic", parseInt(e.target.value) || 120)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-bold text-sm text-slate-900 bg-white"
                  />
                  <span className="text-[10px] text-slate-500 font-medium">mmHg</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                <label className="block text-[9px] font-bold uppercase text-slate-500">
                  Huyết Áp Tâm Trương (Tối thiểu)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={formData.baseline_biometrics?.blood_pressure_diastolic || 70}
                    onChange={(e) => handleBiometricChange("blood_pressure_diastolic", parseInt(e.target.value) || 70)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-bold text-sm text-slate-900 bg-white"
                  />
                  <span className="text-[10px] text-slate-500 font-medium">mmHg</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                <label className="block text-[9px] font-bold uppercase text-slate-500">
                  Nhịp Tim Cơ Bản
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={formData.baseline_biometrics?.heart_rate_bpm || 82}
                    onChange={(e) => handleBiometricChange("heart_rate_bpm", parseInt(e.target.value) || 82)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-bold text-sm text-slate-900 bg-white"
                  />
                  <span className="text-[10px] text-slate-500 font-medium">BPM</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                <label className="block text-[9px] font-bold uppercase text-slate-500">
                  Nồng Độ Oxy SpO2
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={formData.baseline_biometrics?.spo2_percent || 99}
                    onChange={(e) => handleBiometricChange("spo2_percent", parseInt(e.target.value) || 99)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-bold text-sm text-slate-900 bg-white"
                  />
                  <span className="text-[10px] text-slate-500 font-medium">%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-slate-100">
              <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                <label className="block text-[9px] font-bold uppercase text-slate-500 flex items-center justify-between">
                  <span>Đường Huyết Đói</span>
                  <span className="text-[9px] text-emerald-600 font-bold">Chuẩn</span>
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.baseline_biometrics?.blood_glucose_mmol || 4.34}
                    onChange={(e) => handleBiometricChange("blood_glucose_mmol", parseFloat(e.target.value) || 4.34)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-bold text-xs text-slate-900 bg-white"
                  />
                  <span className="text-[9px] text-slate-500 font-medium">mmol/L</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl space-y-1">
                <label className="block text-[9px] font-bold uppercase text-slate-500">
                  Thân Nhiệt Chuẩn
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    value={formData.baseline_biometrics?.temperature_c || 36.6}
                    onChange={(e) => handleBiometricChange("temperature_c", parseFloat(e.target.value) || 36.6)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-bold text-xs text-slate-900 bg-white"
                  />
                  <span className="text-[9px] text-slate-500 font-medium">°C</span>
                </div>
              </div>

              <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-1">
                <label className="block text-[9px] font-bold uppercase text-amber-800 flex items-center justify-between">
                  <span>Cholesterol TP</span>
                  <span className="text-[9px] text-red-600 font-black">Tăng</span>
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.baseline_biometrics?.cholesterol_total || 8.16}
                    onChange={(e) => handleBiometricChange("cholesterol_total", parseFloat(e.target.value) || 8.16)}
                    className="w-full px-2 py-1.5 rounded-lg border border-amber-300 font-bold text-xs text-red-600 bg-white"
                  />
                  <span className="text-[9px] text-slate-500 font-medium">mmol/L</span>
                </div>
              </div>

              <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-1">
                <label className="block text-[9px] font-bold uppercase text-amber-800 flex items-center justify-between">
                  <span>Mỡ Xấu LDL-C</span>
                  <span className="text-[9px] text-red-600 font-black">Cao</span>
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.baseline_biometrics?.cholesterol_ldl || 6.33}
                    onChange={(e) => handleBiometricChange("cholesterol_ldl", parseFloat(e.target.value) || 6.33)}
                    className="w-full px-2 py-1.5 rounded-lg border border-amber-300 font-bold text-xs text-red-600 bg-white"
                  />
                  <span className="text-[9px] text-slate-500 font-medium">mmol/L</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-1 border-t border-slate-100 items-end">
              <div>
                <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Cân Nặng</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={formData.baseline_biometrics?.weight_kg || 69}
                    onChange={(e) => handleBiometricChange("weight_kg", parseFloat(e.target.value) || 69)}
                    className="w-full px-2 py-2 rounded-xl border border-slate-300 font-bold text-xs bg-slate-50"
                  />
                  <span className="text-[10px] text-slate-500">kg</span>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Chiều Cao</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={formData.baseline_biometrics?.height_cm || 161}
                    onChange={(e) => handleBiometricChange("height_cm", parseInt(e.target.value) || 161)}
                    className="w-full px-2 py-2 rounded-xl border border-slate-300 font-bold text-xs bg-slate-50"
                  />
                  <span className="text-[10px] text-slate-500">cm</span>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-blue-50/80 text-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase block">BMI Tự Động</span>
                <span className="text-xs font-black text-medical-blue leading-none">{bmi} kg/m²</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DANH MỤC THUỐC */}
        {activeTab === "medications" && (
          <div className="space-y-3 flex-1">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900">
                Danh Mục Thuốc ({formData.medications_list?.length || 0})
              </span>
              <button
                type="button"
                onClick={addMedication}
                className="px-2.5 py-1 bg-medical-blue text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs hover:bg-medical-hover"
              >
                <Plus className="w-3 h-3" /> Thêm thuốc
              </button>
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-0.5">
              {formData.medications_list?.map((med, index) => (
                <div key={med.id || index} className="p-3 bg-slate-50 rounded-xl space-y-2 relative">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400">#{index + 1}</span>
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) => handleMedChange(index, "name", e.target.value)}
                        placeholder="Tên thuốc..."
                        className="w-full px-2 py-1 rounded-lg border border-slate-300 font-bold text-xs text-slate-900 bg-white"
                      />
                    </div>
                    
                    <div className="w-24">
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => handleMedChange(index, "dosage", e.target.value)}
                        placeholder="Liều (20mg)"
                        className="w-full px-2 py-1 rounded-lg border border-slate-300 font-bold text-xs text-slate-800 bg-white text-center"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeMedication(index)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded-md"
                      title="Xóa thuốc"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Khung giờ nhắc uống</label>
                      <input
                        type="text"
                        value={med.times?.join(", ") || "20:00"}
                        onChange={(e) => handleMedChange(index, "times", e.target.value.split(",").map(t => t.trim()))}
                        placeholder="20:00, 08:00"
                        className="w-full px-2 py-1 rounded-lg border border-slate-300 text-xs font-mono font-bold text-medical-blue bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Mục đích / Công dụng</label>
                      <input
                        type="text"
                        value={med.purpose}
                        onChange={(e) => handleMedChange(index, "purpose", e.target.value)}
                        placeholder="Hạ mỡ máu, giảm LDL..."
                        className="w-full px-2 py-1 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Cách dùng & Lưu ý</label>
                    <input
                      type="text"
                      value={med.instructions}
                      onChange={(e) => handleMedChange(index, "instructions", e.target.value)}
                      placeholder="Uống sau ăn no với nước lọc..."
                      className="w-full px-2 py-1 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: CHỐNG CHỈ ĐỊNH */}
        {activeTab === "contraindications" && (
          <div className="space-y-3 flex-1">
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-xs text-red-900 font-bold">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>Robot sẽ cảnh báo ngay nếu người bệnh vi phạm các điều cấm kỵ này.</span>
            </div>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-0.5">
              {formData.contraindications?.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-red-50/50 border-l-2 border-red-300 flex items-start justify-between space-x-2 text-xs text-slate-800 font-medium leading-relaxed">
                  <div className="flex items-start space-x-2 min-w-0">
                    <span className="text-red-500 font-black text-sm leading-none">•</span>
                    <span>{item}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeContraindication(idx)}
                    className="text-slate-400 hover:text-red-500 p-0.5 flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
              <input
                type="text"
                value={contraInput}
                onChange={(e) => setContraInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addContraindication())}
                placeholder="Nhập thêm chống chỉ định / thực phẩm kiêng khem..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium bg-white focus:border-red-500 focus:ring-0"
              />
              <button
                type="button"
                onClick={addContraindication}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm
              </button>
            </div>
          </div>
        )}

        {/* TAB 6: LIÊN HỆ - bac si, benh vien, nguoi than khan cap, dan do AI */}
        {activeTab === "contact" && (
          <div className="space-y-3.5 flex-1">
            <div className="p-2.5 bg-slate-50 rounded-xl space-y-2.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Bác Sĩ Điều Trị Chính
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Tên bác sĩ</label>
                  <input
                    type="text"
                    value={formData.primary_doctor?.name || ""}
                    onChange={(e) => handleDoctorChange("name", e.target.value)}
                    placeholder="Bác sĩ PKĐK MEDLATEC"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-900 bg-white focus:border-medical-blue focus:ring-0"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Chuyên khoa</label>
                  <input
                    type="text"
                    value={formData.primary_doctor?.specialty || ""}
                    onChange={(e) => handleDoctorChange("specialty", e.target.value)}
                    placeholder="Nội tổng quát & Tim mạch"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-900 bg-white focus:border-medical-blue focus:ring-0"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-0.5 flex items-center gap-1">
                    <Building className="w-3 h-3 text-indigo-500" /> Đơn vị khám / Bệnh viện
                  </label>
                  <input
                    type="text"
                    value={formData.primary_doctor?.hospital || ""}
                    onChange={(e) => handleDoctorChange("hospital", e.target.value)}
                    placeholder="PKĐK MEDLATEC Tây Hồ"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-900 bg-white focus:border-medical-blue focus:ring-0"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-0.5">SĐT phòng khám</label>
                  <input
                    type="text"
                    value={formData.primary_doctor?.phone || ""}
                    onChange={(e) => handleDoctorChange("phone", e.target.value)}
                    placeholder="1900565656"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-700 bg-white focus:border-medical-blue focus:ring-0"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-600" />
                <span>Người Liên Hệ Khẩn Cấp (SOS)</span>
              </label>
              <input
                type="text"
                name="emergency_contact"
                value={formData.emergency_contact}
                onChange={handleChange}
                placeholder="0846.888.196 (Người thân khẩn cấp)"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:border-medical-blue focus:ring-0"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>Lời Dặn Dò Thêm Cho Robot AI</span>
              </label>
              <textarea
                name="notes"
                rows={3}
                value={formData.notes || ""}
                onChange={handleChange}
                placeholder="VD: Nhắc anh Hiệp kiêng ăn hành lá, hạn chế dầu mỡ và tập duỗi cổ định kỳ..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 bg-slate-50 focus:border-medical-blue focus:ring-0 leading-relaxed"
              />
            </div>
          </div>
        )}

      </form>
    </div>
  );
}
