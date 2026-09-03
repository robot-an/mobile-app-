import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  where,
  orderBy, 
  limit, 
  setDoc, 
  addDoc, 
  deleteDoc,
  getDocs,
  getDoc,
  updateDoc,
  serverTimestamp 
} from "firebase/firestore";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User 
} from "firebase/auth";

// Cấu hình Firebase Client SDK kết nối trực tiếp với dự án Cloud
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "robot-an",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ""
};

// Khởi tạo Singleton Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { 
  app, 
  db, 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  doc, 
  onSnapshot, 
  collection, 
  query, 
  where,
  orderBy, 
  limit, 
  setDoc, 
  addDoc, 
  deleteDoc,
  getDocs,
  getDoc,
  updateDoc,
  serverTimestamp 
};
export type { User };

// ============================================================================
// HỆ THỐNG KIỂU DỮ LIỆU ĐẦY ĐỦ CHO ROBOT Y TẾ - AN (CHUẨN BỊ RAG & VECTOR SEARCH)
// ============================================================================

// 1. Thuốc và Liều lượng chi tiết
export interface MedicationItem {
  id: string;
  name: string;                   // Tên thuốc: VD "Amlodipine"
  dosage: string;                 // Liều dùng: VD "5mg"
  times: string[];                // Giờ uống trong ngày: ["08:00", "19:00"]
  instructions: string;           // Cách uống: "Uống sau ăn 30 phút với nước ấm"
  purpose: string;                // Công dụng: "Hạ huyết áp"
  remaining_pills?: number;       // Số viên thuốc còn lại trong hộp
  doctor_prescribed?: string;     // Bác sĩ kê đơn
}

// 2. Chỉ số Sinh hiệu Baseline
export interface BaselineBiometrics {
  blood_pressure_systolic: number;  // Huyết áp tâm thu chuẩn (VD 120)
  blood_pressure_diastolic: number; // Huyết áp tâm trương chuẩn (VD 70)
  heart_rate_bpm: number;           // Nhịp tim trung bình (VD 82)
  spo2_percent: number;             // Nồng độ oxy trong máu (VD 99)
  temperature_c?: number;           // Thân nhiệt cơ bản (°C)
  blood_glucose_mmol?: number;      // Đường huyết lúc đói (VD 4.34)
  cholesterol_total?: number;       // Cholesterol toàn phần (mmol/L)
  cholesterol_ldl?: number;         // LDL-Cholesterol xấu (mmol/L)
  weight_kg?: number;
  height_cm?: number;
}

// 3. Sổ Y Bạ Toàn Diện (Medical & Care Profile)
export interface MedicalRecord {
  robot_id?: string;
  patient_id?: string;              // Mã định danh người bệnh (patient_01)
  medical_code?: string;            // Mã phiếu xét nghiệm / bệnh án (220826-560007302212)
  insurance_code?: string;          // Số thẻ BHYT
  target_type: "elderly" | "child";
  full_name: string;
  age: number;
  gender?: "male" | "female" | "other";
  blood_type?: string;              // Nhóm máu: "A+", "O+", "B+", "AB+"...
  
  // Tiền sử & Dị ứng
  medical_history: string;          // Chuỗi mô tả tổng hợp
  chronic_conditions?: string[];    // ["Rối loạn lipid máu", "Block nhánh phải", "Thoái hóa cột sống cổ"]
  allergies: string;                // "Dị ứng hành lá, mẫn cảm thức ăn cay nóng"
  contraindications?: string[];     // Chống chỉ định y tế & dinh dưỡng
  
  // Danh mục thuốc & Lịch uống
  medication_schedule: string;      // Chuỗi tổng hợp hiển thị nhanh
  medications_list?: MedicationItem[]; // Danh sách thuốc dạng mảng có cấu trúc
  
  // Sinh hiệu chuẩn
  baseline_biometrics?: BaselineBiometrics;
  
  // Liên hệ khẩn cấp & Y tế
  emergency_contact: string;        // "0846.888.196 (Người thân khẩn cấp)"
  emergency_contacts_list?: Array<{
    name: string;
    relation: string;
    phone: string;
    is_primary: boolean;
  }>;
  primary_doctor?: {
    name: string;
    hospital: string;
    phone: string;
    specialty: string;
  };

  // Dành riêng cho Chế độ Trẻ Em
  child_speech_profile?: {
    development_stage: string;      // "2-3 tuổi (Giai đoạn ghép từ)"
    vocabulary_milestones?: string[]; // ["Quả táo", "Con mèo", "Xe hơi", "Uống nước"]
    speech_goals?: string[];        // ["Luyện phát âm âm vần tròn môi", "Nói câu 3 từ"]
    favorite_topics?: string[];     // ["Động vật", "Gia đình", "Màu sắc"]
  };

  // Dặn dò cho AI
  notes?: string;
  ai_personality_preference?: string; // "Trợ lý y tế ân cần, nhắc lịch cữ thuốc đúng giờ"
  updated_at?: string;
}

// 4. Cơ Sở Tri Thức RAG & Vector Embeddings (RAG Knowledge Base)
export interface KnowledgeBaseDoc {
  id: string;
  category: "medical_guideline" | "drug_interaction" | "first_aid" | "child_speech_exercise" | "elderly_nutrition";
  title: string;                    // Tiêu đề: "Hướng dẫn sơ cứu khi người cao tuổi té ngã"
  content: string;                  // Nội dung bài viết chi tiết
  chunk_text: string;               // Phân khúc văn bản nạp vào RAG
  embedding?: number[];             // Vector Embedding (768 chiều từ Gemini text-embedding-004)
  keywords: string[];               // ["té ngã", "sơ cứu", "bất tỉnh", "chấn thương sọ não"]
  target_audience: "elderly" | "child" | "caregiver";
  verified_by_doctor: boolean;      // Được kiểm duyệt y tế
  source: string;                   // "Phác đồ Bộ Y Tế / Tài liệu Nhi Khoa"
  updated_at: any;
}

// 5. Trạng Thái Robot & Telemetry Thời Gian Thực
export interface RobotStatus {
  robot_id: string;
  battery: number;
  latitude: number;
  longitude: number;
  address?: string;
  is_online: boolean;
  fall_detected: boolean;
  mode: "companion" | "speech_learning";
  last_active?: string;
  sos_alert?: boolean;
  
  // Dữ liệu cảm biến phần cứng mở rộng (ESP32 + MPU6050)
  heart_rate?: number;
  body_temp?: number;
  ambient_temp?: number;
  humidity?: number;
  fall_risk_score?: number;         // Điểm đánh giá nguy cơ té ngã dựa trên gia tốc rung lắc (0-100)
  active_rag_model?: string;        // "gemini-1.5-pro + text-embedding-004"
  hardware_version?: string;        // "ESP32-WROOM-32D v2.1"
}

// 6. Lịch Trình Chăm Sóc Định Kỳ (Care Schedules)
export interface CareSchedule {
  id: string;
  robot_id: string;
  title: string;                    // "Nhắc uống Amlodipine 5mg", "Nhắc đo huyết áp sáng"
  schedule_type: "MEDICATION" | "VITALS_CHECK" | "HYDRATION" | "EXERCISE" | "SPEECH_LESSON";
  time_of_day: string;              // "08:00" (giờ Việt Nam - Asia/Ho_Chi_Minh, UTC+7)
  voice_prompt_template: string;    // "Bác ơi, đã 8 giờ sáng rồi, cháu An nhắc Bác uống 1 viên Amlodipine nhé ạ!"
  is_active: boolean;
  days_of_week: number[];           // [1, 2, 3, 4, 5, 6, 7] (1: Thứ 2, 7: Chủ nhật)
  source?: "medical_record" | "manual"; // Tự sinh từ Sổ Y Bạ hay người dùng tự thêm tay
  medication_id?: string;           // Trỏ ngược về MedicationItem.id nếu source = medical_record
  created_at?: any;
}

// 7. Phiên & Lịch Sử Đàm Thoại AI (Sessions & Chat Messages)
export interface ChatSession {
  id: string;
  robot_id: string;
  title: string;
  mode: "companion" | "speech_learning";
  created_at: any;
  updated_at: any;
  last_message?: string;
  rag_context_used?: boolean;       // Đã kích hoạt vector search RAG cho phiên này
  message_count?: number;
}

export interface ChatMessage {
  id?: string;
  session_id: string;
  robot_id: string;
  sender: "user" | "bot";
  text: string;
  isEmergency?: boolean;
  intent_detected?: string;         // "ASK_MEDICATION", "REPORT_SYMPTOM", "EMERGENCY_FALL", "GREETING"
  rag_source_doc_ids?: string[];    // Danh sách doc_id được trích xuất từ Knowledge Base
  vector_embedding?: number[];      // Vector của câu hỏi để semantic search lại
  model?: string;                   // "gemini-1.5-pro"
  timestamp: any;
}

// 8. Nhật Ký Cảnh Báo An Toàn (Alert Logs)
export interface AlertLog {
  id: string;
  robot_id: string;
  event_type: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  message: string;
  timestamp: string;
  metadata?: {
    latitude?: number;
    longitude?: number;
    accel_peak?: number;
    heart_rate?: number;
    resolved_by?: string;
    resolved_at?: string;
    status?: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
  };
}
