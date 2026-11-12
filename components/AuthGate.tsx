"use client";

import React, { useEffect, useState } from "react";
import {
  auth,
  onAuthStateChanged,
  User as FirebaseUser,
  db,
  doc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  MedicalRecord
} from "@/lib/firebase";
import { RobotProvider } from "@/lib/robot-context";
import LoadingScreen from "@/components/LoadingScreen";
import LoginScreen from "@/components/LoginScreen";
import SetupWizard from "@/components/SetupWizard";

const RESOLVE_ATTEMPTS = 3;

// Mỗi tài khoản có hồ sơ riêng (xem firestore.rules): ưu tiên robot thật đã được gán
// owner_uid = uid, nếu chưa có thì dùng hồ sơ cá nhân medical_records/{uid}.
//
// Ngay sau khi đăng nhập, truy vấn đầu tiên có thể bị Firestore từ chối vì token chưa kịp gắn vào
// kết nối. Bản cũ coi lỗi đó như "không có robot" và mở hồ sơ cá nhân, nên chủ robot thấy
// "chưa liên kết robot" cho tới khi tải lại trang. Giờ chờ token sẵn sàng rồi thử lại vài lần.
async function resolveRobotId(user: FirebaseUser): Promise<string> {
  for (let attempt = 1; attempt <= RESOLVE_ATTEMPTS; attempt++) {
    try {
      await user.getIdToken();
      const owned = await getDocs(
        query(collection(db, "medical_records"), where("owner_uid", "==", user.uid))
      );
      const robotDoc = owned.docs.find((d) => d.id !== user.uid);
      return robotDoc ? robotDoc.id : user.uid;
    } catch (e) {
      console.warn(`Không tra được robot đã sở hữu (lần ${attempt}/${RESOLVE_ATTEMPTS}):`, e);
      if (attempt < RESOLVE_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 700 * attempt));
      }
    }
  }
  return user.uid;
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);

  const [robotId, setRobotId] = useState<string | null>(null);
  const [recordLoading, setRecordLoading] = useState(true);
  const [setupDone, setSetupDone] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    setRobotId(null);
    if (!user) {
      setRecordLoading(false);
      return;
    }
    setRecordLoading(true);

    let cancelled = false;
    let unsub: (() => void) | undefined;

    resolveRobotId(user).then((resolvedId) => {
      if (cancelled) return;
      setRobotId(resolvedId);
      try {
        unsub = onSnapshot(
          doc(db, "medical_records", resolvedId),
          (snap) => {
            if (snap.exists()) {
              const data = snap.data() as MedicalRecord;
              // Tương thích ngược: hồ sơ cũ chưa có cờ setup_completed nhưng đã có tên
              // vẫn được coi là đã thiết lập, tránh bắt setup lại vô ích.
              setSetupDone(Boolean(data.setup_completed || data.full_name));
            } else {
              setSetupDone(false);
            }
            setRecordLoading(false);
          },
          () => setRecordLoading(false)
        );
      } catch (e) {
        setRecordLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [user]);

  if (authLoading) {
    return <LoadingScreen message="Đang kiểm tra đăng nhập..." />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (recordLoading || !robotId) {
    return <LoadingScreen message="Đang tải Sổ Y Bạ..." />;
  }

  if (!setupDone) {
    return <SetupWizard robotId={robotId} user={user} onComplete={() => setSetupDone(true)} />;
  }

  return <RobotProvider robotId={robotId}>{children}</RobotProvider>;
}
