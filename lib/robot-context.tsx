"use client";

import React, { createContext, useContext, ReactNode } from "react";

// ID hồ sơ/robot của user đang đăng nhập, do AuthGate xác định: robot thật đã được gán
// owner_uid = uid (VD an_robot_01), nếu chưa có thì là hồ sơ cá nhân medical_records/{uid}.
const RobotContext = createContext<string | null>(null);

export function RobotProvider({ robotId, children }: { robotId: string; children: ReactNode }) {
  return <RobotContext.Provider value={robotId}>{children}</RobotContext.Provider>;
}

export function useRobotId() {
  const robotId = useContext(RobotContext);
  if (!robotId) throw new Error("useRobotId must be used inside RobotProvider");
  return robotId;
}
