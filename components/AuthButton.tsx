"use client";

import React, { useEffect, useState } from "react";
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from "@/lib/firebase";
import { LogOut, ShieldCheck } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Lỗi đăng nhập Google:", error);
      alert("Đăng nhập Google: " + (error?.message || "Có lỗi xảy ra"));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut(auth);
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-9 w-28 bg-beige-200/60 rounded-2xl animate-pulse"></div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center space-x-2.5 bg-beige-50 border border-beige-300 px-3 py-1.5 rounded-2xl shadow-sm">
        <UserAvatar user={user} size="sm" />
        <div className="hidden md:block text-left">
          <p className="text-xs font-bold text-navy-900 leading-tight">
            {user.displayName || user.email?.split("@")[0]}
          </p>
          <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5">
            <ShieldCheck className="w-3 h-3" /> Người giám hộ
          </span>
        </div>
        <button
          onClick={handleSignOut}
          title="Đăng xuất"
          className="p-1.5 hover:bg-beige-200 rounded-xl text-gray-500 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleGoogleSignIn}
      className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-2xl bg-white hover:bg-beige-50 border-2 border-beige-300 text-navy-900 font-bold text-xs shadow-sm transition-all hover:border-medical-blue active:scale-95"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
        />
      </svg>
      <span>Đăng nhập Google</span>
    </button>
  );
}
