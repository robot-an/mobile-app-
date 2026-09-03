"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Clock,
  CalendarCheck2,
  Plus,
  Pill,
  Droplet,
  Activity,
  Sparkles,
  CheckCircle2,
  X,
  Trash2,
  Volume2,
  Calendar,
  Save,
  Check,
  BookText
} from "lucide-react";
import {
  CareSchedule,
  MedicalRecord,
  db,
  doc,
  setDoc,
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  where
} from "@/lib/firebase";

export default function SchedulesPage() {
  const robotId = "an_robot_01";

  const [schedules, setSchedules] = useState<CareSchedule[]>([
    {
      id: "sched_01",
      robot_id: robotId,
      title: "Thuốc huyết áp Amlodipine 5mg",
      schedule_type: "MEDICATION",
      time_of_day: "08:00",
      voice_prompt_template: "Dạ cháu Kiến An chào Bác! Đã 8 giờ sáng rồi, Bác nhớ uống 1 viên Amlodipine sau ăn nhé ạ!",
      is_active: true,
      days_of_week: [1, 2, 3, 4, 5, 6, 7]
    },
    {
      id: "sched_02",
      robot_id: robotId,
      title: "Uống 1 cốc nước ấm & Vận động nhẹ",
      schedule_type: "HYDRATION",
      time_of_day: "15:30",
      voice_prompt_template: "Bác ơi, cháu Kiến An nhắc Bác uống một cốc nước ấm và đi dạo nhẹ nhàng trong nhà nhé ạ!",
      is_active: true,
      days_of_week: [1, 2, 3, 4, 5, 6, 7]
    },
    {
      id: "sched_03",
      robot_id: robotId,
      title: "Thuốc chống đông Aspirin 81mg",
      schedule_type: "MEDICATION",
      time_of_day: "19:00",
      voice_prompt_template: "Bác ơi, đã đến giờ uống 1 viên Aspirin 81mg sau bữa tối rồi ạ!",
      is_active: true,
      days_of_week: [1, 2, 3, 4, 5, 6, 7]
    },
    {
      id: "sched_04",
      robot_id: robotId,
      title: "Đo huyết áp & Nhịp tim tối",
      schedule_type: "VITALS_CHECK",
      time_of_day: "20:30",
      voice_prompt_template: "Cháu Kiến An nhắc Bác ngồi nghỉ và đo lại huyết áp tối nay nhé ạ!",
      is_active: true,
      days_of_week: [1, 2, 3, 4, 5, 6, 7]
    }
  ]);

  const [completedList, setCompletedList] = useState<string[]>(["sched_01"]);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null);

  // Ref luon giu ban schedules moi nhat de dung trong interval/effect ma khong can
  // dua "schedules" vao dependency (tranh sync lien tuc moi lan Firestore ban ve).
  const schedulesRef = useRef<CareSchedule[]>(schedules);
  useEffect(() => {
    schedulesRef.current = schedules;
  }, [schedules]);

  // Form state thêm mới
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<"MEDICATION" | "HYDRATION" | "VITALS_CHECK" | "SPEECH_LESSON">("MEDICATION");
  const [newTime, setNewTime] = useState("09:00");
  const [newPrompt, setNewPrompt] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const q = query(collection(db, "care_schedules"), where("robot_id", "==", robotId));
      const unsub = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const loaded: CareSchedule[] = [];
          snapshot.forEach((d) => {
            loaded.push({ id: d.id, ...d.data() } as CareSchedule);
          });
          setSchedules(loaded);
        }
      });
      return () => unsub();
    } catch (e) {}
  }, [robotId]);

  // Lắng nghe Sổ Y Bạ để lấy chuẩn lịch uống thuốc từ danh mục thuốc (medications_list)
  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, "medical_records", robotId), (snap) => {
        if (snap.exists()) setMedicalRecord(snap.data() as MedicalRecord);
      });
      return () => unsub();
    } catch (e) {}
  }, [robotId]);

  // Tự động đồng bộ 1 cữ nhắc MEDICATION cho mỗi (thuốc x giờ uống) khai báo trong Sổ Y Bạ.
  // Cữ nào người dùng tự tắt (is_active=false) vẫn được giữ nguyên qua các lần đồng bộ sau.
  // Thuốc nào bị xóa khỏi Sổ Y Bạ thì cữ nhắc tự sinh tương ứng cũng được dọn theo.
  useEffect(() => {
    const meds = medicalRecord?.medications_list;
    if (!meds) return;

    const syncFromMedicalRecord = async () => {
      const desiredIds = new Set<string>();

      for (const med of meds) {
        for (const time of med.times || []) {
          const schedId = `auto_${med.id}_${time.replace(":", "")}`;
          desiredIds.add(schedId);

          const existing = schedulesRef.current.find((s) => s.id === schedId);
          const payload: Partial<CareSchedule> & { id: string; robot_id: string } = {
            id: schedId,
            robot_id: robotId,
            title: `${med.name} (${med.dosage})`,
            schedule_type: "MEDICATION",
            time_of_day: time,
            voice_prompt_template:
              `Bác ơi, đã đến giờ uống ${med.dosage} ${med.name} rồi ạ! ${med.instructions || ""}`.trim(),
            days_of_week: existing?.days_of_week || [1, 2, 3, 4, 5, 6, 7],
            source: "medical_record",
            medication_id: med.id
          };
          if (!existing) payload.is_active = true;

          try {
            await setDoc(doc(db, "care_schedules", schedId), payload, { merge: true });
          } catch (e) {
            console.warn("Không đồng bộ được cữ thuốc từ Sổ Y Bạ:", e);
          }
        }
      }

      const stale = schedulesRef.current.filter(
        (s) => s.source === "medical_record" && !desiredIds.has(s.id)
      );
      for (const s of stale) {
        try {
          await deleteDoc(doc(db, "care_schedules", s.id));
        } catch (e) {}
      }
    };

    syncFromMedicalRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [robotId, JSON.stringify(medicalRecord?.medications_list || [])]);

  // Báo thức trên điện thoại giờ chạy toàn app (xem components/ReminderAlarm.tsx trong
  // layout.tsx), không còn gắn theo vòng đời trang này nữa - để chuông vẫn kêu dù đang
  // ở trang Chat/Sổ Y Bạ chứ không chỉ khi mở đúng trang Lịch Nhắc.

  const toggleComplete = (id: string) => {
    setCompletedList(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleActive = async (id: string, currentVal: boolean) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, is_active: !currentVal } : s));
    try {
      await updateDoc(doc(db, "care_schedules", id), { is_active: !currentVal });
    } catch (e) {}
  };

  const handleDelete = async (id: string) => {
    const target = schedules.find((s) => s.id === id);
    if (target?.source === "medical_record") {
      alert("Cữ thuốc này lấy từ Sổ Y Bạ. Hãy xóa thuốc trong Sổ Y Bạ để bỏ cữ nhắc này.");
      return;
    }
    if (!confirm("Bạn có chắc muốn xóa lịch nhắc này?")) return;
    setSchedules(prev => prev.filter(s => s.id !== id));
    try {
      await deleteDoc(doc(db, "care_schedules", id));
    } catch (e) {}
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSaving(true);
    const newSched: Omit<CareSchedule, "id"> = {
      robot_id: robotId,
      title: newTitle.trim(),
      schedule_type: newType,
      time_of_day: newTime,
      voice_prompt_template: newPrompt.trim() || `Cháu Kiến An nhắc Bác đến giờ ${newTitle} rồi ạ!`,
      is_active: true,
      days_of_week: [1, 2, 3, 4, 5, 6, 7],
      source: "manual"
    };

    try {
      const docRef = await addDoc(collection(db, "care_schedules"), newSched);
      setSchedules(prev => [...prev, { id: docRef.id, ...newSched }]);
      setShowAddModal(false);
      setNewTitle("");
      setNewPrompt("");
    } catch (err: any) {
      // Truoc day o day them 1 ban ghi CHI CO TRONG STATE LOCAL roi dong modal nhu the
      // da luu thanh cong - trong khi thuc te chua ghi duoc len Firestore nen bao thuc
      // (ca dien thoai lan ESP32, deu doc tu Firestore that) se khong bao gio kich hoat.
      console.error("Lỗi lưu cữ nhắc:", err);
      alert(
        err?.code === "permission-denied"
          ? "Không có quyền ghi Firestore (permission-denied) - cữ nhắc CHƯA được lưu."
          : `Lưu cữ nhắc thất bại: ${err?.message || "Lỗi không xác định"}`
      );
    } finally {
      setSaving(false);
    }
  };

  const filtered = schedules.filter(s => {
    if (filterType === "ALL") return true;
    return s.schedule_type === filterType;
  });

  const adherencePercent = schedules.length > 0
    ? Math.round((completedList.length / schedules.length) * 100)
    : 100;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "MEDICATION":
        return <Pill className="w-3.5 h-3.5 text-medical-blue" />;
      case "HYDRATION":
        return <Droplet className="w-3.5 h-3.5 text-cyan-600" />;
      case "VITALS_CHECK":
        return <Activity className="w-3.5 h-3.5 text-red-500" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case "MEDICATION":
        return "Thuốc uống";
      case "HYDRATION":
        return "Nước uống";
      case "VITALS_CHECK":
        return "Sinh hiệu";
      default:
        return "Bài tập";
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-3">
      {/* Ghi chú nguồn dữ liệu: cữ thuốc lấy tự động từ Sổ Y Bạ, còn lại tự thêm tay */}
      <div className="p-2.5 bg-blue-50/80 rounded-xl flex items-center space-x-2 text-[11px] text-slate-700 font-medium">
        <BookText className="w-3.5 h-3.5 text-medical-blue flex-shrink-0" />
        <span>Cữ uống thuốc (💊) tự động lấy giờ từ Sổ Y Bạ. Cữ nước, sinh hiệu, bài học... bạn tự thêm bằng nút bên dưới.</span>
      </div>

      {/* Thanh Tiến Độ & Nút Thêm Lịch Nhanh */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-card flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
            Tiến độ hôm nay
          </span>
          <div className="flex items-baseline space-x-1.5 mt-0.5">
            <span className="text-xl font-black text-slate-900">{adherencePercent}%</span>
            <span className="text-xs text-slate-500 font-medium">
              ({completedList.length}/{schedules.length} cữ)
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="py-2 px-3 bg-medical-blue hover:bg-medical-hover text-white rounded-xl shadow-xs flex items-center space-x-1 text-xs font-bold active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm lịch</span>
        </button>
      </div>

      {/* 2. Bộ Lọc Phân Loại Lịch Nhắc */}
      <div className="flex bg-slate-100 p-1 rounded-xl gap-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setFilterType("ALL")}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            filterType === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Tất cả ({schedules.length})
        </button>
        <button
          onClick={() => setFilterType("MEDICATION")}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            filterType === "MEDICATION" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          💊 Thuốc uống
        </button>
        <button
          onClick={() => setFilterType("HYDRATION")}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            filterType === "HYDRATION" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          💧 Nước uống
        </button>
        <button
          onClick={() => setFilterType("VITALS_CHECK")}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
            filterType === "VITALS_CHECK" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          💓 Sinh hiệu
        </button>
      </div>

      {/* 3. Danh Sách Cữ Thuốc & Nhắc Nhở */}
      <div className="space-y-2">
        {filtered.map((sched) => {
          const isDone = completedList.includes(sched.id);

          return (
            <div
              key={sched.id}
              className={`p-3.5 bg-white rounded-2xl border transition-all shadow-card flex flex-col space-y-2.5 ${
                isDone 
                  ? "border-emerald-200 bg-emerald-50/30 opacity-80" 
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              {/* Row 1: Time + Category + Switch */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-extrabold font-mono text-slate-900 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200">
                    {sched.time_of_day}
                  </span>
                  <span className="flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200">
                    {getTypeIcon(sched.schedule_type)}
                    <span>{getTypeName(sched.schedule_type)}</span>
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sched.is_active}
                      onChange={() => toggleActive(sched.id, sched.is_active)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-medical-blue"></div>
                  </label>
                  {sched.source !== "medical_record" && (
                    <button
                      onClick={() => handleDelete(sched.id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                      title="Xóa cữ này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2: Title & Voice Prompt */}
              <div>
                <div className="flex items-center gap-1.5">
                  <p className={`text-xs font-bold ${isDone ? "line-through text-slate-400" : "text-slate-900"}`}>
                    {sched.title}
                  </p>
                  {sched.source === "medical_record" && (
                    <span
                      title="Tự động lấy từ Sổ Y Bạ - sửa trong Sổ Y Bạ để thay đổi"
                      className="inline-flex items-center gap-0.5 text-[9px] font-bold text-medical-blue bg-blue-50 px-1.5 py-0.5 rounded-md flex-shrink-0"
                    >
                      <BookText className="w-2.5 h-2.5" /> Sổ Y Bạ
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 font-medium flex items-start gap-1 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <Volume2 className="w-3 h-3 text-medical-blue flex-shrink-0 mt-0.5" />
                  <span>&quot;{sched.voice_prompt_template}&quot;</span>
                </p>
              </div>

              {/* Row 3: Nút Xác Nhận Hoàn Thành */}
              <button
                type="button"
                onClick={() => toggleComplete(sched.id)}
                className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-transform active:scale-98 ${
                  isDone
                    ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                    : "bg-medical-blue hover:bg-medical-hover text-white shadow-xs"
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 ${isDone ? "text-emerald-700" : "text-white"}`} />
                <span>{isDone ? "Đã uống cữ này (Bấm để hủy)" : "Xác Nhận Đã Uống"}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal Thêm Lịch Nhắc Mới */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-elevated space-y-3.5 animate-slideUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Thêm Cữ Nhắc Mới
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSchedule} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên Cữ Nhắc / Thuốc
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="VD: Thuốc huyết áp Losartan 50mg"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-medical-blue focus:ring-0"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phân Loại
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold focus:border-medical-blue focus:ring-0"
                  >
                    <option value="MEDICATION">💊 Thuốc uống</option>
                    <option value="HYDRATION">💧 Nước uống</option>
                    <option value="VITALS_CHECK">💓 Sinh hiệu</option>
                    <option value="SPEECH_LESSON">🧒 Học nói</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Giờ Nhắc (24h)
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-xs focus:border-medical-blue focus:ring-0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Câu Thoại Loa Robot An Phát Ra
                </label>
                <textarea
                  rows={2}
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  placeholder="VD: Cháu Kiến An nhắc Bác uống thuốc sau ăn nhé ạ!"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-medical-blue focus:ring-0"
                />
              </div>

              <button
                type="submit"
                disabled={saving || !newTitle.trim()}
                className="w-full py-2.5 bg-medical-blue hover:bg-medical-hover text-white rounded-xl font-bold text-xs shadow-xs flex items-center justify-center space-x-1.5 active:scale-98 transition-all disabled:opacity-50 mt-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Đang lưu..." : "Lưu Lịch Nhắc"}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
