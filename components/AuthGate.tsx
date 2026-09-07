"use client";

import React, { useEffect, useState } from "react";
import {
  auth,
  onAuthStateChanged,
  User as FirebaseUser,
  db,
  doc,
  onSnapshot,
  MedicalRecord
} from "@/lib/firebase";
import LoadingScreen from "@/components/LoadingScreen";
import LoginScreen from "@/components/LoginScreen";
import SetupWizard from "@/components/SetupWizard";

const ROBOT_ID = "an_robot_01";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);

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
    if (!user) {
      setRecordLoading(false);
      return;
    }
    setRecordLoading(true);
    try {
      const unsub = onSnapshot(
        doc(db, "medical_records", ROBOT_ID),
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
      return () => unsub();
    } catch (e) {
      setRecordLoading(false);
    }
  }, [user]);

  if (authLoading) {
    return <LoadingScreen message="Đang kiểm tra đăng nhập..." />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (recordLoading) {
    return <LoadingScreen message="Đang tải Sổ Y Bạ..." />;
  }

  if (!setupDone) {
    return <SetupWizard robotId={ROBOT_ID} user={user} onComplete={() => setSetupDone(true)} />;
  }

  return <>{children}</>;
}
