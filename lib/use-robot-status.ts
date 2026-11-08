"use client";

import { useEffect, useState } from "react";
import { db, doc, onSnapshot, RobotStatus } from "@/lib/firebase";
import { robotConnection } from "@/lib/robot-status";

// Khi robot mất kết nối sẽ không còn dữ liệu mới đẩy về, nên phải tự tính lại theo đồng hồ.
const TICK_MS = 5000;

export function useRobotStatus(robotId: string) {
  const [status, setStatus] = useState<RobotStatus | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setStatus(null);
    setLoaded(false);
    return onSnapshot(
      doc(db, "status", robotId),
      (snap) => {
        setStatus(snap.exists() ? (snap.data() as RobotStatus) : null);
        setNow(Date.now());
        setLoaded(true);
      },
      () => setLoaded(true)
    );
  }, [robotId]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  return { status, loaded, now, connection: robotConnection(status, now) };
}
