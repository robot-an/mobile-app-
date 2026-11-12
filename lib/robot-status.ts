import type { RobotStatus } from "@/lib/firebase";

// Robot gửi dữ liệu mỗi 5 giây, backend giới hạn ghi Firestore tối đa 30 giây/lần (trừ khi có sự kiện).
// Quá ngưỡng 90 giây coi như mất kết nối dù cờ is_online còn true, vì cờ không kịp tắt khi máy chủ ngừng đột ngột.
export const FRESH_WINDOW_MS = 90_000;
// Không có WiFi (ra ngoài đường), robot báo qua 4G 2 phút/lần khi di chuyển, 10 phút/lần khi đứng yên.
export const LTE_FRESH_WINDOW_MS = 12 * 60_000;

export type RobotConnection = "connected" | "disconnected" | "never";

// Backend ghi link = "4g" cho bản tin gửi qua 4G, "wifi" cho bản tin qua WebSocket.
export function viaLte(status: RobotStatus | null): boolean {
  return (status as (RobotStatus & { link?: string }) | null)?.link === "4g";
}

function freshWindow(status: RobotStatus | null): number {
  return viaLte(status) ? LTE_FRESH_WINDOW_MS : FRESH_WINDOW_MS;
}

function isFresh(iso: string | undefined, now: number, windowMs: number): boolean {
  if (!iso) return false;
  const at = Date.parse(iso);
  return !Number.isNaN(at) && now - at < windowMs;
}

export function robotConnection(status: RobotStatus | null, now: number): RobotConnection {
  if (!status?.last_active) return "never";
  return status.is_online && isFresh(status.last_active, now, freshWindow(status)) ? "connected" : "disconnected";
}

// location_updated_at chỉ có khi robot thật sự gửi tọa độ GPS, nên tọa độ mẫu không bị coi là thật.
export function hasRealPosition(status: RobotStatus | null): boolean {
  return Boolean(status?.location_updated_at);
}

export function gpsHasSignal(status: RobotStatus | null, now: number): boolean {
  return isFresh(status?.location_updated_at, now, freshWindow(status));
}

export function timeAgo(iso: string | undefined, now: number): string {
  const at = iso ? Date.parse(iso) : NaN;
  if (Number.isNaN(at)) return "chưa có dữ liệu";
  const seconds = Math.max(0, Math.floor((now - at) / 1000));
  if (seconds < 10) return "vừa xong";
  if (seconds < 60) return `${seconds} giây trước`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
  return `${Math.floor(seconds / 86400)} ngày trước`;
}
