"use client";

import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BatteryMedium,
  ChevronRight,
  Footprints,
  Loader2,
  LucideIcon,
  MapPin,
  Sparkles,
  Wifi,
  WifiOff
} from "lucide-react";
import { auth, RobotStatus } from "@/lib/firebase";
import { useRobotId } from "@/lib/robot-context";
import { useRobotStatus } from "@/lib/use-robot-status";
import { gpsHasSignal, hasRealPosition, RobotConnection, timeAgo } from "@/lib/robot-status";

type HeroState = RobotConnection | "loading" | "unpaired";

const HERO: Record<HeroState, { title: string; icon: LucideIcon; tone: string; spin?: boolean }> = {
  loading: { title: "Đang kiểm tra kết nối", icon: Loader2, tone: "bg-slate-50 border-slate-200 text-slate-700", spin: true },
  connected: { title: "Đã kết nối", icon: Wifi, tone: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  disconnected: { title: "Mất kết nối", icon: WifiOff, tone: "bg-red-50 border-red-200 text-red-700" },
  never: { title: "Chưa kết nối", icon: WifiOff, tone: "bg-amber-50 border-amber-200 text-amber-700" },
  unpaired: { title: "Chưa liên kết robot", icon: WifiOff, tone: "bg-slate-50 border-slate-200 text-slate-700" }
};

const MOTION_LABEL = {
  stationary: "Đứng yên",
  moving: "Di chuyển",
  shaking: "Rung lắc",
  free_fall: "Rơi tự do"
} as const;

const MODE_LABEL = { companion: "Đồng hành", speech_learning: "Học nói" } as const;

function heroDetail(state: HeroState, lastActive: string | undefined, now: number): string {
  switch (state) {
    case "loading":
      return "Vui lòng chờ trong giây lát.";
    case "connected":
      return `Robot đang trực tuyến, cập nhật ${timeAgo(lastActive, now)}.`;
    case "disconnected":
      return `Robot không còn gửi dữ liệu. Lần cuối: ${timeAgo(lastActive, now)}.`;
    case "never":
      return "Hệ thống chưa nhận được dữ liệu nào từ robot.";
    case "unpaired":
      return "Tài khoản này chưa được gán robot. Hãy nhờ người quản lý robot gán cho bạn.";
  }
}

function gpsText(status: RobotStatus, now: number): string {
  if (gpsHasSignal(status, now)) return "Có tín hiệu";
  return hasRealPosition(status) ? "Mất tín hiệu" : "Chưa có";
}

function Tile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-card flex items-center gap-2.5 min-w-0">
      <div className="w-9 h-9 rounded-xl bg-blue-50 text-medical-blue border border-blue-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-slate-500">{label}</p>
        <p className="text-sm font-bold text-slate-900 truncate">{value}</p>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
      <span className="text-xs text-slate-500 flex-shrink-0">{label}</span>
      <span className="text-xs font-bold text-slate-900 truncate">{value}</span>
    </div>
  );
}

export default function RobotOverviewPage() {
  const robotId = useRobotId();
  const { status, loaded, now, connection } = useRobotStatus(robotId);

  const isUnpaired = robotId === auth.currentUser?.uid;
  const state: HeroState = isUnpaired ? "unpaired" : loaded ? connection : "loading";
  const hero = HERO[state];
  const HeroIcon = hero.icon;
  const hasAlert = Boolean(status?.sos_alert || status?.fall_detected);
  const showTips = state === "disconnected" || state === "never";

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-3 select-none">
      <section role="status" className={`rounded-2xl p-4 border shadow-card flex items-center gap-3 ${hero.tone}`}>
        <div className="w-12 h-12 rounded-2xl bg-white/80 flex items-center justify-center flex-shrink-0">
          <HeroIcon className={`w-6 h-6 ${hero.spin ? "animate-spin" : ""}`} />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-extrabold leading-tight">{hero.title}</h2>
          <p className="text-xs font-medium mt-0.5">{heroDetail(state, status?.last_active, now)}</p>
        </div>
      </section>

      {hasAlert && (
        <Link
          href="/alerts"
          className="rounded-2xl p-3 bg-red-600 text-white shadow-card flex items-center justify-between gap-2 active:scale-[0.99] transition-transform"
        >
          <span className="flex items-center gap-2 text-xs font-bold min-w-0">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Đang có cảnh báo khẩn cấp
          </span>
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
        </Link>
      )}

      {showTips && (
        <section className="bg-white rounded-2xl p-3 border border-slate-200 shadow-card">
          <h3 className="text-xs font-bold text-slate-900 mb-1.5">Cách kiểm tra</h3>
          <ol className="list-decimal pl-4 space-y-1 text-xs text-slate-600">
            <li>Xem robot đã bật nguồn và màn hình có sáng không.</li>
            <li>Kiểm tra WiFi ở nơi đặt robot vẫn hoạt động.</li>
            <li>Nếu vừa đổi WiFi, nối điện thoại vào mạng RobotAn-Setup của robot để nhập lại.</li>
          </ol>
        </section>
      )}

      {status && !isUnpaired && (
        <>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">
            {connection === "connected" ? "Thông số hiện tại" : "Dữ liệu gần nhất"}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Tile icon={BatteryMedium} label="Pin" value={status.battery != null ? `${status.battery}%` : "Chưa có"} />
            <Tile icon={MapPin} label="GPS" value={gpsText(status, now)} />
            <Tile icon={Footprints} label="Chuyển động" value={MOTION_LABEL[status.motion_state ?? "stationary"]} />
            <Tile icon={Sparkles} label="Chế độ" value={MODE_LABEL[status.mode ?? "companion"]} />
          </div>
        </>
      )}

      {!isUnpaired && (
        <section className="bg-white rounded-2xl p-3 border border-slate-200 shadow-card divide-y divide-slate-100">
          <InfoRow label="Mã robot" value={robotId} />
          <InfoRow label="Hoạt động gần nhất" value={timeAgo(status?.last_active, now)} />
          <InfoRow label="Vị trí GPS gần nhất" value={timeAgo(status?.location_updated_at, now)} />
        </section>
      )}
    </div>
  );
}
