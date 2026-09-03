"use client";

import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface HeaderActionState {
  icon: LucideIcon;
  onClick: () => void;
  loading?: boolean;
  label?: string;
}

interface HeaderActionContextValue {
  action: HeaderActionState | null;
  setAction: (action: HeaderActionState | null) => void;
}

const HeaderActionContext = createContext<HeaderActionContextValue | null>(null);

export function HeaderActionProvider({ children }: { children: ReactNode }) {
  const [action, setAction] = useState<HeaderActionState | null>(null);
  return (
    <HeaderActionContext.Provider value={{ action, setAction }}>
      {children}
    </HeaderActionContext.Provider>
  );
}

export function useHeaderActionContext() {
  const ctx = useContext(HeaderActionContext);
  if (!ctx) throw new Error("useHeaderActionContext must be used inside HeaderActionProvider");
  return ctx;
}

// Cho phep 1 trang dang ky 1 icon action tren navbar chung (VD: nut Luu).
// onClick luon goi ham moi nhat qua ref nen khong lam effect chay lai moi render.
export function useHeaderAction(icon: LucideIcon, onClick: () => void, options?: { loading?: boolean; label?: string }) {
  const { setAction } = useHeaderActionContext();
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;
  const loading = options?.loading;
  const label = options?.label;

  useEffect(() => {
    setAction({ icon, loading, label, onClick: () => onClickRef.current() });
    return () => setAction(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [icon, loading, label]);
}
