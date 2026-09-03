"use client";

import React, { useEffect, useRef } from "react";

interface Props {
  isActive: boolean;
}

export default function EmergencySirenSound({ isActive }: Props) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    if (!isActive) {
      // Tắt còi khi không còn báo động
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
          oscillatorRef.current.disconnect();
        } catch (e) {}
        oscillatorRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Kích hoạt rung điện thoại nếu hỗ trợ
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([500, 250, 500, 250, 1000]);
      } catch (e) {}
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // 880Hz

      gain.gain.setValueAtTime(0.15, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      oscillatorRef.current = osc;
      gainNodeRef.current = gain;

      // Hiệu ứng còi cảnh sát luân phiên tần số (880Hz <-> 600Hz)
      let high = true;
      intervalRef.current = setInterval(() => {
        if (!oscillatorRef.current || !audioCtxRef.current) return;
        const now = audioCtxRef.current.currentTime;
        const targetFreq = high ? 600 : 950;
        oscillatorRef.current.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.2);
        high = !high;
      }, 400);

    } catch (err) {
      console.warn("Lỗi phát âm thanh còi báo động:", err);
    }

    return () => {
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
        } catch (e) {}
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  return null;
}
