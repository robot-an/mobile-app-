"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  X, 
  Volume2, 
  VolumeX, 
  Send, 
  Bot, 
  MessageSquare, 
  ArrowRight,
  Radio,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { db, collection, addDoc, serverTimestamp } from "@/lib/firebase";

interface SiriVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export default function SiriVoiceModal({ isOpen, onClose, initialQuery = "" }: SiriVoiceModalProps) {
  const router = useRouter();
  const robotId = "an_robot_01";

  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);

  // Khởi tạo và Bật Web Speech Recognition khi mở Modal
  useEffect(() => {
    if (!isOpen) {
      stopListening();
      stopSpeaking();
      setTranscript("");
      setInterimText("");
      setResponse(null);
      setErrorMessage(null);
      return;
    }

    // Rung phản hồi haptic khi kích hoạt
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([40, 50, 40]);
    }

    startListening();

    return () => {
      stopListening();
      stopSpeaking();
    };
  }, [isOpen]);

  const startListening = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMessage("Trình duyệt chưa hỗ trợ Web Speech API. Bạn có thể mở trực tiếp trang chat để gõ tin nhắn!");
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }

      const reco = new SpeechRecognition();
      reco.lang = "vi-VN";
      reco.continuous = true;
      reco.interimResults = true;

      reco.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      reco.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (interim) {
          setInterimText(interim);
        }

        if (final) {
          const combined = (transcript + " " + final).trim();
          setTranscript(combined);
          setInterimText("");

          // Tự động gửi sau 1.8s im lặng khi đã nói xong
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            handleSendVoiceQuery(combined);
          }, 1800);
        }
      };

      reco.onerror = (event: any) => {
        if (event.error !== "no-speech") {
          console.warn("Speech recognition error:", event.error);
        }
      };

      reco.onend = () => {
        setIsListening(false);
      };

      reco.start();
      recognitionRef.current = reco;
    } catch (err) {
      console.error("Lỗi khởi chạy microphone:", err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    setIsSpeaking(false);
  };

  // Đọc phản hồi bằng giọng nói tiếng Việt mượt mà
  const speakText = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "vi-VN";
      utterance.rate = 0.95;
      utterance.pitch = 1.05;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      setIsSpeaking(false);
    }
  };

  // Gửi câu hỏi giọng nói tới Gemini 1.5 Pro AI
  const handleSendVoiceQuery = async (queryText?: string) => {
    const textToSend = (queryText || transcript || interimText).trim();
    if (!textToSend || isProcessing) return;

    stopListening();
    setIsProcessing(true);
    setResponse(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const res = await fetch(`${backendUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: textToSend,
          mode: "companion",
          robot_id: robotId
        })
      });

      const data = await res.json();
      const replyText = (data.success && data.data?.response_text)
        ? data.data.response_text
        : "Dạ, cháu Kiến An đã lắng nghe và sẵn sàng hỗ trợ Bác ạ.";

      setResponse(replyText);
      speakText(replyText);

      // Lưu đoạn chat vào Firestore
      try {
        await addDoc(collection(db, "chat_history"), {
          robot_id: robotId,
          sender: "user",
          text: textToSend,
          timestamp: serverTimestamp()
        });
        await addDoc(collection(db, "chat_history"), {
          robot_id: robotId,
          sender: "bot",
          text: replyText,
          timestamp: serverTimestamp()
        });
      } catch (e) {}

    } catch (err) {
      setResponse("Dạ, cháu Kiến An đã ghi nhận. Bác có thể mở trang chat để trao đổi chi tiết hơn nhé!");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenFullChat = () => {
    onClose();
    router.push("/chat");
  };

  if (!isOpen) return null;

  const currentDisplaySpeech = transcript || interimText || "";

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex flex-col justify-between p-6 animate-fadeIn select-none">
      {/* Header Modal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-none">
              Trợ Lý Giọng Nói An
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isListening ? "Đang lắng nghe..." : isProcessing ? "Đang xử lý..." : isSpeaking ? "Đang trả lời..." : "Sẵn sàng"}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Trung tâm: Vòng Tròn Sóng Âm Siri Bắt Mắt (Siri Glowing Orb Animation) */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-6 my-auto">
        <div className="relative flex items-center justify-center">
          {/* Lớp hào quang neon tỏa sáng đa sắc */}
          <div className={`absolute w-36 h-36 rounded-full blur-2xl transition-all duration-700 ${
            isListening 
              ? "bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-500 opacity-80 scale-125 animate-pulse" 
              : isProcessing 
              ? "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-500 opacity-75 animate-spin" 
              : isSpeaking 
              ? "bg-gradient-to-tr from-emerald-400 via-teal-500 to-blue-500 opacity-80 scale-110" 
              : "bg-blue-600/40 opacity-50"
          }`} />

          {/* Vòng sóng âm thanh co giãn theo nhịp */}
          <button
            onClick={() => {
              if (isListening) {
                handleSendVoiceQuery();
              } else {
                startListening();
              }
            }}
            className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-2xl ring-4 ring-white/20 hover:scale-105 active:scale-95 transition-transform"
          >
            {isProcessing ? (
              <Sparkles className="w-8 h-8 animate-spin" />
            ) : isListening ? (
              <Radio className="w-8 h-8 animate-pulse text-cyan-200" />
            ) : isSpeaking ? (
              <Volume2 className="w-8 h-8 animate-bounce text-emerald-200" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </button>
        </div>

        {/* Live Audio Equalizer Waveform */}
        {isListening && (
          <div className="flex items-center space-x-1.5 h-6">
            <div className="w-1 bg-cyan-400 rounded-full animate-[bounce_0.8s_infinite_100ms] h-3" />
            <div className="w-1 bg-blue-400 rounded-full animate-[bounce_0.8s_infinite_200ms] h-6" />
            <div className="w-1 bg-indigo-400 rounded-full animate-[bounce_0.8s_infinite_300ms] h-4" />
            <div className="w-1 bg-teal-400 rounded-full animate-[bounce_0.8s_infinite_150ms] h-5" />
            <div className="w-1 bg-cyan-400 rounded-full animate-[bounce_0.8s_infinite_250ms] h-3" />
          </div>
        )}

        {/* Nội dung giọng nói nhận diện thời gian thực */}
        <div className="w-full max-w-sm text-center px-4 space-y-2">
          {currentDisplaySpeech ? (
            <div className="p-3.5 bg-white/10 rounded-2xl border border-white/15 backdrop-blur-md">
              <p className="text-xs text-slate-400 font-medium">Bạn vừa nói:</p>
              <p className="text-sm font-bold text-white mt-0.5 leading-snug">
                &ldquo;{currentDisplaySpeech}&rdquo;
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 font-medium animate-pulse">
              Hãy nói câu hỏi của bạn (VD: &ldquo;Cụ bị chóng mặt thì nên làm gì?&rdquo;)...
            </p>
          )}

          {/* Phản hồi từ Robot An */}
          {response && (
            <div className="p-4 bg-blue-600/20 border border-blue-400/30 rounded-2xl text-left backdrop-blur-md space-y-2 animate-slideUp">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-300">
                <Bot className="w-3.5 h-3.5" />
                <span>Chú Kiến An trả lời:</span>
              </div>
              <p className="text-xs text-white leading-relaxed font-medium whitespace-pre-line">
                {response}
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-500/20 border border-red-400/30 rounded-xl text-xs text-red-200">
              {errorMessage}
            </div>
          )}
        </div>
      </div>

      {/* Footer Hành Động */}
      <div className="flex items-center space-x-2 pt-2">
        <button
          onClick={() => {
            if (isListening) {
              handleSendVoiceQuery();
            } else {
              startListening();
            }
          }}
          className="flex-1 py-3 bg-medical-blue hover:bg-medical-hover text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center space-x-1.5 active:scale-98 transition-all"
        >
          {isListening ? (
            <>
              <Send className="w-4 h-4" />
              <span>Gửi câu hỏi ngay</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              <span>Bấm để nói lại</span>
            </>
          )}
        </button>

        <button
          onClick={handleOpenFullChat}
          className="py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs border border-white/20 flex items-center space-x-1 transition-colors"
          title="Mở toàn màn hình hội thoại chat"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">Mở Chat</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
