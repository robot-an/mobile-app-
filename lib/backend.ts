import { auth } from "@/lib/firebase";

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://robot-an-backend.onrender.com";

// Gọi REST backend kèm Firebase ID token của user đang đăng nhập. Backend từ chối request
// không có token (401) hoặc robot_id không thuộc về user (403) - xem software/backend/api/auth.py.
export async function backendFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const token = await auth.currentUser?.getIdToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${BACKEND_URL}${path}`, { ...init, headers });
}
