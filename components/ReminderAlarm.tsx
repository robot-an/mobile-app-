"use client";

import { useEffect, useRef } from "react";
import { CareSchedule, db, collection, onSnapshot, query, where } from "@/lib/firebase";
import { getVietnamNow } from "@/lib/time";

// Chuong bao thuc that (khong can file audio) - tong hop bang Web Audio API,
// kieu chuong cua 2 not "ding-dong" de nguoi dung phan biet duoc voi tieng thong bao thuong.
function playBellChime() {
  if (typeof window === "undefined") return;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return;

  const ctx = new AudioCtx();
  const notes: Array<{ freq: number; start: number; duration: number }> = [
    { freq: 880, start: 0, duration: 0.5 },
    { freq: 659.25, start: 0.28, duration: 0.6 }
  ];

  notes.forEach(({ freq, start, duration }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;

    const startTime = ctx.currentTime + start;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(0.35, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  });

  setTimeout(() => ctx.close().catch(() => {}), 1500);
}

// Component nay duoc mount 1 lan duy nhat trong layout.tsx (ngang hang MobileHeader/BottomNav)
// nen bao thuc chay xuyen suot toan app, khong phu thuoc dang o trang nao.
export default function ReminderAlarm({ robotId = "an_robot_01" }: { robotId?: string }) {
  const schedulesRef = useRef<CareSchedule[]>([]);
  const firedThisMinuteRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    try {
      const q = query(collection(db, "care_schedules"), where("robot_id", "==", robotId));
      const unsub = onSnapshot(q, (snapshot) => {
        const loaded: CareSchedule[] = [];
        snapshot.forEach((d) => loaded.push({ id: d.id, ...d.data() } as CareSchedule));
        schedulesRef.current = loaded;
      });
      return () => unsub();
    } catch (e) {}
  }, [robotId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    const checkAlarms = () => {
      const { hhmm, weekday } = getVietnamNow();

      schedulesRef.current.forEach((sched) => {
        if (!sched.is_active) return;
        if (sched.time_of_day !== hhmm) return;
        if (!sched.days_of_week?.includes(weekday)) return;

        const fireKey = `${sched.id}_${hhmm}`;
        if (firedThisMinuteRef.current.has(fireKey)) return;
        firedThisMinuteRef.current.add(fireKey);

        // 1. Chuông báo thức thật (âm thanh, khác tiếng thông báo thường)
        playBellChime();

        // 2. Thông báo trực quan trên điện thoại
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(sched.title, { body: sched.voice_prompt_template, tag: fireKey });
        }

        // 3. Đọc to nội dung nhắc bằng giọng tiếng Việt
        if ("speechSynthesis" in window) {
          const utter = new SpeechSynthesisUtterance(sched.voice_prompt_template);
          utter.lang = "vi-VN";
          window.speechSynthesis.speak(utter);
        }
      });

      firedThisMinuteRef.current.forEach((key) => {
        if (!key.endsWith(`_${hhmm}`)) firedThisMinuteRef.current.delete(key);
      });
    };

    checkAlarms();
    const interval = setInterval(checkAlarms, 20000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
