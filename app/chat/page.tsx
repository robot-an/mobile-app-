"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Mic,
  MicOff,
  Sparkles,
  AlertTriangle,
  History,
  Plus,
  Trash2,
  Search,
  X,
  MessageSquare,
  Check,
  Clock,
  Volume2,
  VolumeX,
  Radio,
  FileText,
  Menu
} from "lucide-react";
import { 
  RobotStatus, 
  ChatSession,
  db, 
  doc, 
  onSnapshot, 
  auth, 
  onAuthStateChanged, 
  User as FirebaseUser,
  collection,
  addDoc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from "@/lib/firebase";
import UserAvatar from "@/components/UserAvatar";
import AppLogo from "@/components/AppLogo";

interface Message {
  id: string;
  session_id?: string;
  sender: "user" | "bot";
  text: string;
  isEmergency?: boolean;
  rag_sources?: string[];
  time: string;
  timestamp?: any;
}

export default function MobileChatPage() {
  const robotId = "an_robot_01";
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [mode, setMode] = useState<"companion" | "speech_learning">("companion");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Quản lý Voice (STT & TTS)
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Quản lý Fullscreen Sidebar
  const [showSidebar, setShowSidebar] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, "status", robotId), (snap) => {
        if (snap.exists()) {
          const data = snap.data() as RobotStatus;
          if (data.mode) {
            setMode(data.mode);
          }
        }
      });
      return () => unsub();
    } catch (e) {}
  }, [robotId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const reco = new SpeechRecognition();
        reco.lang = "vi-VN";
        reco.continuous = false;
        reco.interimResults = false;

        reco.onresult = (event: any) => {
          const spokenText = event.results[0][0].transcript;
          if (spokenText) {
            setInput(spokenText);
            handleSend(spokenText);
          }
          setIsListening(false);
        };

        reco.onerror = () => setIsListening(false);
        reco.onend = () => setIsListening(false);

        recognitionRef.current = reco;
      }
    }
  }, [currentSessionId, mode]);

  const speakVietnamese = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "vi-VN";
      utterance.rate = mode === "companion" ? 0.9 : 1.0;
      utterance.pitch = mode === "companion" ? 1.0 : 1.15;
      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Trình duyệt chưa hỗ trợ Web Speech API. Bạn có thể gõ tin nhắn!");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  useEffect(() => {
    try {
      const q = query(
        collection(db, "chat_sessions"),
        where("robot_id", "==", robotId),
        orderBy("updated_at", "desc"),
        limit(30)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const loadedSessions: ChatSession[] = [];
        snapshot.forEach((docSnap) => {
          loadedSessions.push({ id: docSnap.id, ...docSnap.data() } as ChatSession);
        });
        setSessions(loadedSessions);

        if (!currentSessionId && loadedSessions.length > 0) {
          setCurrentSessionId(loadedSessions[0].id);
        }
      });

      return () => unsubscribe();
    } catch (err) {}
  }, [robotId]);

  useEffect(() => {
    if (!currentSessionId) {
      setMessages([
        {
          id: "init_1",
          sender: "bot",
          text: mode === "companion"
            ? "Dạ, cháu Kiến An chào Bác ạ! Bác có điều gì cần cháu An hỗ trợ sức khỏe hay nhắc lịch uống thuốc không ạ?"
            : "Chào bé yêu! Hôm nay cùng Chú Kiến An học thêm nhiều từ mới thật vui nhé!",
          time: "Vừa xong"
        }
      ]);
      return;
    }

    try {
      const q = query(
        collection(db, "chat_history"),
        where("session_id", "==", currentSessionId),
        orderBy("timestamp", "asc"),
        limit(50)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const loadedMsgs: Message[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const timeStr = data.timestamp?.toDate 
              ? data.timestamp.toDate().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
              : "Vừa xong";

            loadedMsgs.push({
              id: docSnap.id,
              session_id: data.session_id,
              sender: data.sender,
              text: data.text,
              isEmergency: data.isEmergency,
              rag_sources: data.rag_sources_used,
              time: timeStr,
              timestamp: data.timestamp
            });
          });
          setMessages(loadedMsgs);
        }
      });

      return () => unsubscribe();
    } catch (err) {}
  }, [currentSessionId, mode]);

  const handleStartNewChat = () => {
    setCurrentSessionId("");
    setMessages([
      {
        id: "new_" + Date.now(),
        sender: "bot",
        text: mode === "companion"
          ? "Dạ, cháu Kiến An sẵn sàng cho cuộc trò chuyện mới cùng Bác. Bác muốn hỏi điều gì ạ?"
          : "Chào bé yêu! Bắt đầu đoạn chat mới cùng Chú Kiến An nào!",
        time: "Vừa xong"
      }
    ]);
    setShowSidebar(false);
  };

  const handleClearCurrentChat = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa toàn bộ tin nhắn trong đoạn chat này?")) return;

    if (currentSessionId) {
      try {
        const q = query(collection(db, "chat_history"), where("session_id", "==", currentSessionId));
        const snap = await getDocs(q);
        snap.forEach(async (d) => {
          await deleteDoc(d.ref);
        });

        await setDoc(doc(db, "chat_sessions", currentSessionId), {
          last_message: "Đã xóa sạch nội dung",
          updated_at: serverTimestamp()
        }, { merge: true });
      } catch (err) {}
    }

    setMessages([
      {
        id: "cleared_" + Date.now(),
        sender: "bot",
        text: mode === "companion"
          ? "Đã làm sạch cuộc trò chuyện. Cháu Kiến An luôn sẵn sàng hỗ trợ Bác bất cứ lúc nào!"
          : "Đã làm sạch cuộc trò chuyện! Cùng chú Kiến An bắt đầu lại nào!",
        time: "Vừa xong"
      }
    ]);
    setShowSidebar(false);
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Bạn có chắc muốn xóa lịch sử đoạn chat này?")) return;

    try {
      await deleteDoc(doc(db, "chat_sessions", sessionId));
      const q = query(collection(db, "chat_history"), where("session_id", "==", sessionId));
      const snap = await getDocs(q);
      snap.forEach(async (d) => {
        await deleteDoc(d.ref);
      });

      if (currentSessionId === sessionId) {
        handleStartNewChat();
      }
    } catch (err) {}
  };

  const handleSend = async (textToSend?: string) => {
    const queryText = (textToSend || input).trim();
    if (!queryText || loading) return;

    const timeNow = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    let activeSessionId = currentSessionId;

    if (!activeSessionId) {
      try {
        const titleSnippet = queryText.length > 25 ? queryText.slice(0, 25) + "..." : queryText;
        const newSessionRef = await addDoc(collection(db, "chat_sessions"), {
          robot_id: robotId,
          title: titleSnippet,
          mode: mode,
          last_message: queryText,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
          user_uid: user?.uid || "anonymous"
        });
        activeSessionId = newSessionRef.id;
        setCurrentSessionId(activeSessionId);
      } catch (err) {
        activeSessionId = "local_session_" + Date.now();
        setCurrentSessionId(activeSessionId);
      }
    }

    const tempUserMsg: Message = {
      id: "temp_" + Date.now(),
      session_id: activeSessionId,
      sender: "user",
      text: queryText,
      time: timeNow
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setInput("");
    setLoading(true);

    try {
      await addDoc(collection(db, "chat_history"), {
        session_id: activeSessionId,
        robot_id: robotId,
        sender: "user",
        text: queryText,
        user_uid: user?.uid || "anonymous",
        timestamp: serverTimestamp()
      });

      try {
        await setDoc(doc(db, "chat_sessions", activeSessionId), {
          last_message: queryText,
          updated_at: serverTimestamp()
        }, { merge: true });
      } catch (e) {}

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const res = await fetch(`${backendUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: queryText,
          mode: mode,
          robot_id: robotId
        })
      });
      const data = await res.json();

      const replyText = (data.success && data.data?.response_text)
        ? data.data.response_text
        : "Dạ, cháu Kiến An đã lắng nghe và ghi nhận thông tin của Bác.";
      const isEmergency = data.data?.is_emergency || false;
      const ragSources = data.data?.rag_sources_used || [];

      if (autoSpeak && replyText) {
        speakVietnamese(replyText);
      }

      await addDoc(collection(db, "chat_history"), {
        session_id: activeSessionId,
        robot_id: robotId,
        sender: "bot",
        text: replyText,
        isEmergency: isEmergency,
        rag_sources_used: ragSources,
        timestamp: serverTimestamp()
      });

      try {
        await setDoc(doc(db, "chat_sessions", activeSessionId), {
          last_message: replyText,
          updated_at: serverTimestamp()
        }, { merge: true });
      } catch (e) {}

    } catch (err) {
      console.error("Lỗi gửi tin nhắn:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter(s =>
    s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.last_message?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatSessionDate = (timestamp: any) => {
    if (!timestamp) return "Vừa xong";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }) + 
             " " + date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "Gần đây";
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 pb-16">
      {/* 1. THANH ĐIỀU KHIỂN CHAT CỐ ĐỊNH PHÍA TRÊN */}
      <div className="bg-white px-3.5 py-2 border-b border-slate-200 flex items-center justify-between shadow-xs flex-shrink-0 z-10">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-xs font-bold text-slate-800">
            {mode === "companion" ? "🧓 Chế độ Đồng Hành" : "🧒 Chế độ Học Nói"}
          </p>
        </div>

        {/* Nút Loa & Nút Menu Slidebar */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setAutoSpeak(!autoSpeak)}
            className={`p-1.5 rounded-lg border transition-colors ${
              autoSpeak 
                ? "bg-emerald-50 text-emerald-700 border-emerald-300" 
                : "bg-slate-100 text-slate-400 border-slate-200"
            }`}
            title={autoSpeak ? "Tắt giọng nói" : "Bật giọng nói"}
          >
            {autoSpeak ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setShowSidebar(true)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-medical-blue hover:bg-medical-hover text-white font-bold text-xs shadow-xs active:scale-95 transition-transform"
            title="Mở menu quản lý & lịch sử"
          >
            <Menu className="w-3.5 h-3.5" />
            <span>Menu</span>
          </button>
        </div>
      </div>

      {/* 2. KHU VỰC CUỘN TIN NHẮN DUY NHẤT (OVERSCROLL CONTAIN) */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 overscroll-contain">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.sender === "bot" && (
              <div className="w-7 h-7 rounded-lg overflow-hidden shadow-xs flex-shrink-0 mb-1 border border-slate-200 bg-white">
                <img src="/logo.jpg" alt="Kiến An" className="w-full h-full object-cover" />
              </div>
            )}

            <div className={`max-w-[82%] p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
              msg.sender === "user"
                ? "bg-medical-blue text-white rounded-br-xs"
                : msg.isEmergency
                ? "bg-red-50 text-red-700 border border-red-200 font-semibold rounded-bl-xs animate-pulse"
                : "bg-white text-slate-900 border border-slate-200 rounded-bl-xs"
            }`}>
              {msg.isEmergency && (
                <div className="flex items-center gap-1 text-red-600 font-bold text-[11px] mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Báo động khẩn cấp!
                </div>
              )}

              <p className="whitespace-pre-line">{msg.text}</p>

              {msg.rag_sources && msg.rag_sources.length > 0 && (
                <div className="mt-1.5 pt-1 border-t border-slate-100 flex items-center gap-1 text-[9px] text-emerald-700 font-semibold">
                  <FileText className="w-3 h-3 text-emerald-600" />
                  <span>Đã đối chiếu cẩm nang y tế & sổ y bạ</span>
                </div>
              )}

              <div className="flex items-center justify-between mt-1 pt-0.5">
                {msg.sender === "bot" && (
                  <button
                    onClick={() => speakVietnamese(msg.text)}
                    className="text-slate-400 hover:text-medical-blue transition-colors p-0.5"
                    title="Nghe lại"
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>
                )}
                <span className={`text-[9px] block ml-auto font-medium opacity-60 ${
                  msg.sender === "user" ? "text-blue-100" : "text-slate-400"
                }`}>
                  {msg.time}
                </span>
              </div>
            </div>

            {msg.sender === "user" && (
              <UserAvatar user={user} size="sm" className="w-7 h-7 !rounded-lg mb-1 text-[10px]" />
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-xl border border-slate-200 w-fit text-xs text-slate-500 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-medical-blue animate-spin" />
            <span>Chú Kiến An đang suy nghĩ...</span>
          </div>
        )}

        {isListening && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-700 font-bold animate-pulse">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-red-600 animate-spin" />
              <span>Đang nghe... Hãy nói đi!</span>
            </div>
            <button
              onClick={() => setIsListening(false)}
              className="text-slate-500 hover:text-red-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. THANH NHẬP TIN NHẮN CỐ ĐỊNH ĐÁY */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-2 bg-white border-t border-slate-200 flex items-center gap-1.5 flex-shrink-0 z-10"
      >
        <button
          type="button"
          onClick={toggleVoiceInput}
          className={`p-2 rounded-xl transition-all ${
            isListening
              ? "bg-red-600 text-white animate-bounce shadow-xs"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
          title="Nói giọng nói"
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-medical-blue" />}
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isListening 
              ? "Đang lắng nghe..." 
              : mode === "companion"
              ? "Hỏi Chú Kiến An (VD: Cụ bị ngã, uống thuốc...)"
              : "Nói cùng Chú Kiến An..."
          }
          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 focus:border-medical-blue focus:ring-0 text-xs bg-slate-50 text-slate-900 font-medium"
        />

        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2 bg-medical-blue hover:bg-medical-hover text-white rounded-xl font-bold shadow-xs disabled:opacity-40 transition-transform active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* ========================================================================= */}
      {/* 5. SLIDEBAR TRONG KHUNG DI ĐỘNG (LỊCH SỬ CHAT + CLEAR CHAT + CẨM NANG)     */}
      {/* ========================================================================= */}
      {showSidebar && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col animate-slideRight">
          
          {/* Header Slidebar */}
          <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-2">
              <AppLogo size="sm" showText={false} />
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Menu Trợ Lý Kiến An
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">
                  Lịch sử hội thoại & Cẩm nang
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowSidebar(false)}
              className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-600 transition-colors flex items-center gap-1 text-xs font-bold"
              title="Đóng menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

            {/* Cụm Nút Hành Động: Đoạn chat mới & Xóa sạch chat */}
            <div className="p-3 border-b border-slate-200 bg-white grid grid-cols-2 gap-2 flex-shrink-0">
              <button
                onClick={handleStartNewChat}
                className="py-2 px-3 bg-medical-blue hover:bg-medical-hover text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 shadow-xs active:scale-98 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Đoạn chat mới</span>
              </button>

              <button
                onClick={handleClearCurrentChat}
                className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 active:scale-98 transition-all"
                title="Xóa toàn bộ tin nhắn đoạn chat này"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>Xóa sạch chat</span>
              </button>
            </div>

            {/* Lịch Sử Trò Chuyện */}
            <div className="p-2.5 bg-slate-100 border-b border-slate-200 flex items-center space-x-1.5 flex-shrink-0">
              <History className="w-3.5 h-3.5 text-medical-blue" />
              <span className="text-xs font-bold text-slate-700">Lịch Sử Trò Chuyện ({sessions.length})</span>
            </div>

            {(
              <div className="flex-1 flex flex-col min-h-0 bg-white">
                <div className="p-2.5 border-b border-slate-100">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm lại nội dung đã trao đổi..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:border-medical-blue focus:ring-0"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {filteredSessions.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 space-y-1.5">
                      <MessageSquare className="w-8 h-8 mx-auto opacity-40" />
                      <p className="text-xs font-semibold">Chưa có lịch sử nào</p>
                      <p className="text-[10px] text-slate-500">Hãy bắt đầu nhắn tin với Robot An!</p>
                    </div>
                  ) : (
                    filteredSessions.map((sess) => {
                      const isCurrent = sess.id === currentSessionId;
                      return (
                        <div
                          key={sess.id}
                          onClick={() => {
                            setCurrentSessionId(sess.id);
                            setShowSidebar(false);
                          }}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                            isCurrent
                              ? "border-medical-blue bg-blue-50/50 shadow-xs"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="flex items-center space-x-1.5 min-w-0">
                              <span className="text-xs">
                                {sess.mode === "speech_learning" ? "🧒" : "🧓"}
                              </span>
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {sess.title || "Cuộc trò chuyện"}
                              </p>
                            </div>
                            <button
                              onClick={(e) => handleDeleteSession(sess.id, e)}
                              title="Xóa đoạn chat này"
                              className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <p className="text-[11px] text-slate-500 truncate mt-1">
                            {sess.last_message || "Xem nội dung..."}
                          </p>

                          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-medical-blue" />
                              {formatSessionDate(sess.updated_at)}
                            </span>
                            {isCurrent && (
                              <span className="text-medical-blue font-bold flex items-center gap-0.5">
                                <Check className="w-3 h-3" /> Đang mở
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

          {/* Footer Slidebar */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
            <span className="font-semibold">Robot Y Tế - An</span>
            <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-md font-mono">v2.5</span>
          </div>
        </div>
      )}
    </div>
  );
}
